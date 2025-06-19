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

def extract_markdown_links(text):
    """提取文本中的 Markdown 格式链接 [>>](URL)"""
    # 匹配 Markdown 链接格式：[text](url)
    markdown_link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    links = []
    
    matches = re.findall(markdown_link_pattern, text)
    for link_text, url in matches:
        links.append({
            'text': link_text.strip(),
            'url': url.strip(),
            'is_read_more': link_text.strip() == '>>'
        })
    
    return links

def extract_html_links(article):
    """提取 HTML 中的 <a> 标签链接"""
    links = []
    all_links = article.find_all("a", href=True)
    
    for a in all_links:
        href = a.get("href", "").strip()
        link_text = a.get_text(strip=True)
        
        if not href:
            continue
            
        # 处理相对链接
        if href.startswith('/'):
            href = urljoin(SOURCE_URL, href)
        elif not href.startswith(('http://', 'https://')):
            href = urljoin(SOURCE_URL, href)
        
        links.append({
            'url': href,
            'text': link_text,
            'is_read_more': link_text == ">>",
            'type': 'html'
        })
    
    return links

def find_best_link(article, content_text):
    """优先从内容文本中找 Markdown [>>] 链接，其次是 HTML 链接"""
    
    # 1. 首先尝试从内容文本中提取 Markdown 链接
    markdown_links = extract_markdown_links(content_text)
    
    # 优先选择 [>>] 链接
    for link in markdown_links:
        if link['is_read_more']:
            print(f"🔗 Found >> markdown link: {link['url']}")
            return link['url']
    
    # 2. 如果没有 >> markdown 链接，尝试 HTML 链接
    html_links = extract_html_links(article)
    
    # 优先选择 >> HTML 链接
    for link in html_links:
        if link['is_read_more']:
            print(f"🔗 Found >> HTML link: {link['url']}")
            return link['url']
    
    # 3. 尝试从标题中获取链接
    h2 = article.find("h2")
    if h2:
        a = h2.find("a", href=True)
        if a and a["href"]:
            href = a["href"].strip()
            if href.startswith('/'):
                href = urljoin(SOURCE_URL, href)
            elif not href.startswith(('http://', 'https://')):
                href = urljoin(SOURCE_URL, href)
            print(f"🔗 Found title link: {href}")
            return href
    
    # 4. 返回第一个有效的 markdown 链接
    for link in markdown_links:
        if link['url'] != SOURCE_URL and not link['url'].endswith('#'):
            print(f"🔗 Found first markdown link: {link['url']}")
            return link['url']
    
    # 5. 返回第一个有效的 HTML 链接
    for link in html_links:
        if link['url'] != SOURCE_URL and not link['url'].endswith('#'):
            print(f"🔗 Found first HTML link: {link['url']}")
            return link['url']
    
    print(f"🔗 No valid link found, using default: {SOURCE_URL}")
    return SOURCE_URL

def extract_text_from_articles(articles):
    event_texts = []
    for i, article in enumerate(articles):
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # 获取最佳链接
        main_link = find_best_link(article, content)
        
        # 提取所有链接信息用于调试
        markdown_links = extract_markdown_links(content)
        html_links = extract_html_links(article)
        
        # 构建链接信息字符串
        all_links_info = []
        if markdown_links:
            all_links_info.append("Markdown links:")
            for link in markdown_links:
                all_links_info.append(f"  [{link['text']}] -> {link['url']}")
        
        if html_links:
            all_links_info.append("HTML links:")
            for link in html_links:
                all_links_info.append(f"  {link['text']} -> {link['url']}")
        
        links_debug = "\n".join(all_links_info)
        
        full_text = f"""Title: {title}

Content:
{content}

Main link: {main_link}

All links found:
{links_debug}
"""

        if len(content) > 80:
            event_texts.append(full_text)
            print(f"✅ Article {i+1}: {title[:50]}... (main link: {main_link})")
        else:
            print(f"⚠️ Skipped article {i+1}, content too short")

    print(f"📝 Extracted {len(event_texts)} usable article blocks")
    return event_texts

def extract_event_summary(text):
    """改进的GPT提示，确保使用正确的链接"""
    prompt = f"""
From the following article text, extract and summarize only the **free public events in New York City**.

IMPORTANT: Use the EXACT URLs from the "All links found" section. Look for:
1. Markdown links with [>>] - these are the preferred "read more" links
2. The "Main link" if it's relevant to the event
3. Any other specific event URLs mentioned in the text

Respond only in markdown bullet list format like this:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 Description  
  🔗 [Link](use_exact_url_from_the_links_section)

Rules:
- Only include FREE events in NYC
- Use ACTUAL URLs from the links section, never make up URLs
- If an event doesn't have a specific link, you can omit the link line
- If no free NYC events are found, return nothing

Text:
{text[:4500]}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        content = result.choices[0].message.content.strip()

        # 清理markdown代码块
        if content.startswith("```markdown"):
            content = content.removeprefix("```markdown").strip()
        if content.startswith("```"):
            content = content.removeprefix("```").strip()
        if content.endswith("```"):
            content = content.removesuffix("```").strip()

        print(f"🧾 GPT result preview:\n{content[:200]}...\n")
        return content
    except Exception as e:
        print(f"❌ GPT call failed: {e}")
        return ""

def save_outputs(markdown_data, all_articles, today):
    """保存输出文件，包含调试信息"""
    # 保存 markdown 结果
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.md", "w", encoding="utf-8") as mf:
        mf.write("# NYC Free Events - The Skint\n\n")
        mf.write(f"Generated on: {today}\n\n")
        mf.write(markdown_data)
    
    # 保存原始数据用于调试
    with open(f"{OUTPUT_DIR}/events_raw_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(all_articles, jf, indent=2, ensure_ascii=False)
    
    print("✅ Output files saved to /output")
    print(f"   - events_gpt_{today}.md (formatted events)")
    print(f"   - events_raw_{today}.json (raw data for debugging)")

def main():
    print("🚀 Starting The Skint crawler with improved link extraction...")
    
    # 获取文章
    articles = fetch_all_articles()
    print(f"📰 Total articles found: {len(articles)}")
    
    # 提取文本和链接
    article_texts = extract_text_from_articles(articles)

    # 处理每篇文章
    summaries = []
    for i, text in enumerate(article_texts):
        print(f"🔍 Processing article {i+1}/{len(article_texts)}")
        summary = extract_event_summary(text)
        if summary and summary.strip():
            summaries.append(summary)

    # 保存结果
    today = datetime.now().strftime("%Y-%m-%d")
    final_md = "\n\n---\n\n".join(summaries) if summaries else "No events found."
    save_outputs(final_md, article_texts, today)

    print(f"🎯 Script completed!")
    print(f"   📊 Generated {len(summaries)} event summaries")
    print(f"   📁 Files saved in '{OUTPUT_DIR}' directory")

if __name__ == "__main__":
    main()
