import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';

interface HomeProps {
  content: string;
}

export default function Home({ content }: HomeProps) {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🗽 Free NYC Events (via TheSkint)</h1>
      <Markdown>{content}</Markdown>
    </main>
  );
}

// Load the latest Markdown file dynamically on each request
export async function getServerSideProps() {
  const dir = path.join(process.cwd(), 'output');
  let content = "⚠️ No events available yet. Please check back later.";

  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length > 0) {
      content = fs.readFileSync(path.join(dir, files[0]), 'utf8');
    }
  } catch (e) {
    console.warn("output/ directory or Markdown file not found.");
  }

  return { props: { content } };
}
