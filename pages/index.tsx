import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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
    <div id="colorlib-page">
      <Head>
        <title>AIASSIST</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <a href="#" className="js-colorlib-nav-toggle colorlib-nav-toggle"><i /></a>
      <aside id="colorlib-aside" role="complementary" className="js-fullheight">
        <h1 id="colorlib-logo" className="mb-4 mb-md-5">
          <Link href="/" legacyBehavior>
            <a style={{ backgroundImage: 'url(/images/bg_1.jpg)' }}>AIASSIST</a>
          </Link>
        </h1>
        <nav id="colorlib-main-menu" role="navigation">
          <ul>
            <li className="colorlib-active"><a href="#">Home</a></li>
            <li><a href="#">Learn</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </nav>
        <div className="colorlib-footer">
          <div className="mb-4">
            <h3>Subscribe for newsletter</h3>
            <form action="#" className="colorlib-subscribe-form">
              <div className="form-group d-flex">
                <div className="icon"><span className="icon-paper-plane" /></div>
                <input type="text" className="form-control" placeholder="Enter Email Address" />
              </div>
            </form>
          </div>
          <p className="pfooter">
            Napędzane przez AI • Stworzone z <span style={{ color: 'red' }}>❤</span> dla zwiększenia produktywności
          </p>
        </div>
      </aside>
      <div id="colorlib-main">
        <section className="ftco-section ftco-no-pt ftco-no-pb">
          <div className="container px-md-0">
            <div className="row d-flex no-gutters">
              <div className="col-md-12 portfolio-wrap">
                <div className="row no-gutters align-items-center">
                  <div className="col-md-12">
                    <div className="text pt-5 pl-0 px-lg-5 pl-md-4 ftco-animate">
                      <div className="px-4 px-lg-4">
                        <div className="desc">
                          <div className="top">
                            <span className="subheading">AI Assistant Explorer</span>
                            <h2 className="mb-4">W czym może pomóc Ci AI?</h2>
                          </div>
                          <div className="absolute">
                            <p>Opisz szczegółowo czym się zajmujesz w pracy, a otrzymasz spersonalizowaną listę konkretnych zastosowań AI assistantów z gotowymi promptami</p>
                          </div>
                          <div className="form-group mt-4">
                            <textarea
                              className="form-control"
                              placeholder="Opisz bardzo szczegółowo czym się zajmujesz w pracy..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              onKeyDown={handleKeyPress}
                              rows={3}
                              style={{ resize: 'none' }}
                            />
                          </div>
                          <div className="form-group mt-3">
                            <button
                              className="custom-btn"
                              onClick={handleSearch}
                              disabled={isLoading || !searchQuery.trim()}
                            >
                              {isLoading ? 'Analizuję...' : 'Analizuj'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {hasSearched && (
                <div className="col-md-12 portfolio-wrap mt-5">
                  <div className="row no-gutters align-items-center">
                    <div className="col-md-12">
                      <div className="text pt-5 pl-0 px-lg-5 pl-md-4 ftco-animate">
                        <div className="px-4 px-lg-4">
                          <div className="desc">
                            <div className="top">
                              <span className="subheading">Wyniki AI</span>
                              <h2 className="mb-4">Twoje spersonalizowane zastosowania AI</h2>
                            </div>
                            <div className="absolute">
                              {results.length === 0 && (
                                <p>Brak wyników. Spróbuj opisać swoją pracę inaczej.</p>
                              )}
                              {results.map((cat) => (
                                <div key={cat.name} className="mb-5">
                                  <h3 className="mb-3">{cat.name}</h3>
                                  {cat.applications.map(app => (
                                    <div key={app.id} className="mb-4 p-4" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                      <h4 className="mb-2">{app.title}</h4>
                                      <p className="mb-2">{app.description}</p>
                                      <div className="mb-2">
                                        <strong>Prompt:</strong>
                                        <span style={{ wordBreak: 'break-all', display: 'block', marginTop: 4 }}>{app.prompt}</span>
                                        <button
                                          className="custom-btn mt-2"
                                          style={{ fontSize: 12, padding: '4px 12px' }}
                                          onClick={() => copyPrompt(app.prompt || '', app.id)}
                                        >
                                          {copiedPrompt === app.id ? 'Skopiowano!' : 'Kopiuj prompt'}
                                        </button>
                                      </div>
                                      {app.examples && app.examples.length > 0 && (
                                        <ul className="mb-0" style={{ fontSize: 14 }}>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}