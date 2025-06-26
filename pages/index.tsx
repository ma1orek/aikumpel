import App from '@/App'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Assistant Explorer - Odkryj zastosowania AI dla Twojej pracy</title>
        <meta name="description" content="Spersonalizowane rekomendacje AI assistentów z gotowymi promptami. Opisz swoją pracę i otrzymaj konkretne rozwiązania AI dopasowane do Twojej roli." />
        <meta name="keywords" content="AI, assistant, productivity, business automation, GPT, prompts, marketing, analiza, automatyzacja" />
        <meta name="author" content="AI Assistant Explorer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ai-assistant-explorer.vercel.app/" />
        <meta property="og:title" content="AI Assistant Explorer - Odkryj zastosowania AI" />
        <meta property="og:description" content="Spersonalizowane rekomendacje AI assistentów z gotowymi promptami dla Twojej pracy" />
        <meta property="og:image" content="https://ai-assistant-explorer.vercel.app/og-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ai-assistant-explorer.vercel.app/" />
        <meta property="twitter:title" content="AI Assistant Explorer - Odkryj zastosowania AI" />
        <meta property="twitter:description" content="Spersonalizowane rekomendacje AI assistentów z gotowymi promptami dla Twojej pracy" />
        <meta property="twitter:image" content="https://ai-assistant-explorer.vercel.app/og-image.png" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
      </Head>
      <App />
    </>
  )
}