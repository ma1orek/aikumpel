import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Copy, CheckCircle, Zap, Sparkles, ArrowRight, Bot, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

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

const searchSuggestions = [
  "Jestem marketingowcem w firmie e-commerce i tworzę kampanie reklamowe na różne platformy",
  "Pracuję jako HR manager w międzynarodowej korporacji i rekrutuję specjalistów IT", 
  "Jestem analitykiem danych w banku i analizuję trendy sprzedażowe oraz ryzyko kredytowe",
  "Prowadzę własny biznes online - sklep z gadżetami i zarządzam całym procesem sprzedaży",
  "Jestem copywriterem freelancerem i piszę treści marketingowe dla różnych branż",
  "Pracuję w IT jako project manager i koordynuję zespoły developerskie w projektach agile",
  "Jestem księgowym w średniej firmie i przygotowuję raporty finansowe oraz analizy kosztów",
  "Prowadzę sklep internetowy z modą i obsługuję klientów oraz zarządzam logistyką",
  "Jestem consultantem biznesowym i doradzam firmom w transformacji cyfrowej",
  "Pracuję jako content creator i tworzę materiały wideo oraz posty na social media",
  "Jestem menedżerem sprzedaży w firmie B2B i zarządzam zespołem sales oraz procesami",
  "Pracuję w dziale customer success i pomagam klientom osiągnąć sukces z naszym produktem",
  "Jestem właścicielem restauracji i zarządzam operacjami, marketingiem i zespołem",
  "Pracuję jako UX designer w zespole produktowym i projektuję interfejsy aplikacji",
  "Jestem trenerem biznesowym i pomagam ludziom rozwijać umiejętności przywódcze"
];

