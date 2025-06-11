import requests
from bs4 import BeautifulSoup
import openai
import os
from datetime import datetime
import json

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Constants
SOURCE_URL = "https://theskint.com"
HEADERS = {"User-Agent": "Mozilla/5.0"}
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Step 1: Scrape the homepage of TheSkint
response = requests.get(SOURCE_URL, headers=HEADERS)
soup = BeautifulSoup(response.text, 'html.parser')

# Step 2: Extract article paragraphs
articles = soup.find_all('article')
event_texts = []
for article in articles:
    paragraphs = article.find_all('p')
    combined_text = "\n".join([p.get_text(strip=True) for p in paragraphs])
    if len(combined_text) > 50:
        event_texts.append(combined_text)

# Step 3: Use GPT to extract structured information
def extract_event_summary(text):
    prompt = f"""
Extract the following fields from the NYC event description and return as a JSON object:
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
{text}
"""
    try:
        result = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return result['choices'][0]['message']['content']
    except Exception as e:
        return json.dumps({"error": str(e)})

# Step 4: Format and save results
today = datetime.now().strftime("%Y-%m-%d")
json_output = []
markdown_output = ""

for i, raw_text in enumerate(event_texts[:5]):
    print(f"Processing event {i+1}")
    summary = extract_event_summary(raw_text)
    try:
        event_data = json.loads(summary)
        json_output.append(event_data)

        # Markdown card
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
        print(f"Failed to parse event {i+1}: {err}")
        continue

# Save to files
with open(f"{OUTPUT_DIR}/events_{today}.json", "w", encoding="utf-8") as jf:
    json.dump(json_output, jf, indent=2)

with open(f"{OUTPUT_DIR}/events_{today}.md", "w", encoding="utf-8") as mf:
    mf.write(markdown_output)

print("✅ Script completed. Markdown and JSON files are saved in /output.")

