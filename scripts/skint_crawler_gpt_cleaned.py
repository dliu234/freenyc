import requests
from bs4 import BeautifulSoup
import openai
import os
import datetime
import json

# Load OpenAI API key
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Output directories
os.makedirs("output", exist_ok=True)

# Crawl event data from theskint.com
def crawl_events():
    url = "https://theskint.com/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    articles = soup.find_all("article")
    results = []

    for article in articles:
        title_tag = article.find("h2", class_="entry-title")
        content_tag = article.find("div", class_="entry-content")

        if not title_tag or not content_tag:
            continue

        title = title_tag.get_text(strip=True)
        # Extract the full content, including embedded links and descriptions
        content = content_tag.get_text(separator="\n", strip=True)

        results.append({
            "title": title,
            "content": content,
            "link": None  # Removed link extraction; handled by GPT from content
        })

    return results

# Format event list with GPT into clean markdown
def generate_markdown(events):
    prompt = f"""You are formatting the following NYC events into clean markdown.

Please output in the following format for each event:

### 🎉 Event Title  
📍 Location  
🕒 Date and Time  
📝 One-sentence Description  
🔗 [Event Link](https://example.com)

Make sure:
- Output one block for each event
- Do not include backticks or markdown code blocks
- Use consistent spacing and clean formatting
- If the link is not available, omit the link line

Here are the events:

{json.dumps(events[:20], indent=2)}
"""
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()

# Main flow
def main():
    print("🔍 Crawling events from theskint.com...")
    events = crawl_events()

    if not events:
        print("❌ No events found.")
        return

    print(f"✅ Retrieved {len(events)} events.")
    markdown = generate_markdown(events)

    date_str = datetime.date.today().isoformat()
    md_path = f"output/events_md_{date_str}.md"
    json_path = f"output/events_raw_{date_str}.json"

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(markdown)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"✅ Markdown saved to {md_path}")
    print(f"✅ Raw JSON saved to {json_path}")

if __name__ == "__main__":
    main()
