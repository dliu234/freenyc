import fs from "fs";
import path from "path";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function getStaticProps() {
  const today = new Date().toISOString().split("T")[0];
  const filePath = path.join(process.cwd(), "output", `events_gpt_${today}.md`);
  let content = "No events available.";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf-8");
  }

  return {
    props: {
      content,
    },
  };
}

export default function Home({ content }: { content: string }) {
  return (
    <main className="prose prose-lg max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🗽 Free NYC Events (via TheSkint)</h1>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </main>
  );
}
