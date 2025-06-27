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
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(120deg, #18181b 0%, #23272f 50%, #1e293b 100%)',
          minHeight: '100vh',
        }}
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={{ backgroundPosition: '0% 50%' }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
          style={{
            background: 'linear-gradient(120deg, #18181b 0%, #23272f 50%, #1e293b 100%)',
            backgroundSize: '200% 200%',
            opacity: 0.7,
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 w-[120vw] h-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle at 60% 40%, #6366f1 0%, #a21caf 40%, transparent 80%)',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
        />
      </motion.div>
      {/* Main Content */}
      <main className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center py-20 md:py-32 gap-6 border-b border-white/10 bg-black/60 backdrop-blur-sm relative">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 18, color: '#b3b3b3', letterSpacing: 1, marginBottom: 16, fontWeight: 500 }}>AI ASSISTANT EXPLORER</div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.13, marginBottom: 16 }}>
              <span style={{ color: '#fff' }}>Odkryj, jak AI może <span style={{ color: '#6ec1e4', fontStyle: 'italic', fontWeight: 700 }}>pomóc</span> w Twojej pracy</span>
            </h1>
            {/* Gradient Border Glow Effect (CodePen-inspired) */}
            <div className="w-full flex justify-center mb-8">
              <div className="relative w-[420px] h-[16px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-80 animate-gradient-x"
                  style={{
                    background: 'linear-gradient(90deg, #6ec1e4, #b388ff, #f472b6, #6ec1e4)',
                    backgroundSize: '200% 200%',
                    filter: 'blur(12px)',
                  }}
                />
                <div className="w-full h-2 rounded-full bg-gradient-to-r from-[#6ec1e4] via-[#b388ff] to-[#f472b6] opacity-60" />
              </div>
            </div>
            <div style={{ fontSize: 20, color: '#b3b3b3', fontWeight: 400, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px auto' }}>
              Opisz czym się zajmujesz, a AI wygeneruje dla Ciebie gotowe zastosowania i prompty do pracy.
            </div>
          </div>
        </section>
        {/* Search Section */}
        <section className="flex flex-col items-center justify-center py-10 md:py-16 gap-4 border-b border-white/10 bg-black/50">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 520, margin: '0 auto' }}>
            <textarea
              className="form-control"
              placeholder="Opisz bardzo szczegółowo czym się zajmujesz w pracy..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={3}
              style={{ resize: 'none', fontSize: '1.15rem', background: '#181a20', color: '#fff', border: '1.5px solid #222', borderRadius: 12, outline: 'none', boxShadow: 'none', padding: '18px 16px', letterSpacing: '.01em', width: '100%' }}
            />
            <button
              className="custom-btn bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 hover:from-pink-400 hover:to-blue-400 text-white font-bold shadow-xl border-0 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-200"
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              style={{ width: '100%', fontSize: '1.15rem', borderRadius: 12, padding: '14px 0', marginTop: 4, letterSpacing: '.01em', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? 'Analizuję...' : 'Analizuj'}
            </button>
          </div>
        </section>
        {/* Results Section */}
        <section className="flex flex-col items-center justify-center py-10 md:py-16 gap-8 bg-black/40">
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#fff', letterSpacing: '.01em' }}>Twoje spersonalizowane zastosowania AI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, width: '100%', maxWidth: 1200 }}>
            {results.map((category, idx) => (
              <div key={category.name} className="rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 shadow-2xl border-2 border-fuchsia-400/20 p-8 flex flex-col gap-6 relative overflow-hidden mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400" />
                  <span className="font-semibold text-lg text-white drop-shadow">{category.name}</span>
                </div>
                {/* PROMPT BOX */}
                <div className="rounded-xl bg-gradient-to-r from-fuchsia-700/80 to-cyan-700/80 p-4 text-white font-mono text-base shadow-inner mb-2 border border-fuchsia-400/30">
                  <div className="font-bold text-xs mb-1 text-fuchsia-200 uppercase tracking-wider">Prompt do AI</div>
                  <div className="whitespace-pre-line break-words">{category.applications[0]?.prompt}</div>
                  <button onClick={() => copyPrompt(category.applications[0]?.prompt || '', category.applications[0]?.id || '')} className={`mt-2 px-3 py-1 rounded bg-fuchsia-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-all ${copiedPrompt === category.applications[0]?.id ? 'opacity-60' : ''}`}>{copiedPrompt === category.applications[0]?.id ? 'Skopiowano!' : 'Kopiuj prompt'}</button>
                </div>
                {/* BULLETPOINTS/EXAMPLES */}
                <ul className="list-disc pl-6 space-y-1 text-white/90 text-base">
                  {category.applications[0]?.examples?.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
                {/* Pozostałe aplikacje (jeśli są) */}
                {category.applications.slice(1).map((app, i) => (
                  <div key={app.id} className="mt-6 pt-4 border-t border-white/10">
                    <div className="font-semibold text-fuchsia-300 mb-1">{app.title}</div>
                    <div className="text-white/80 mb-2 text-base">{app.description}</div>
                    <div className="rounded bg-zinc-900/80 p-3 text-xs text-fuchsia-200 font-mono mb-2">{app.prompt}</div>
                    <ul className="list-disc pl-6 space-y-1 text-white/80 text-xs">
                      {app.examples?.map((ex, j) => (
                        <li key={j}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}