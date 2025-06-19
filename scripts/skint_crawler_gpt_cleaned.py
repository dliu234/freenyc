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

def extract_article_link(article):
    h2 = article.find("h2")
    if h2:
        a = h2.find("a", href=True)
        if a and a["href"]:
            href = a["href"]
            if "theskint.com" not in href:
                href = f"{SOURCE_URL.rstrip('/')}/{href.lstrip('/')}"
            return href

    for a in article.find_all("a", href=True):
        href = a["href"]
        if href and not href.startswith("#"):
            if "theskint.com" not in href:
                href = f"{SOURCE_URL.rstrip('/')}/{href.lstrip('/')}"
            return href

    return SOURCE_URL

def extract_text_from_articles(articles):
    event_texts = []
    for i, article in enumerate(articles):
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        link = extract_article_link(article)

        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # ✅ 加入正文中所有 <a href> 外链
        external_links = [a["href"] for a in content_el.find_all("a", href=True)]
        if external_links:
            content += "\n\nRelated links:\n" + "\n".join(external_links)

        full_text = f"{title}\n\n{content}\n\nFull link: {link}"

        if len(content) > 80:
            event_texts.append(full_text)
        else:
            print(f"⚠️ Skipped article {i+1}, content too short")

    print(f"📝 Extracted {len(event_texts)} usable article blocks")
    return event_texts

def extract_event_summary(text):
    prompt = f"""
You are an event summarizer.

From the following article, extract only the **free events in New York City** and format each in Markdown like this:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 One-line Description  
  🔗 [Link](https://full-link)

**Important rules**:
- Always include the Link line — never leave it empty.
- If there is a link in the article or in "Related links" or "Full link", use it.
- Use exactly the full URL — copy and paste it.
- Never write example.com, "...", "not provided", or leave [Link] blank.

Here is the article:

{text[:3000]}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )
        content = result.choices[0].message.content.strip()

        if content.startswith("```markdown"):
            content = content.removeprefix("```markdown").strip()
        if content.startswith("```"):
            content = content.removeprefix("```").strip()
        if content.endswith("```"):
            content = content.removesuffix("```").strip()

        print(f"🧾 GPT result sample:\n{content[:150]}...\n")
        return content
    except Exception as e:
        print(f"❌ GPT call failed: {e}")
        return ""

def save_outputs(markdown_data, all_articles, today):
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.md", "w", encoding="utf-8") as mf:
        mf.write(markdown_data)
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(all_articles, jf, indent=2, ensure_ascii=False)
    print("✅ Output files saved to /output")

def main():
    articles = fetch_all_articles()
    article_texts = extract_text_from_articles(articles)

    summaries = []
    for i, text in enumerate(article_texts):
        print(f"🔍 Processing article {i+1}")
        summary = extract_event_summary(text)
        if summary:
            summaries.append(summary)

    today = datetime.now().strftime("%Y-%m-%d")
    final_md = "\n\n".join(summaries)
    save_outputs(final_md, article_texts, today)

    print("🎯 Script completed.")

if __name__ == "__main__":
    main()
