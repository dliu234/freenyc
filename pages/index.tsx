import fs from 'fs'
import path from 'path'
import Markdown from 'react-markdown'

export default function Home({ content }) {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🗽 Free NYC Events (via TheSkint)</h1>
      <Markdown>{content}</Markdown>
    </main>
  )
}

export async function getStaticProps() {
  const dir = path.join(process.cwd(), 'output')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse()
  const content = fs.readFileSync(path.join(dir, files[0]), 'utf8')
  return { props: { content } }
}
