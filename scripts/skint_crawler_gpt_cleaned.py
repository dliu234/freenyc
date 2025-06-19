import requests
from bs4 import BeautifulSoup
import openai
import os
import json
from datetime import datetime
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
        print(f"Fetching: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            articles = soup.find_all("article")

            if not articles:
                print(f"No <article> found on page {page}, stopping.")
                break

            print(f"Page {page}: Found {len(articles)} <article> blocks")
            all_articles.extend(articles)
            page += 1
        except Exception as e:
            print(f"Failed to fetch page {page}: {e}")
            break

    return all_articles

def extract_article_link(article):
    """Improved link extraction function with detailed debugging"""
    print(f"\n=== DEBUG: Extracting link for article ===")
    
    # Get article title for debugging
    title_el = article.find("h2") or article.find("h1")
    title = title_el.get_text(strip=True) if title_el else "Untitled"
    print(f"Article title: {title}")
    
    # Find all links and debug them
    all_links = article.find_all("a", href=True)
    print(f"Total links found: {len(all_links)}")
    
    for i, a in enumerate(all_links):
        text = a.get_text(strip=True)
        href = a.get("href", "")
        print(f"  Link {i+1}: text='{text}' href='{href}'")
    
    # First look for >> links
    for a in all_links:
        text = a.get_text(strip=True)
        if text == ">>" or ">>" in text:
            href = a["href"]
            full_url = urljoin(SOURCE_URL, href)
            print(f"✅ Found >> link: {full_url}")
            return full_url

    # Look for "Read more" or similar patterns
    read_more_patterns = ["read more", "continue reading", "full article", "more details"]
    for a in all_links:
        text = a.get_text(strip=True).lower()
        if any(pattern in text for pattern in read_more_patterns):
            href = a["href"]
            full_url = urljoin(SOURCE_URL, href)
            print(f"✅ Found read-more link: {full_url}")
            return full_url

    # Fallback: look for title links
    h2 = article.find("h2")
    if h2:
        a = h2.find("a", href=True)
        if a and a["href"]:
            href = a["href"]
            full_url = urljoin(SOURCE_URL, href)
            print(f"✅ Found title link: {full_url}")
            return full_url

    # Look for the longest/most specific link
    candidate_links = []
    for a in all_links:
        href = a.get("href", "")
        # Skip obviously non-article links
        skip_patterns = ['#', 'mailto:', 'tel:', 'javascript:', '.jpg', '.png', '.gif', 
                        'facebook.com', 'twitter.com', 'instagram.com', 'theskint.com/page/']
        if any(skip in href.lower() for skip in skip_patterns):
            continue
        if href and len(href) > 1:
            full_url = urljoin(SOURCE_URL, href)
            candidate_links.append((full_url, len(href), href))
    
    if candidate_links:
        # Sort by URL length (longer URLs are usually more specific)
        candidate_links.sort(key=lambda x: x[1], reverse=True)
        best_link = candidate_links[0][0]
        print(f"✅ Found best candidate link: {best_link}")
        return best_link

    print("❌ Warning: No suitable link found, using base URL")
    return SOURCE_URL

def extract_text_with_links(articles):
    """Extract article text while preserving link information"""
    event_data = []
    print(f"\n=== Processing {len(articles)} articles ===")
    
    for i, article in enumerate(articles):
        print(f"\n--- Article {i+1} ---")
        title_el = article.find("h2") or article.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Untitled"

        # Extract link with detailed debugging
        link = extract_article_link(article)

        # Extract content
        content_el = article.find("div", class_="post-content") or article
        content = content_el.get_text(separator="\n", strip=True)

        # Create data structure with complete information including link
        article_data = {
            "title": title,
            "content": content,
            "link": link,
            "full_text": f"{title}\n\n{content}\n\nFull link: {link}"
        }

        if len(content) > 80:
            event_data.append(article_data)
            print(f"✅ Added article: {title[:50]}... -> {link}")
        else:
            print(f"❌ Skipped article {i+1}, content too short ({len(content)} chars)")

    print(f"\n=== Final: Extracted {len(event_data)} usable articles ===")
    return event_data

def smart_truncate_with_link_priority(text, link, max_chars=4000):
    """Smart truncation that prioritizes link integrity"""
    # If text is short enough, return as is
    if len(text) <= max_chars:
        return text
    
    # Reserve space for the link and some context
    link_context_reserve = len(link) + 200  # Extra space for "Full link: " and context
    available_for_content = max_chars - link_context_reserve
    
    if available_for_content < 500:
        # If very limited space, at least keep some content
        available_for_content = max_chars // 2
    
    # Split text into lines
    lines = text.split('\n')
    title_lines = []
    content_lines = []
    
    # Separate title and content
    empty_line_found = False
    for line in lines:
        if not line.strip() and not empty_line_found:
            empty_line_found = True
            continue
        
        if not empty_line_found:
            title_lines.append(line)
        else:
            content_lines.append(line)
    
    # Always keep the title
    title_text = '\n'.join(title_lines)
    
    # Truncate content smartly
    content_text = '\n'.join(content_lines)
    remaining_space = available_for_content - len(title_text)
    
    if remaining_space > 0 and len(content_text) > remaining_space:
        # Try to cut at sentence boundaries
        truncated_content = content_text[:remaining_space]
        
        # Find the last complete sentence
        last_period = truncated_content.rfind('.')
        last_exclamation = truncated_content.rfind('!')
        last_question = truncated_content.rfind('?')
        
        best_cut = max(last_period, last_exclamation, last_question)
        
        if best_cut > remaining_space * 0.7:  # If sentence boundary is reasonable
            content_text = truncated_content[:best_cut + 1]
        else:
            # Cut at word boundary
            words = truncated_content.split()
            content_text = ' '.join(words[:-1]) + '...'
    
    # Reconstruct the text
    result = title_text
    if content_text:
        result += '\n\n' + content_text
    
    return result

def extract_event_summary(article_data):
    """Improved event extraction function ensuring links are included"""
    # Smart truncation that prioritizes link integrity
    content = smart_truncate_with_link_priority(
        article_data["full_text"], 
        article_data["link"], 
        max_chars=6000  # Increased limit since we're being smart about it
    )
    link = article_data["link"]
    
    prompt = f"""
From the following article text, extract and summarize only the **free public events in New York City**.
The complete article link is guaranteed to be included at the end of the text.

Respond only in markdown bullet list format like this:

- 🎉 **Event Title**  
  📍 Location  
  🕒 Time / Date  
  📝 Description  
  🔗 [Link]({link})

IMPORTANT: 
1. Always use the provided link ({link}) in the markdown output
2. The link is preserved in full at the end of the article text
3. If no free NYC events are found, return nothing

Article text (with guaranteed complete link):
{content}
"""

    try:
        result = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4
        )
        content = result.choices[0].message.content.strip()

        # Clean markdown code block markers
        if content.startswith("```markdown"):
            content = content.removeprefix("```markdown").strip()
        if content.startswith("```"):
            content = content.removeprefix("```").strip()
        if content.endswith("```"):
            content = content.removesuffix("```").strip()

        print(f"GPT result sample:\n{content[:150]}...\n")
        return content
    except Exception as e:
        print(f"GPT call failed: {e}")
        return ""

