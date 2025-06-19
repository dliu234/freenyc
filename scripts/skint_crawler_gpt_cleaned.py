import requests
from bs4 import BeautifulSoup
import openai
import os
import json
from datetime import datetime

openai.api_key = os.getenv("OPENAI_API_KEY")

SOURCE_URL = "https://theskint.com"
HEADERS = {"User-Agent": "Mozilla/5.0"}
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_all_articles():
    page = 1
    all_articles = []

    while True:
        url = f"{SOURCE_URL}/page/{page}/" if page > 1 else SOURCE_URL
        print(f"🌐 Fetching: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            articles = soup.find_all("article")

            if not articles:
                print(f"🚫 No <article> found on page {page}, stopping.")
                break

            print(f"✅ Page {page}: Found {len(articles)} <article> blocks")
            all_articles.extend(articles)
            page += 1
        except Exception as e:
            print(f"❌ Failed to fetch page {page}: {e}")
            break

    return all_articles

def extract_text_from_articles(articles):
    event_items = []

    for i, article in enumerate(articles):
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # extract link
        event_link = None
        all_links = content_el.find_all("a", href=True)
        for a in all_links:
            if ">>" in a.get_text(strip=True):
                event_link = a["href"]
                break
        if not event_link and all_links:
            event_link = all_links[0]["href"]

        if len(content) > 80:
            event_items.append({
                "title": title,
                "raw_text": content,
                "link": event_link or SOURCE_URL
            })
        else:
            print(f"⚠️ Skipped article {i+1}, content too short")

    print(f"📝 Extracted {len(event_items)} event items")
    return event_items

def summarize_event(text):
    prompt = f"""
Summarize the following free public event in New York City in Markdown format:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 One-line Description  

Text:
{text[:3000]}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )
        content = result.choices[0].message.content.strip()

        # Clean markdown fences if any
        if content.startswith("```markdown"):
            content = content.removeprefix("```markdown").strip()
        if content.startswith("```"):
            content = content.removeprefix("```").strip()
        if content.endswith("```"):
            content = content.removesuffix("```").strip()

        return content
    except Exception as e:
        print(f"❌ GPT summarization failed: {e}")
        return ""

def generate_markdown(events):
    markdown_blocks = []
    for i, event in enumerate(events):
        print(f"🔍 Summarizing event {i+1}")
        md = summarize_event(event["raw_text"])
        if md:
            # add link
            md += f"\n🔗 [Link]({event['link']})"
            markdown_blocks.append(md)

    return "\n\n".join(markdown_blocks)

def save_outputs(markdown_data, all_articles, today):
    with open(f"{OUTPUT_DIR}/events_md_{today}.md", "w", encoding="utf-8") as mf:
        mf.write(markdown_data)
    with open(f"{OUTPUT_DIR}/events_data_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(all_articles, jf, indent=2, ensure_ascii=False)
    print("✅ Output saved to /output")

def main():
    articles = fetch_all_articles()
    parsed_events = extract_text_from_articles(articles)
    today = datetime.now().strftime("%Y-%m-%d")
    markdown_output = generate_markdown(parsed_events)
    save_outputs(markdown_output, parsed_events, today)
    print("🎯 Script finished.")

if __name__ == "__main__":
    main()
