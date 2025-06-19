import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Free NYC Events - Discover Amazing Free Activities</title>
        <meta name="description" content="Discover amazing free events happening across all five boroughs of NYC. Updated daily with the best free activities, curated by TheSkint." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://freenyc.vercel.app/" />
        <meta property="og:title" content="Free NYC Events - Discover Amazing Free Activities" />
        <meta property="og:description" content="Discover amazing free events happening across all five boroughs of NYC. Updated daily with the best free activities." />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://freenyc.vercel.app/" />
        <meta property="twitter:title" content="Free NYC Events - Discover Amazing Free Activities" />
        <meta property="twitter:description" content="Discover amazing free events happening across all five boroughs of NYC. Updated daily with the best free activities." />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
