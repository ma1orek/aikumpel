// TEST: commit sprawdzający czy push działa
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

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

  const generateSmartFallback = (jobDescription: string): AICategory[] => [{
    name: 'Automatyzacja Procesów',
    applications: [
      {
        id: 'auto-1',
        title: 'Workflow Manager AI',
        description: 'Automatyzuje codzienne zadania i procesy biznesowe, optymalizuje przepływ pracy i eliminuje powtarzalne czynności.',
        category: 'Automatyzacja Procesów',
        prompt: 'Jesteś ekspertem automatyzacji procesów biznesowych. Pomóż mi zoptymalizować mój workflow poprzez: 1) Identyfikację powtarzalnych zadań, 2) Zaprojektowanie automatycznych przepływów pracy, 3) Integrację z istniejącymi narzędziami, 4) Monitoring i optymalizację procesów, 5) Raportowanie efektywności automatyzacji.',
        examples: [
          'Automatyczne przekazywanie leadów między działami sprzedaży',
          'Workflow zatwierdzania dokumentów z powiadomieniami',
          'Automatyczne generowanie raportów okresowych',
          'System przypomnień o terminach i deadlinach',
          'Integracja między CRM a systemem marketingowym'
        ]
      }
    ]
  }];

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
        setResults(generateSmartFallback(jobDescription));
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
      setResults(generateSmartFallback(jobDescription));
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, Arial, sans-serif', padding: 0, margin: 0 }}>
      <Head>
        <title>AIASSIST</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* HERO SECTION */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 16px 32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 18, color: '#b3b3b3', letterSpacing: 1, marginBottom: 16, fontWeight: 500 }}>AI ASSISTANT EXPLORER</div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.13, marginBottom: 16 }}>
            <span style={{ color: '#fff' }}>Odkryj, jak AI może <span style={{ color: '#6ec1e4', fontStyle: 'italic', fontWeight: 700 }}>pomóc</span> w Twojej pracy</span>
          </h1>
          <div style={{ fontSize: 20, color: '#b3b3b3', fontWeight: 400, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px auto' }}>
            Opisz czym się zajmujesz, a AI wygeneruje dla Ciebie gotowe zastosowania i prompty do pracy.
          </div>
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
              className="custom-btn"
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              style={{ width: '100%', fontSize: '1.15rem', fontWeight: 700, borderRadius: 12, padding: '14px 0', background: 'linear-gradient(90deg,#6ec1e4,#b388ff)', color: '#fff', border: 'none', boxShadow: isLoading ? '0 0 12px #6ec1e477' : 'none', transition: 'box-shadow 0.2s', marginTop: 4, letterSpacing: '.01em', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? 'Analizuję...' : 'Analizuj'}
            </button>
          </div>
        </div>
      </section>
      {/* WYNIKI AI JAKO KARTY */}
      {hasSearched && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 64px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, color: '#fff', letterSpacing: '.01em' }}>Twoje spersonalizowane zastosowania AI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {results.length === 0 && (
              <div style={{ color: '#bbb', fontSize: 18, padding: 32, background: '#181a20', borderRadius: 16, textAlign: 'center' }}>Brak wyników. Spróbuj opisać swoją pracę inaczej.</div>
            )}
            {results.map((cat, i) => (
              <div key={cat.name} style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '.01em' }}>{cat.name}</div>
                {cat.applications.map((app, j) => (
                  <div key={app.id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px #0002', padding: '28px 24px 22px 24px', marginBottom: 24, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `6px solid #6ec1e4`, backgroundImage: pastelCards[(i + j) % pastelCards.length], color: '#181a20', position: 'relative' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-.01em', lineHeight: 1.18 }}>{app.title}</div>
                    <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 10 }}>{app.description}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}><span style={{ color: '#6ec1e4', fontWeight: 700 }}>Prompt:</span> {app.prompt}</div>
                    <button
                      className="custom-btn"
                      style={{ fontSize: 13, padding: '6px 18px', borderRadius: 8, background: '#181a20', color: '#fff', border: 'none', fontWeight: 700, marginTop: 8, alignSelf: 'flex-end', cursor: 'pointer' }}
                      onClick={() => copyPrompt(app.prompt || '', app.id)}
                    >
                      {copiedPrompt === app.id ? 'Skopiowano!' : 'Kopiuj prompt'}
                    </button>
                    {app.examples && app.examples.length > 0 && (
                      <ul style={{ fontSize: 14, margin: '14px 0 0 0', paddingLeft: 18, color: '#23242a', opacity: 0.85 }}>
                        {app.examples.map((ex, idx) => (
                          <li key={idx}>{ex}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}