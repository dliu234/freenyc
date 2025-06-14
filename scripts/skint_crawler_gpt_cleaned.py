import requests
from bs4 import BeautifulSoup
import openai
import os
from datetime import datetime
import json

openai.api_key = os.getenv("OPENAI_API_KEY")

SOURCE_URL = "https://theskint.com"
HEADERS = {"User-Agent": "Mozilla/5.0"}
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_articles():
    try:
        response = requests.get(SOURCE_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = soup.find_all('article')
        print(f"✅ Found {len(articles)} <article> blocks")
        return articles
    except Exception as e:
        print(f"❌ Failed to fetch or parse HTML: {e}")
        return []

def extract_text_from_articles(articles):
    event_texts = []
    for i, article in enumerate(articles):
        paragraphs = article.find_all('p')
        combined_text = "\n".join([p.get_text(strip=True) for p in paragraphs])
        if len(combined_text) > 50:
            event_texts.append(combined_text)
        else:
            print(f"⚠️ Skipped article {i+1}, text too short")
    print(f"📝 Extracted {len(event_texts)} usable event descriptions")
    return event_texts

def extract_event_summary(text):
    prompt = f"""
Extract the following fields from the NYC event description and return a valid JSON object only (no explanation, no markdown):

{{
  "title": "",
  "date": "",
  "time": "",
  "location": "",
  "description": "",
  "rsvp_required": true or false,
  "source": "{SOURCE_URL}"
}}

Event description:
{text[:3000]}
"""
    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        content = result.choices[0].message.content.strip()

        if content.startswith("```json"):
            content = content.removeprefix("```json").strip()
        if content.startswith("```"):
            content = content.removeprefix("```").strip()
        if content.endswith("```"):
            content = content.removesuffix("```").strip()

        print(f"🧾 GPT raw: {content[:150]}...")
        return content
    except Exception as e:
        print(f"❌ GPT call failed: {e}")
        return json.dumps({"error": str(e)})

def save_outputs(json_data, markdown_data, today):
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(json_data, jf, indent=2)
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.md", "w", encoding="utf-8") as mf:
        mf.write(markdown_data)
    print("✅ Output files saved to /output")

def main():
    articles = fetch_articles()
    event_texts = extract_text_from_articles(articles)

    today = datetime.now().strftime("%Y-%m-%d")
    json_output = []
    markdown_output = ""

    for i, raw_text in enumerate(event_texts[:5]):
        print(f"🔍 Processing event {i+1}")
        summary = extract_event_summary(raw_text)
        try:
            event_data = json.loads(summary)
            json_output.append(event_data)

            md_card = f"""### 🎉 {event_data.get("title", "No Title")}

📍 Location: {event_data.get("location", "Unknown")}  
🕒 Time: {event_data.get("date", "")} {event_data.get("time", "")}  
📝 {event_data.get("description", "")}  
🔗 Source: [{SOURCE_URL}]({SOURCE_URL})  
✅ RSVP Required: {event_data.get("rsvp_required", False)}

---
"""
            markdown_output += md_card + "\n"
        except Exception as err:
            print(f"❌ Failed to parse GPT response for event {i+1}: {err}")

    save_outputs(json_output, markdown_output, today)
    print("🎯 Script completed.")

if __name__ == "__main__":
    main()
