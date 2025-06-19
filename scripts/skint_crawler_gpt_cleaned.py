import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import csv
from datetime import datetime
import re

# Configuration
SOURCE_URL = "https://theskint.com/"
OUTPUT_FILE = f"events_gpt_{datetime.now().strftime('%Y-%m-%d')}.md"

def fetch_page(url, timeout=10):
    """Fetch a webpage with error handling"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        print(f"🌐 Fetching: {url}")
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching {url}: {e}")
        return None

def extract_links_from_line(line, article):
    """Extract links that appear in a specific line of text"""
    links = []
    
    # Find all links in the article
    all_links = article.find_all('a', href=True)
    
    for link in all_links:
        link_text = link.get_text(strip=True)
        link_href = link.get('href', '')
        
        # Check if this link's text appears in the line
        if (link_text in line or 
            (link_text == '>>' and '>>' in line) or
            ('eventbrite.com' in link_href and 'eventbrite' in line.lower()) or
            ('facebook.com' in link_href and 'facebook' in line.lower())):
            links.append(link)
    
    return links

def create_event_block_from_text(text_content, links):
    """Create a mock HTML element from text content and associated links"""
    from bs4 import BeautifulSoup
    
    # Create a container element
    soup = BeautifulSoup('<div></div>', 'html.parser')
    container = soup.div
    
    # Add the text content
    container.string = text_content
    
    # Add the links as child elements
    for link in links:
        # Clone the link and add it to our container
        new_link = soup.new_tag('a', href=link.get('href', ''))
        new_link.string = link.get_text(strip=True)
        container.append(new_link)
    
    return container

def find_event_blocks(article):
    """Find individual event blocks within a roundup article using line-by-line parsing"""
    print("  🔍 Looking for event blocks in roundup article...")
    event_blocks = []
    
    # The Skint format: events are lines starting with ► followed by [>>](link)
    # We need to split by lines, not HTML elements
    
    # Get the full text content
    full_text = article.get_text()
    print(f"  📄 Full text length: {len(full_text)} characters")
    
    # Split by lines and look for event patterns
    lines = full_text.split('\n')
    print(f"  📝 Found {len(lines)} lines to process")
    
    current_event_content = []
    current_event_links = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Check if this line starts a new event (starts with ►)
        if (line.startswith('►') or line.startswith('•') or '🎉' in line or
            line.startswith('weds ') or line.startswith('tues ') or line.startswith('thurs ')):
            
            # If we have a previous event, save it
            if current_event_content:
                event_text = '\n'.join(current_event_content)
                event_block = create_event_block_from_text(event_text, current_event_links)
                if event_block and len(event_text) > 30:
                    event_blocks.append(event_block)
                    print(f"    📅 Found event block: {current_event_content[0][:80]}...")
                    print(f"        🔗 Associated links: {len(current_event_links)}")
            
            # Start new event
            current_event_content = [line]
            current_event_links = extract_links_from_line(line, article)
            
        elif current_event_content and len(line) > 10:
            # This line continues the current event
            current_event_content.append(line)
            # Also check for links in continuation lines
            line_links = extract_links_from_line(line, article)
            current_event_links.extend(line_links)
    
    # Don't forget the last event
    if current_event_content:
        event_text = '\n'.join(current_event_content)
        event_block = create_event_block_from_text(event_text, current_event_links)
        if event_block and len(event_text) > 30:
            event_blocks.append(event_block)
            print(f"    📅 Found event block: {current_event_content[0][:80]}...")
            print(f"        🔗 Associated links: {len(current_event_links)}")
    
    print(f"  ✅ Total event blocks found: {len(event_blocks)}")
    
    # Debug: show what links each block contains
    for i, block in enumerate(event_blocks[:3]):  # Only show first 3 for debugging
        links = block.find_all('a', href=True)
        print(f"    Block {i+1} contains {len(links)} links")
        for j, link in enumerate(links[:2]):  # Show first 2 links per block
            text = link.get_text(strip=True)
            href = link.get('href', '')
            print(f"      Link {j+1}: '{text}' -> {href[:60]}...")
    
    return event_blocks

def extract_event_specific_link(event_block, fallback_url):
    """Extract the specific link for an individual event within a roundup"""
    print(f"    🔍 Looking for event-specific links in block...")
    
    # Look for >> links within this specific event block first
    links = event_block.find_all("a", href=True)
    print(f"    📎 Found {len(links)} total links in this event block")
    
    # Debug: show all links in this block
    for i, link in enumerate(links):
        text = link.get_text(strip=True)
        href = link.get("href", "")
        print(f"      Link {i+1}: text='{text}' href='{href[:60]}...' ")
    
    # Priority 1: Look for >> links within this specific event block
    for link in links:
        text = link.get_text(strip=True)
        href = link.get("href", "")
        
        if text == ">>" or ">>" in text:
            if href:
                full_url = urljoin(SOURCE_URL, href)
                print(f"    ✅ Found event-specific >> link: {full_url}")
                return full_url
    
    # Priority 2: Look for external event platform links
    for link in links:
        href = link.get("href", "")
        if any(site in href.lower() for site in [
            'eventbrite.com', 'facebook.com/events', 'ticketmaster.com', 
            'meetup.com', 'dice.fm', 'partiful.com'
        ]):
            full_url = urljoin(SOURCE_URL, href)
            print(f"    ✅ Found event platform link: {full_url}")
            return full_url
    
    # Priority 3: Look for any external links (not theskint.com)
    for link in links:
        href = link.get("href", "")
        if href and not href.startswith('#') and 'theskint.com' not in href:
            full_url = urljoin(SOURCE_URL, href)
            print(f"    ✅ Found external link: {full_url}")
            return full_url
    
    # Last resort: use fallback
    print(f"    ⚠️  No event-specific link found, using fallback: {fallback_url}")
    return fallback_url

def is_roundup_article(article_content, title):
    """Determine if an article is a roundup (contains multiple events)"""
    text = article_content.get_text().lower()
    
    # Count potential event indicators
    event_indicators = text.count('►') + text.count('•') + text.count('🎉')
    time_indicators = len(re.findall(r'\b(?:am|pm|noon)\b', text))
    
    print(f"  📊 Event indicators: {event_indicators}, Time indicators: {time_indicators}")
    
    # It's a roundup if it has multiple event indicators
    is_roundup = event_indicators >= 3 or time_indicators >= 5
    
    if is_roundup:
        print(f"  📋 Identified as ROUNDUP article: {title[:80]}...")
    else:
        print(f"  📄 Identified as SINGLE article: {title[:80]}...")
    
    return is_roundup

def extract_event_info(event_block, source_url):
    """Extract event information from a single event block or article"""
    print(f"  🎯 Extracting event info...")
    
    # Get all text content
    text = event_block.get_text()
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract title (usually the first substantial line)
    title = "Event"
    for line in lines:
        if len(line) > 10 and not line.startswith('►') and not line.startswith('•'):
            # Clean up title
            title = re.sub(r'^(►|•|\s)+', '', line)
            title = re.sub(r'\s+', ' ', title).strip()
            if len(title) > 100:
                title = title[:97] + "..."
            break
    
    # Extract time info
    time_info = "Time not specified"
    for line in lines:
        if any(indicator in line.lower() for indicator in ['pm', 'am', 'noon', 'midnight']):
            # Extract time pattern
            time_match = re.search(r'[^a-z](\d{1,2}(?::\d{2})?\s*(?:am|pm))', line.lower())
            if time_match:
                time_info = time_match.group(1)
                break
            # Also look for day patterns
            day_match = re.search(r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b', line.lower())
            if day_match:
                time_info = f"{day_match.group(1).title()}"
                if time_match:
                    time_info += f", {time_match.group(1)}"
                break
    
    # Extract location
    location = "Location not specified"
    for line in lines:
        if '📍' in line:
            location = line.split('📍')[1].strip()
            break
        elif any(loc_word in line.lower() for loc_word in ['📍', 'at ', 'location:', '@']):
            # Try to extract location info
            location_match = re.search(r'(?:at|@|\📍)\s*([^.]+)', line)
            if location_match:
                location = location_match.group(1).strip()
                break
    
    # Extract description (combine all lines)
    description = ' '.join(lines)
    if len(description) > 200:
        description = description[:197] + "..."
    
    return {
        'title': title,
        'time': time_info,
        'location': location,
        'description': description
    }

def get_main_articles():
    """Get all the main article links from the homepage"""
    print("🏠 Fetching homepage for main articles...")
    
    response = fetch_page(SOURCE_URL)
    if not response:
        return []
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find article links
    articles = []
    
    # Look for various article link patterns
    link_selectors = [
        'a[href*="/"]',  # All internal links
        '.entry-title a',  # Common WordPress pattern
        '.post-title a',   # Alternative pattern
        'h1 a, h2 a, h3 a'  # Header links
    ]
    
    for selector in link_selectors:
        found_links = soup.select(selector)
        for link in found_links:
            href = link.get('href')
            if href and href.startswith('/') and len(href) > 5:
                full_url = urljoin(SOURCE_URL, href)
                title = link.get_text(strip=True)
                if title and len(title) > 10:
                    articles.append({
                        'url': full_url,
                        'title': title
                    })
                    print(f"  📄 Found article: {title[:60]}...")
    
    # Remove duplicates
    unique_articles = []
    seen_urls = set()
    for article in articles:
        if article['url'] not in seen_urls:
            unique_articles.append(article)
            seen_urls.add(article['url'])
    
    print(f"🎯 Found {len(unique_articles)} unique articles")
    return unique_articles[:10]  # Limit for testing

def save_events_to_markdown(events, filename):
    """Save events to a markdown file"""
    print(f"💾 Saving {len(events)} events to {filename}")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# NYC Free Events - {datetime.now().strftime('%Y-%m-%d')}\n\n")
        
        for event in events:
            f.write(f"- 🎉 **{event['title']}**  \n")
            f.write(f"  📍 {event['location']}  \n")
            f.write(f"  🕒 {event['time']}  \n")
            f.write(f"  📝 {event['description']}  \n")
            f.write(f"  🔗 [Link]({event['link']})  \n\n")
    
    print(f"✅ Events saved to {filename}")

def main():
    """Main crawler function"""
    print("🕷️  Starting The Skint Event Crawler")
    print("=" * 50)
    
    all_events = []
    
    # Get main articles from homepage
    articles = get_main_articles()
    
    if not articles:
        print("❌ No articles found!")
        return
    
    # Process each article
    for i, article_info in enumerate(articles, 1):
        print(f"\n📰 Processing article {i}/{len(articles)}: {article_info['title'][:60]}...")
        
        # Fetch article content
        response = fetch_page(article_info['url'])
        if not response:
            continue
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the main content area
        article_content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('main') or soup
        
        if not article_content:
            print("  ⚠️  Could not find article content")
            continue
        
        # Determine if this is a roundup or single event
        if is_roundup_article(article_content, article_info['title']):
            # Process as roundup - extract multiple events
            event_blocks = find_event_blocks(article_content)
            
            for j, event_block in enumerate(event_blocks, 1):
                print(f"  🎪 Processing event {j}/{len(event_blocks)} from roundup...")
                
                # Extract event information
                event_info = extract_event_info(event_block, article_info['url'])
                
                # Get event-specific link
                event_link = extract_event_specific_link(event_block, article_info['url'])
                
                # Create event record
                event = {
                    'title': event_info['title'],
                    'location': event_info['location'],
                    'time': event_info['time'],
                    'description': event_info['description'],
                    'link': event_link,
                    'source': 'roundup'
                }
                
                all_events.append(event)
                print(f"    ✅ Added event: {event['title'][:50]}...")
        
        else:
            # Process as single event
            print(f"  🎪 Processing single event article...")
            
            # Extract event information
            event_info = extract_event_info(article_content, article_info['url'])
            
            # For single events, the article URL is the event link
            event = {
                'title': event_info['title'],
                'location': event_info['location'],
                'time': event_info['time'],
                'description': event_info['description'],
                'link': article_info['url'],
                'source': 'single'
            }
            
            all_events.append(event)
            print(f"    ✅ Added single event: {event['title'][:50]}...")
        
        # Be nice to the server
        time.sleep(1)
    
    # Save results
    if all_events:
        save_events_to_markdown(all_events, OUTPUT_FILE)
        print(f"\n🎉 Successfully collected {len(all_events)} events!")
        
        # Show summary
        roundup_events = len([e for e in all_events if e['source'] == 'roundup'])
        single_events = len([e for e in all_events if e['source'] == 'single'])
        print(f"📊 Summary: {roundup_events} from roundups, {single_events} single events")
        
    else:
        print("\n❌ No events were collected!")

if __name__ == "__main__":
    main()
