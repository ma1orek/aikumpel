// test force push
// TEST: commit sprawdzający czy push działa
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

// --- Typy ---
interface AIApplication {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt?: string;
  examples?: string[];
  isGenerated?: boolean;
}
interface AICategory {
  name: string;
  applications: AIApplication[];
  hasMore?: boolean;
}

const REPLICATE_VERSION = 'openai/gpt-4.1-mini';
const pastelCards = [
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // niebieski
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // różowy
  'linear-gradient(135deg, #f9f586 0%, #fbc2eb 100%)', // żółty
  'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', // zielony
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // miętowy
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', // fioletowy
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const placeholderRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!searchQuery) {
      placeholderRef.current = setInterval(() => {}, 500);
    } else if (placeholderRef.current) {
      clearInterval(placeholderRef.current);
    }
    return () => { if (placeholderRef.current) clearInterval(placeholderRef.current); };
  }, [searchQuery]);

  const callReplicateAPI = async (systemPrompt: string, userPrompt: string, maxTokens: number = 4000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const createResponse = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: REPLICATE_VERSION,
          input: { prompt: systemPrompt + "\n" + userPrompt }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!createResponse.ok) throw new Error('API_ERROR');
      const prediction = await createResponse.json();
      let currentPrediction = prediction;
      const maxAttempts = 120;
      let attempts = 0;
      while ((currentPrediction.status === 'starting' || currentPrediction.status === 'processing') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        const statusController = new AbortController();
        const statusTimeoutId = setTimeout(() => statusController.abort(), 10000);
        try {
          const statusResponse = await fetch(`/api/replicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: prediction.id }),
            signal: statusController.signal
          });
          clearTimeout(statusTimeoutId);
          if (!statusResponse.ok) throw new Error('API_ERROR');
          currentPrediction = await statusResponse.json();
        } catch {
          clearTimeout(statusTimeoutId);
          throw new Error('API_ERROR');
        }
      }
      if (currentPrediction.status !== 'succeeded' || !currentPrediction.output) throw new Error('API_ERROR');
      return currentPrediction.output;
    } catch {
      throw new Error('API_ERROR');
    }
  };

  const generateAIRecommendations = async (jobDescription: string) => {
    setIsLoading(true);
    try {
      const systemPrompt = `Jesteś ekspertem od rozwiązań AI dla biznesu. Na podstawie opisu pracy użytkownika, wygeneruj szczegółową listę konkretnych zastosowań AI assistentów.\n\nZwróć odpowiedź w formacie JSON z następującą strukturą:\n{\n  "categories": [\n    {\n      "name": "Nazwa kategorii",\n      "applications": [\n        {\n          "title": "Konkretny tytuł zastosowania (max 5 słów)",\n          "description": "Szczegółowy opis 2-3 zdania jak AI może pomóc w tym konkretnym zadaniu",\n          "prompt": "Bardzo dokładny prompt gotowy do użycia (min 200 znaków)",\n          "examples": ["Przykład 1 konkretnego zastosowania", "Przykład 2", "Przykład 3", "Przykład 4", "Przykład 5"]\n        }\n      ]\n    }\n  ]\n}\n\nKATEGORIE (wybierz 4-6 najbardziej pasujących):\n- Automatyzacja Procesów - automatyzacja powtarzalnych zadań\n- Analiza i Raporty - analizowanie danych, tworzenie raportów  \n- Tworzenie Treści - pisanie, editing, content marketing\n- Research i Analiza - badanie rynku, konkurencji, trendów\n- Komunikacja - emaile, prezentacje, komunikacja z klientami\n- Asystent Biznesowy - organizacja, planowanie, zarządzanie czasem\n- Marketing i Sprzedaż - kampanie, lead generation, sprzedaż\n- Zarządzanie Projektami - koordynacja, monitoring, planning\n- Customer Success - obsługa klientów, retencja, sukces\n- Finanse i Księgowość - budżety, faktury, analizy finansowe\n- Design i Kreatywność - projektowanie, UX/UI, grafika\n- E-commerce - sklepy online, sprzedaż, logistyka\n\nWYMAGANIA:\n- Dla każdej kategorii podaj 2-3 zastosowania\n- Każdy prompt musi być gotowy do skopiowania i użycia\n- Przykłady muszą być bardzo konkretne i praktyczne\n- Dostosuj wszystko do branży i roli użytkownika\n- Używaj tylko języka polskiego\n- Każde zastosowanie powinno mieć 5 przykładów\n- Prompty powinny być szczegółowe i praktyczne`;
      const userPrompt = `Opis mojej pracy: ${jobDescription}`;
      const output = await callReplicateAPI(systemPrompt, userPrompt, 4000);
      let outputText = '';
      if (typeof output === 'string') outputText = output;
      else if (Array.isArray(output)) outputText = output.join('');
      else if (output && typeof output === 'object' && output.content) outputText = output.content;
      else if (output && typeof output === 'object' && output.text) outputText = output.text;
      else throw new Error('INVALID_OUTPUT_FORMAT');
      if (!outputText || outputText.trim().length === 0) throw new Error('EMPTY_OUTPUT');
      let aiResponse;
      try {
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : outputText;
        aiResponse = JSON.parse(jsonText);
      } catch {
        setResults([]);
        setIsLoading(false);
        setHasSearched(true);
        return;
      }
      if (!aiResponse || !aiResponse.categories || !Array.isArray(aiResponse.categories)) throw new Error('INVALID_RESPONSE_STRUCTURE');
      const transformedResults: AICategory[] = aiResponse.categories.map((category: any) => ({
        name: category.name,
        applications: category.applications.map((app: any, index: number) => ({
          id: `${category.name}-${index}-${Date.now()}`,
          title: app.title,
          description: app.description,
          category: category.name,
          prompt: app.prompt,
          examples: app.examples || []
        }))
      }));
      setResults(transformedResults);
    } catch {
      setResults([]);
    }
    setIsLoading(false);
    setHasSearched(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      generateAIRecommendations(searchQuery);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };
  const copyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f111a] via-[#181c26] to-[#10131a] text-white">
      <Head>
        <title>AI Assistant Explorer</title>
        <meta name="description" content="Odkryj, jak AI może pomóc w Twojej pracy" />
      </Head>
      {/* NAVBAR/LOGO */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold tracking-tight">AI Assistant Explorer</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition">Sign up</button>
        </div>
      </nav>
      {/* HERO SECTION */}
      <section className="max-w-4xl mx-auto flex flex-col items-center text-center pt-20 pb-16 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-6 drop-shadow-xl">Blending <span className="text-blue-400">AI</span> and <span className="text-fuchsia-400">Human</span> Precision</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-6 max-w-2xl">Odkryj, jak AI może <span className="text-blue-400 font-semibold italic">pomóc</span> w Twojej pracy. Opisz czym się zajmujesz, a AI wygeneruje dla Ciebie gotowe zastosowania i prompty do pracy.</p>
        <form className="w-full flex flex-col sm:flex-row gap-4 items-center justify-center mt-4" onSubmit={e => {e.preventDefault();}}>
          <input
            className="flex-1 px-6 py-4 rounded-xl bg-[#181c26] border border-white/10 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            type="text"
            placeholder="Wyszukaj lub opisz swoją pracę..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 via-fuchsia-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-500 transition-all duration-200"
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? 'Analizuję...' : 'Analizuj'}
          </button>
        </form>
      </section>
      {/* FEATURE CARDS (placeholder, możesz podmienić na wyniki AI) */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 pb-24">
        {[1,2,3,4].map((i) => (
          <div key={i} className="rounded-2xl bg-gradient-to-br from-[#181c26] to-[#23263a] border border-white/10 shadow-xl p-8 flex flex-col items-start gap-4 hover:scale-[1.03] transition-all">
            <div className="bg-white/10 p-3 rounded-xl mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#6ec1e4" strokeWidth="2" fill="none" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-1">Funkcja {i}</h3>
            <p className="text-gray-400">Opis funkcji lub zastosowania AI. Możesz podmienić na dynamiczne wyniki.</p>
          </div>
        ))}
      </section>
      {/* ENERGY BALL */}
      <div className="mb-6" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="energy">
          <span style={{ "--color": "#fbad04", "--radius": "18px", "--duration": "2.5s" } as React.CSSProperties}></span>
          <span style={{ "--color": "#03a1d9", "--radius": "13px", "--duration": "5s" } as React.CSSProperties}></span>
          <span style={{ "--color": "#f7036d", "--radius": "15px", "--duration": "7.5s" } as React.CSSProperties}></span>
          <span style={{ "--color": "#93ff16", "--radius": "20px", "--duration": "10s" } as React.CSSProperties}></span>
        </div>
      </div>
      {/* RESULTS SECTION */}
      <section className="section" style={{ background: '#181a20' }}>
        <div className="container">
          <h2 className="title is-3 has-text-white has-text-centered" style={{ marginBottom: 40 }}>Twoje spersonalizowane zastosowania AI</h2>
          <div className="columns is-multiline is-variable is-8">
            {results.map((category, idx) => (
              <div key={category.name} className="column is-6-tablet is-4-desktop">
                <div className="card" style={{ borderRadius: 18, boxShadow: '0 4px 32px 0 #a21caf22', background: idx % 3 === 0 ? '#23272f' : idx % 3 === 1 ? '#1a1d23' : '#20243a' }}>
                  <header className="card-header" style={{ borderBottom: '1px solid #a21caf33', background: 'transparent' }}>
                    <p className="card-header-title has-text-white" style={{ fontWeight: 700 }}>
                      <span className="tag is-info is-light" style={{ marginRight: 12 }}></span>
                      {category.name}
                    </p>
                  </header>
                  <div className="card-content">
                    {/* PROMPT BOX */}
                    <div className="notification is-link is-light" style={{ borderRadius: 12, background: '#2d3748', color: '#fff', marginBottom: 16 }}>
                      <div className="is-size-7 has-text-weight-bold has-text-info mb-2">Prompt do AI</div>
                      <div className="is-family-monospace" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{category.applications[0]?.prompt}</div>
                      <button onClick={() => copyPrompt(category.applications[0]?.prompt || '', category.applications[0]?.id || '')} className={`button is-small is-info mt-2${copiedPrompt === category.applications[0]?.id ? ' is-light' : ''}`}>{copiedPrompt === category.applications[0]?.id ? 'Skopiowano!' : 'Kopiuj prompt'}</button>
                    </div>
                    {/* BULLETPOINTS/EXAMPLES */}
                    <ul className="has-text-white is-size-6" style={{ paddingLeft: 20, marginBottom: 0 }}>
                      {category.applications[0]?.examples?.map((ex, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{ex}</li>
                      ))}
                    </ul>
                    {/* Pozostałe aplikacje (jeśli są) */}
                    {category.applications.slice(1).map((app, i) => (
                      <div key={app.id} className="mt-5 pt-4" style={{ borderTop: '1px solid #a21caf22' }}>
                        <div className="has-text-info has-text-weight-semibold mb-1">{app.title}</div>
                        <div className="has-text-white mb-2 is-size-6">{app.description}</div>
                        <div className="notification is-link is-light is-family-monospace mb-2" style={{ borderRadius: 8, background: '#23272f', color: '#fff' }}>{app.prompt}</div>
                        <ul className="has-text-white is-size-7" style={{ paddingLeft: 20 }}>
                          {app.examples?.map((ex, j) => (
                            <li key={j}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}