def save_outputs(markdown_data, all_articles, today):
    """Save output files"""
    # Save markdown file
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.md", "w", encoding="utf-8") as mf:
        mf.write(f"# NYC Free Events - {today}\n\n")
        mf.write(markdown_data)
    
    # Save detailed JSON data including link information
    json_data = []
    for article in all_articles:
        json_data.append({
            "title": article["title"],
            "content": article["content"][:500] + "..." if len(article["content"]) > 500 else article["content"],
            "link": article["link"]
        })
    
    with open(f"{OUTPUT_DIR}/events_gpt_{today}.json", "w", encoding="utf-8") as jf:
        json.dump(json_data, jf, indent=2, ensure_ascii=False)
    
    print("Output files saved to /output")

def main():
    print("Starting Skint crawler...")
    
    # Get all articles
    articles = fetch_all_articles()
    
    # Extract article data (including links)
    article_data = extract_text_with_links(articles)

    # Process each article
    summaries = []
    for i, data in enumerate(article_data):
        print(f"Processing article {i+1}: {data['title'][:50]}...")
        summary = extract_event_summary(data)
        if summary:
            summaries.append(summary)

    # Save results
    today = datetime.now().strftime("%Y-%m-%d")
    final_md = "\n\n".join(summaries)
    save_outputs(final_md, article_data, today)

    print(f"Script completed. Found {len(summaries)} articles with events.")
    print(f"Check {OUTPUT_DIR}/ for output files")

if __name__ == "__main__":
    main()