const REPLICATE_VERSION = 'openai/gpt-4.1-mini';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [generatingMore, setGeneratingMore] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<'testing' | 'success' | 'failed' | null>(null);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 500);
    return () => clearInterval(interval);
  }, []);
  // Rotate suggestions
  useEffect(() => {
    if (showSuggestions) {
      const interval = setInterval(() => setCurrentSuggestion(prev => (prev + 1) % searchSuggestions.length), 3000);
      return () => clearInterval(interval);
    }
  }, [showSuggestions]);

  // --- API LOGIKA ---
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
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        if (createResponse.status === 401) throw new Error('INVALID_TOKEN');
        if (createResponse.status === 402) throw new Error('INSUFFICIENT_CREDITS');
        if (createResponse.status === 429) throw new Error('RATE_LIMITED');
        if (createResponse.status === 422) throw new Error('INVALID_INPUT');
        throw new Error(`CREATE_ERROR_${createResponse.status}`);
      }
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
          if (!statusResponse.ok) throw new Error(`STATUS_ERROR_${statusResponse.status}`);
          currentPrediction = await statusResponse.json();
        } catch (statusError: any) {
          clearTimeout(statusTimeoutId);
          if (statusError.name === 'AbortError') throw new Error('STATUS_TIMEOUT');
          throw statusError;
        }
      }
      if (currentPrediction.status === 'failed') throw new Error('PREDICTION_FAILED');
      if (currentPrediction.status === 'canceled') throw new Error('PREDICTION_CANCELED');
      if (currentPrediction.status !== 'succeeded') throw new Error('PREDICTION_TIMEOUT');
      if (!currentPrediction.output) throw new Error('NO_OUTPUT');
      return currentPrediction.output;
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error('REQUEST_TIMEOUT');
      throw error;
    }
  };

  // Fallback (awaryjny)
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

  // Główna funkcja generująca rekomendacje
  const generateAIRecommendations = async (jobDescription: string) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const systemPrompt = `Jesteś ekspertem od rozwiązań AI dla biznesu. Na podstawie opisu pracy użytkownika, wygeneruj szczegółową listę konkretnych zastosowań AI assistentów.\n\nZwróć odpowiedź w formacie JSON z następującą strukturą:\n{\n  \"categories\": [\n    {\n      \"name\": \"Nazwa kategorii\",\n      \"applications\": [\n        {\n          \"title\": \"Konkretny tytuł zastosowania (max 5 słów)\",\n          \"description\": \"Szczegółowy opis 2-3 zdania jak AI może pomóc w tym konkretnym zadaniu\",\n          \"prompt\": \"Bardzo dokładny prompt gotowy do użycia (min 200 znaków)\",\n          \"examples\": [\"Przykład 1 konkretnego zastosowania\", \"Przykład 2\", \"Przykład 3\", \"Przykład 4\", \"Przykład 5\"]\n        }\n      ]\n    }\n  ]\n}\n\nKATEGORIE (wybierz 4-6 najbardziej pasujących):\n- Automatyzacja Procesów - automatyzacja powtarzalnych zadań\n- Analiza i Raporty - analizowanie danych, tworzenie raportów  \n- Tworzenie Treści - pisanie, editing, content marketing\n- Research i Analiza - badanie rynku, konkurencji, trendów\n- Komunikacja - emaile, prezentacje, komunikacja z klientami\n- Asystent Biznesowy - organizacja, planowanie, zarządzanie czasem\n- Marketing i Sprzedaż - kampanie, lead generation, sprzedaż\n- Zarządzanie Projektami - koordynacja, monitoring, planning\n- Customer Success - obsługa klientów, retencja, sukces\n- Finanse i Księgowość - budżety, faktury, analizy finansowe\n- Design i Kreatywność - projektowanie, UX/UI, grafika\n- E-commerce - sklepy online, sprzedaż, logistyka\n\nWYMAGANIA:\n- Dla każdej kategorii podaj 2-3 zastosowania\n- Każdy prompt musi być gotowy do skopiowania i użycia\n- Przykłady muszą być bardzo konkretne i praktyczne\n- Dostosuj wszystko do branży i roli użytkownika\n- Używaj tylko języka polskiego\n- Każde zastosowanie powinno mieć 5 przykładów\n- Prompty powinny być szczegółowe i praktyczne`;
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
      } catch (parseError) {
        let fixedText = outputText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*[\w\s]*?(\{)/m, '$1')
          .replace(/(\})\s*[\w\s]*?$/m, '$1');
        const jsonMatch = fixedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) aiResponse = JSON.parse(jsonMatch[0]);
        else throw new Error('JSON_PARSE_ERROR');
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
    } catch (error: any) {
      setApiError(error.message || 'general');
      setResults(generateSmartFallback(jobDescription));
    }
    setIsLoading(false);
    setHasSearched(true);
  };

  // Generowanie więcej zastosowań (przycisk "Generuj więcej zastosowań")
  const generateMoreApplications = async (categoryName: string) => {
    setGeneratingMore(categoryName);
    setApiError(null);
    try {
      const systemPrompt = `Wygeneruj 2 dodatkowe zastosowania AI dla kategorii \"${categoryName}\" na podstawie opisu pracy użytkownika.\n\nZwróć odpowiedź w formacie JSON:\n{\n  \"applications\": [\n    {\n      \"title\": \"Tytuł zastosowania (max 5 słów)\",\n      \"description\": \"Szczegółowy opis jak AI może pomóc\",\n      \"prompt\": \"Gotowy prompt do użycia (min 200 znaków)\",\n      \"examples\": [\"Przykład 1\", \"Przykład 2\", \"Przykład 3\", \"Przykład 4\", \"Przykład 5\"]\n    }\n  ]\n}\n\nZasady:\n- Używaj tylko języka polskiego\n- Przykłady muszą być bardzo konkretne\n- Prompty gotowe do skopiowania i użycia\n- Każde zastosowanie 5 przykładów\n- Różne od już wygenerowanych zastosowań`;
      const userPrompt = `Kategoria: ${categoryName}\nOpis pracy: ${searchQuery}`;
      const output = await callReplicateAPI(systemPrompt, userPrompt, 2500);
      let outputText = '';
      if (typeof output === 'string') outputText = output;
      else if (Array.isArray(output)) outputText = output.join('');
      else if (output && typeof output === 'object' && output.content) outputText = output.content;
      else if (output && typeof output === 'object' && output.text) outputText = output.text;
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : outputText;
      const aiResponse = JSON.parse(jsonText);
      const newApplications: AIApplication[] = aiResponse.applications.map((app: any, index: number) => ({
        id: `${categoryName}-gen-${Date.now()}-${index}`,
        title: app.title,
        description: app.description,
        category: categoryName,
        prompt: app.prompt,
        examples: app.examples || [],
        isGenerated: true
      }));
      setResults(prevResults =>
        prevResults.map(category =>
          category.name === categoryName
            ? { ...category, applications: [...category.applications, ...newApplications] }
            : category
        )
      );
    } catch (error: any) {
      // Fallback for "generate more" - create mock additional applications
      const mockApps: AIApplication[] = [
        {
          id: `${categoryName}-fallback-${Date.now()}`,
          title: 'Smart Process Optimizer',
          description: 'Optymalizuje procesy w kategorii poprzez analizę przepływów pracy i automatyzację kluczowych zadań.',
          category: categoryName,
          prompt: `Optymalizując procesy w obszarze ${categoryName.toLowerCase()}, pomóż mi: 1) Zidentyfikować wąskie gardła, 2) Zaprojektować efektywniejsze workflow, 3) Zautomatyzować powtarzalne zadania, 4) Zmierzyć i monitorować poprawę wydajności.`,
          examples: [
            'Mapowanie obecnych procesów z time tracking',
            'Identyfikacja możliwości automatyzacji',
            'Projektowanie nowych workflow z bottleneck elimination',
            'Implementation plan z milestone tracking',
            'Performance measurement z KPI monitoring'
          ],
          isGenerated: true
        }
      ];
      setResults(prevResults =>
        prevResults.map(category =>
          category.name === categoryName
            ? { ...category, applications: [...category.applications, ...mockApps] }
            : category
        )
      );
      setApiError(error.message || 'general');
    }
    setGeneratingMore(null);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      generateAIRecommendations(searchQuery);
      setShowSuggestions(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };
  const copyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {}
  };

  // --- UI ---
  return (
    <div className="bg-black min-vh-100 text-light d-flex flex-column" style={{fontFamily:'Noto Sans JP, sans-serif', letterSpacing:'.01em'}}>
      {/* HEADER */}
      <header className="container py-5 text-center border-bottom border-light-subtle mb-4" style={{maxWidth:900}}>
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <span className="rounded-circle bg-dark-subtle d-inline-flex align-items-center justify-content-center" style={{width:56,height:56}}>
            <Bot size={36} />
          </span>
          <h1 className="display-5 fw-bold mb-0" style={{letterSpacing:'0.04em'}}>AI Assistant Explorer</h1>
        </div>
        <h2 className="fw-light mb-2" style={{fontSize:'2.5rem',lineHeight:1.1}}>
          <span className="text-white">W czym może</span><br/>
          <span className="text-primary">pomóc Ci AI?</span>
        </h2>
        <p className="lead text-secondary mb-0">Opisz szczegółowo czym się zajmujesz w pracy, a otrzymasz spersonalizowaną listę konkretnych zastosowań AI assistentów z gotowymi promptami</p>
      </header>

      {/* SEARCH + SUGGESTIONS */}
      <section className="container mb-5" style={{maxWidth:900}}>
        <div className="bg-dark rounded-4 p-4 shadow-sm position-relative border border-light-subtle">
          <div className="d-flex flex-column flex-md-row align-items-stretch gap-3">
            <div className="flex-grow-1 position-relative">
              <textarea
                className="form-control bg-black text-light border-0 fs-3 py-3 px-4 rounded-3 shadow-none"
                style={{minHeight:80,resize:'vertical',fontSize:'1.5rem'}}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyPress}
                placeholder="Opisz bardzo szczegółowo czym się zajmujesz w pracy..."
              />
              {/* Custom placeholder with blinking cursor */}
              {!searchQuery && (
                <span style={{position:'absolute',left:18,top:18,fontSize:'1.5rem',color:'#888',pointerEvents:'none'}}>
                  Opisz bardzo szczegółowo czym się zajmujesz w pracy...
                  <span className="text-primary" style={{opacity:showCursor?1:0}}>|</span>
                </span>
              )}
            </div>
            <button
              className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 fs-4 rounded-3 shadow-none"
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              style={{whiteSpace:'nowrap'}}
            >
              {isLoading ? <span className="spinner-border spinner-border-sm me-2" /> : <Zap size={28} />}
              Analizuj <ArrowRight size={28} />
            </button>
          </div>
          {/* Suggestions dropdown */}
          {showSuggestions && !searchQuery && (
            <div className="position-absolute w-100 mt-2 bg-dark-subtle rounded-3 border border-light-subtle shadow-sm" style={{zIndex:10,left:0}}>
              <div className="p-3">
                <div className="text-secondary mb-2">Przykłady szczegółowych opisów:</div>
                <div className="d-flex flex-column gap-2" style={{maxHeight:220,overflowY:'auto'}}>
                  {searchSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="btn btn-outline-secondary text-start rounded-2 py-2 px-3"
                      style={{fontSize:'1.1rem'}}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESULTS */}
      <main className="container flex-grow-1" style={{maxWidth:900}}>
        {hasSearched && (
          <section className="mb-5">
            <div className="mb-4 text-center">
              <h3 className="fw-bold display-6 mb-2">Spersonalizowane rozwiązania AI</h3>
              <div className="text-secondary">{results.length} kategorii • {results.reduce((sum,cat)=>sum+cat.applications.length,0)} konkretnych zastosowań</div>
            </div>
            {results.map((category, catIdx) => (
              <div key={category.name} className="mb-5 pb-4 border-bottom border-light-subtle">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="rounded-circle bg-primary-subtle d-inline-flex align-items-center justify-content-center" style={{width:40,height:40}}>
                    <Sparkles size={22} />
                  </span>
                  <h4 className="mb-0 fw-semibold" style={{fontSize:'1.5rem'}}>{category.name}</h4>
                </div>
                <div className="row g-4">
                  {category.applications.map((app, appIdx) => (
                    <div className="col-md-6" key={app.id}>
                      <div className="bg-dark-subtle rounded-4 p-4 h-100 border border-light-subtle position-relative">
                        <div className="mb-2 d-flex align-items-center gap-2">
                          <span className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" style={{width:32,height:32}}>
                            <Sparkles size={18} />
                          </span>
                          <span className="fw-bold text-white" style={{fontSize:'1.1rem'}}>{app.title}</span>
                          {app.isGenerated && <span className="badge bg-success ms-2">Nowe</span>}
                        </div>
                        <div className="mb-3 text-secondary" style={{fontSize:'1.05rem'}}>{app.description}</div>
                        {app.examples && app.examples.length > 0 && (
                          <div className="mb-3">
                            <div className="badge bg-info-subtle text-info-emphasis mb-2">Konkretne przykłady zastosowań:</div>
                            <ul className="ps-3 mb-0" style={{fontSize:'1rem'}}>
                              {app.examples.map((ex, exIdx) => (
                                <li key={exIdx} className="mb-1">{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {app.prompt && (
                          <div className="mt-3 border-top pt-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-purple-subtle text-purple-emphasis">Gotowy prompt do skopiowania:</span>
                              <button className="btn btn-sm btn-outline-primary ms-2" onClick={()=>copyPrompt(app.prompt!,app.id)}>
                                {copiedPrompt===app.id ? <CheckCircle size={18}/> : <Copy size={18}/>}
                              </button>
                            </div>
                            <div className="bg-black rounded-3 p-3 text-light small font-monospace border border-light-subtle">"{app.prompt}"</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
        {!hasSearched && (
          <div className="text-center text-secondary py-5">
            Wpisz opis swojej pracy powyżej, aby AI wygenerował spersonalizowane rozwiązania
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center py-4 border-top border-light-subtle mt-auto">
        <div className="text-secondary">Napędzane przez AI • Stworzone z ❤️ dla zwiększenia produktywności</div>
      </footer>
    </div>
  );
}