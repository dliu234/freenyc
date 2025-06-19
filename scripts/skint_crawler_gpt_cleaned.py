import requests
from bs4 import BeautifulSoup
import openai
import os
import json
from datetime import datetime
import re
from urllib.parse import urljoin, urlparse

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

def extract_all_links_from_article(article):
    """提取文章中所有的链接，特别关注 >> 链接"""
    links = []
    
    # 查找所有的链接
    all_links = article.find_all("a", href=True)
    
    for a in all_links:
        href = a.get("href", "").strip()
        link_text = a.get_text(strip=True)
        
        # 跳过空链接
        if not href:
            continue
            
        # 处理相对链接
        if href.startswith('/'):
            href = urljoin(SOURCE_URL, href)
        elif not href.startswith(('http://', 'https://')):
            href = urljoin(SOURCE_URL, href)
        
        # 记录链接信息
        links.append({
            'url': href,
            'text': link_text,
            'is_read_more': link_text == ">>"
        })
    
    return links

def extract_article_link(article):
    """提取文章的主要链接，优先选择 >> 链接"""
    links = extract_all_links_from_article(article)
    
    # 优先查找 >> 链接
    for link in links:
        if link['is_read_more']:
            return link['url']
    
    # 如果没有 >> 链接，尝试从标题中获取链接
    h2 = article.find("h2")
    if h2:
        a = h2.find("a", href=True)
        if a and a["href"]:
            href = a["href"].strip()
            if href.startswith('/'):
                href = urljoin(SOURCE_URL, href)
            elif not href.startswith(('http://', 'https://')):
                href = urljoin(SOURCE_URL, href)
            return href
    
    # 最后的备选方案：返回第一个有效的外部链接
    for link in links:
        if link['url'] != SOURCE_URL and not link['url'].endswith('#'):
            return link['url']
    
    return SOURCE_URL

def extract_text_from_articles(articles):
    event_texts = []
    for i, article in enumerate(articles):
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        # 获取主要链接
        main_link = extract_article_link(article)
        
        # 获取所有链接信息
        all_links = extract_all_links_from_article(article)

        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # 构建完整文本，包含所有链接信息
        links_info = "\n".join([f"Link: {link['text']} -> {link['url']}" for link in all_links])
        
        full_text = f"{title}\n\n{content}\n\nMain link: {main_link}\n\nAll links:\n{links_info}"

        if len(content) > 80:
            event_texts.append(full_text)
        else:
            print(f"⚠️ Skipped article {i+1}, content too short")

    print(f"📝 Extracted {len(event_texts)} usable article blocks")
    return event_texts

def extract_event_summary(text):
    """改进的GPT提示，更好地处理链接"""
    prompt = f"""
From the following article text, extract and summarize only the **free public events in New York City**.
Pay special attention to the links provided in the text - use the actual URLs from the "All links" section.

Respond only in markdown bullet list format like this:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 Description  
  🔗 [Link](actual_url_from_the_text)

Important: Use the ACTUAL URLs from the "All links" section, not placeholder links.
If no free NYC events are found, return nothing.

Text:
{text[:4000]}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )
        content = result.choices[0].message.content.strip()

        # 清理markdown代码块
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
    """保存输出文件"""
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.md", "w", encoding="utf-8") as mf:
        mf.write(markdown_data)
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(all_articles, jf, indent=2, ensure_ascii=False)
    print("✅ Output files saved to /output")

def main():
    print("🚀 Starting The Skint crawler...")
    
    # 获取文章
    articles = fetch_all_articles()
    print(f"📰 Total articles found: {len(articles)}")
    
    # 提取文本
    article_texts = extract_text_from_articles(articles)

    # 处理每篇文章
    summaries = []
    for i, text in enumerate(article_texts):
        print(f"🔍 Processing article {i+1}/{len(article_texts)}")
        summary = extract_event_summary(text)
        if summary:
            summaries.append(summary)

    # 保存结果
    today = datetime.now().strftime("%Y-%m-%d")
    final_md = "\n\n".join(summaries)
    save_outputs(final_md, article_texts, today)

    print(f"🎯 Script completed. Generated {len(summaries)} event summaries.")

if __name__ == "__main__":
    main()
