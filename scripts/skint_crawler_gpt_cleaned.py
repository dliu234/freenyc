import requests
from bs4 import BeautifulSoup
import openai
import os
import json
from datetime import datetime
import re
from urllib.parse import urljoin, urlparse, unquote
import html

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

def clean_and_validate_url(url, base_url=SOURCE_URL):
    """清理和验证URL"""
    if not url or not url.strip():
        return None
    
    url = url.strip()
    
    # 跳过无效的链接类型
    if (url.startswith('javascript:') or 
        url == '#' or 
        url.startswith('mailto:') or
        url.startswith('tel:')):
        return None
    
    # 解码HTML实体
    url = html.unescape(url)
    
    # 移除可能的截断标识
    if url.endswith('...'):
        return None
    
    # 处理相对链接
    if url.startswith('/'):
        url = urljoin(base_url, url)
    elif not url.startswith(('http://', 'https://')):
        url = urljoin(base_url, url)
    
    # 验证URL格式
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return None
    except:
        return None
    
    return url

def extract_all_links_with_context(article):
    """提取文章中所有链接，包含上下文信息"""
    content_el = article.find("div", class_="post-content") or article
    content_text = content_el.get_text(separator="\n", strip=True)
    
    # 获取所有 HTML 链接
    all_links = article.find_all("a", href=True)
    links_with_context = []
    
    for a in all_links:
        href = a.get("href", "").strip()
        link_text = a.get_text(strip=True)
        
        # 清理和验证URL
        clean_url = clean_and_validate_url(href)
        
        if clean_url and link_text:  # 确保链接文本不为空
            # 尝试找到链接前的描述文本
            context = ""
            if a.parent:
                # 获取链接所在段落的文本
                paragraph_text = a.parent.get_text(strip=True)
                
                # 尝试提取链接前的事件描述
                # 寻找模式如 "event name: description. [>>]"
                before_link = ""
                if link_text and link_text in paragraph_text:
                    before_link = paragraph_text.split(link_text)[0]
                
                # 清理上下文，取最后的事件描述
                lines = before_link.split('\n')
                for line in reversed(lines):
                    line = line.strip()
                    if line and len(line) > 10:  # 至少10个字符的描述
                        # 寻找事件模式，通常包含时间和地点信息
                        if any(indicator in line.lower() for indicator in ['pm:', 'am:', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']):
                            context = line[:100]  # 取前100个字符
                            break
            
            links_with_context.append({
                'url': clean_url,
                'text': link_text,
                'context': context,
                'is_read_more': link_text == ">>",
                'raw_href': href
            })
    
    return links_with_context

def create_event_link_mapping(article):
    """创建事件到链接的映射"""
    content_el = article.find("div", class_="post-content") or article
    content_html = str(content_el)
    
    # 查找所有包含 >> 链接的段落
    events_with_links = []
    
    # 使用正则表达式找到所有 >> 链接及其上下文
    link_pattern = r'<a[^>]*href="([^"]*)"[^>]*>>.*?</a>'
    matches = re.finditer(link_pattern, content_html, re.IGNORECASE | re.DOTALL)
    
    for match in matches:
        url = clean_and_validate_url(match.group(1))
        if url:
            # 获取链接前的文本
            before_link = content_html[:match.start()]
            
            # 查找最近的事件描述
            # 寻找包含时间信息的行
            lines = before_link.split('\n')
            event_description = ""
            
            for line in reversed(lines):
                line_text = BeautifulSoup(line, 'html.parser').get_text(strip=True)
                if line_text and any(time_indicator in line_text.lower() for time_indicator in 
                                   ['pm:', 'am:', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']):
                    event_description = line_text[:150]  # 前150个字符
                    break
            
            if event_description:
                events_with_links.append({
                    'description': event_description,
                    'url': url
                })
    
    return events_with_links

def extract_text_from_articles(articles):
    event_texts = []
    for i, article in enumerate(articles):
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # 获取事件-链接映射
        event_links = create_event_link_mapping(article)
        
        # 获取所有链接（用作备选）
        all_links = extract_all_links_with_context(article)
        
        # 构建详细的链接映射信息
        links_mapping = []
        if event_links:
            for j, event_link in enumerate(event_links):
                links_mapping.append(f"Event {j+1}: {event_link['description']} -> {event_link['url']}")
        
        all_links_info = []
        for j, link in enumerate(all_links):
            if link['is_read_more']:
                all_links_info.append(f">> Link {j+1}: {link['context']} -> {link['url']}")
        
        full_text = f"""Title: {title}

Content:
{content}

Event-Link Mappings:
{chr(10).join(links_mapping) if links_mapping else "No specific event-link mappings found"}

All >> Links:
{chr(10).join(all_links_info) if all_links_info else "No >> links found"}

Default Link: {all_links[0]['url'] if all_links else SOURCE_URL}
"""

        if len(content) > 80:
            event_texts.append(full_text)
            print(f"✅ Article {i+1}: {title[:50]}... ({len(event_links)} event-link mappings)")
        else:
            print(f"⚠️ Skipped article {i+1}, content too short")

    print(f"📝 Extracted {len(event_texts)} usable article blocks")
    return event_texts

def extract_event_summary(text):
    """改进的GPT提示，使用事件-链接映射"""
    prompt = f"""
From the following article text, extract and summarize only the **free public events in New York City**.

IMPORTANT LINKING INSTRUCTIONS:
1. Use the "Event-Link Mappings" section to match each event with its specific URL
2. If an event doesn't have a specific mapping, use one of the "All >> Links" that seems most relevant
3. If neither exists, use the "Default Link"
4. DO NOT use the same URL for multiple different events unless they are truly the same event

Respond only in markdown bullet list format like this:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 Description  
  🔗 [Link](use_specific_url_for_this_event)

Rules:
- Only include FREE events in NYC
- Each event should have its own specific URL when possible
- Match events to their corresponding URLs from the mappings
- If no free NYC events are found, return nothing

Text:
{text}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1  # 降低温度以提高一致性
        )
        content = result.choices[0].message.content.strip()

        # 清理markdown代码块
        content = re.sub(r'^```markdown\s*', '', content)
        content = re.sub(r'^```\s*', '', content)
        content = re.sub(r'\s*```$', '', content)

        return content
    except Exception as e:
        print(f"❌ GPT call failed: {e}")
        return ""

def save_outputs(markdown_data, all_articles, today):
    """保存输出"""
    with open(f"{OUTPUT_DIR}/events_fixed_{today}.md", "w", encoding="utf-8") as mf:
        mf.write("# NYC Free Events - The Skint (Fixed Links)\n\n")
        mf.write(f"Generated on: {today}\n\n")
        mf.write(markdown_data if markdown_data.strip() else "No events found.")
    
    with open(f"{OUTPUT_DIR}/events_raw_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(all_articles, jf, indent=2, ensure_ascii=False)
    
    print("✅ Fixed version files saved")

def main():
    print("🚀 Starting The Skint crawler (Fixed Link Version)...")
    
    articles = fetch_all_articles()
    print(f"📰 Total articles found: {len(articles)}")
    
    article_texts = extract_text_from_articles(articles)

    summaries = []
    for i, text in enumerate(article_texts):
        print(f"🔍 Processing article {i+1}/{len(article_texts)}")
        summary = extract_event_summary(text)
        if summary and summary.strip():
            summaries.append(summary)
            print(f"✅ Generated summary")
        else:
            print(f"❌ No summary generated")

    today = datetime.now().strftime("%Y-%m-%d")
    final_md = "\n\n---\n\n".join(summaries) if summaries else "No events found."
    save_outputs(final_md, article_texts, today)

    print(f"\n🎯 Fixed version completed!")
    print(f"   📊 Generated {len(summaries)} event summaries")
    print(f"   📁 Files saved in '{OUTPUT_DIR}' directory")
    print(f"   🔗 Each event should now have its specific link")

if __name__ == "__main__":
    main()
