import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Copy, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import Head from 'next/head';

const DM_SERIF = 'DM Serif Display, serif';
const INTER = 'Inter, Arial, sans-serif';

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
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [placeholderCursor, setPlaceholderCursor] = useState(true);
  const placeholderRef = useRef<NodeJS.Timeout | null>(null);

  // Animowany placeholder z kursorem
  useEffect(() => {
    if (!searchQuery) {
      placeholderRef.current = setInterval(() => setPlaceholderCursor(c => !c), 500);
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
    setShowAnalyzing(true);
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
      } catch {
        setResults(generateSmartFallback(jobDescription));
        setIsLoading(false);
        setShowAnalyzing(false);
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
    setShowAnalyzing(false);
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
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital,wght@0,400;1,400&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{background:'#111', minHeight:'100vh', color:'#fff', fontFamily: INTER}}>
        {/* HERO + LOGO */}
        <header style={{textAlign:'center', paddingTop:64, paddingBottom:32}}>
          <div style={{fontFamily: DM_SERIF, fontSize:'2.5rem', fontWeight:400, letterSpacing:'0.18em', textTransform:'uppercase', color:'#fff', marginBottom:24}}>AIASSIST</div>
          <h1 style={{fontFamily: DM_SERIF, fontSize:'2.8rem', fontWeight:400, letterSpacing:'0.08em', lineHeight:1.08, color:'#fff', marginBottom:16}}>W czym może<br/>pomóc Ci AI?</h1>
          <div style={{fontFamily: INTER, fontSize:'1.15rem', color:'#bbb', fontWeight:400, marginBottom:0, letterSpacing:'.01em', maxWidth:600, margin:'0 auto'}}>
            Opisz szczegółowo czym się zajmujesz w pracy, a otrzymasz spersonalizowaną listę konkretnych zastosowań AI assistentów z gotowymi promptami
          </div>
        </header>
        {/* WYSZUKIWARKA */}
        <section style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto', maxWidth:600, padding:'48px 0 64px 0'}}>
          <div style={{width:'100%', position:'relative'}}>
            <textarea
              className="form-control bg-transparent text-light border-0 border-bottom border-2 rounded-0 shadow-none fs-3 px-0 mb-4"
              style={{minHeight:60, fontSize:'1.3rem', background:'transparent', color:'#fff', borderColor:'#444', borderRadius:0, outline:'none', boxShadow:'none', resize:'vertical', textAlign:'center', padding:'18px 0', marginBottom:32, fontFamily:INTER, letterSpacing:'.01em'}}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder=""
            />
            {/* Animowany placeholder z kursorem */}
            {!searchQuery && (
              <div style={{position:'absolute',left:0,top:18,width:'100%',textAlign:'center',fontSize:'1.3rem',color:'#888',pointerEvents:'none',fontFamily:INTER}}>
                Opisz bardzo szczegółowo czym się zajmujesz w pracy...
                <span style={{color:'#7f5fff',opacity:placeholderCursor?1:0}}>|</span>
              </div>
            )}
            <div style={{width:'100%', display:'flex', justifyContent:'center', marginTop:24}}>
              <button
                className="btn px-5 py-2 fs-5 rounded-0"
                style={{letterSpacing:'0.08em', borderWidth:2, borderColor:'#444', color:'#fff', background:'transparent', borderStyle:'solid', borderRadius:8, transition:'border-color 0.2s, color 0.2s', fontWeight:500}}
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                onMouseOver={e => e.currentTarget.style.borderColor = '#7f5fff'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#444'}
              >
                {isLoading ? <span className="spinner-border spinner-border-sm me-2" /> : <Zap size={22} className="me-2" />}
                Analizuj <ArrowRight size={22} className="ms-2" />
              </button>
            </div>
            {showAnalyzing && (
              <div className="text-center mt-3" style={{color:'#7f5fff',fontWeight:600,letterSpacing:'.04em',fontSize:'1.1rem',transition:'opacity 0.3s'}}>Analizuję...</div>
            )}
          </div>
        </section>
        {/* WYNIKI */}
        <main style={{maxWidth:1200, margin:'0 auto', padding:'0 1.5rem'}}>
          {hasSearched && results.length > 0 && (
            <section>
              {results.map((category, i) => (
                <div key={category.name} style={{marginBottom:64, paddingBottom:48, borderBottom:'1px solid #222', opacity:0, transform:'translateY(40px)', animation:`fadeInUp 0.7s ${0.2*i}s forwards`}}>
                  <div style={{fontFamily: DM_SERIF, fontSize:'2rem', fontWeight:400, letterSpacing:'0.09em', marginBottom:'1.5em', color:'#fff', textAlign:'left'}}>
                    {category.name}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:'3.5em', alignItems:'start'}}>
                  {category.applications.map((app, j) => (
                    <div key={app.id} style={{marginBottom:'2.2em', background:'none', boxShadow:'none', border:'none', borderRadius:0, padding:'0', opacity:0, transform:'translateY(40px)', animation:`fadeInUp 0.7s ${0.2*i+0.1*j+0.2}s forwards`}}>
                      <div style={{fontFamily: DM_SERIF, fontSize:'1.25rem', fontWeight:400, color:'#fff', marginBottom:'.6em', letterSpacing:'0.04em', textAlign:'left'}}>{app.title}</div>
                      <div style={{fontFamily: INTER, color:'#bbb', fontSize:'1.08rem', marginBottom:'.9em', textAlign:'left'}}>{app.description}</div>
                      {app.examples && app.examples.length > 0 && (
                        <ul style={{fontFamily: INTER, color:'#fff', fontSize:'1.01rem', marginBottom:'.7em', paddingLeft:'1.2em', listStyle:'disc', textAlign:'left'}}>
                          {app.examples.map((ex, idx) => (
                            <li key={idx} style={{marginBottom:'.2em', color:'#7f5fff', borderLeft:'2px solid #7f5fff', paddingLeft:8}}>{ex}</li>
                          ))}
                        </ul>
                      )}
                      {app.prompt && (
                        <div style={{fontFamily: INTER, fontSize:'.98rem', color:'#fff', marginTop:'.7em', borderLeft:'2px solid #7f5fff', paddingLeft:'1em', position:'relative', background:'none', borderRadius:0, textAlign:'left'}}>
                          <span style={{fontWeight:600, color:'#7f5fff', fontSize:'.98rem', letterSpacing:'.01em'}}>Prompt:</span>
                          <span className="ms-2" style={{color:'#fff'}}>{app.prompt}</span>
                          <button className="btn btn-link btn-sm text-light ms-2 p-0 align-baseline" style={{textDecoration:'underline', fontSize:'.98rem'}} onClick={()=>copyPrompt(app.prompt!,app.id)}>
                            {copiedPrompt===app.id ? <CheckCircle size={16}/> : <Copy size={16}/>}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              ))}
            </section>
          )}
          {!hasSearched && (
            <div className="text-center text-secondary py-5" style={{fontFamily:INTER, color:'#666', fontSize:'1.1rem'}}>
              Wpisz opis swojej pracy powyżej, aby AI wygenerował spersonalizowane rozwiązania
            </div>
          )}
        </main>
        <footer className="text-center py-4 mt-5" style={{color:'#444', fontFamily:INTER, fontSize:'.98rem', letterSpacing:'.04em', borderTop:'1px solid #222'}}>
          Napędzane przez AI • Stworzone z ❤️ dla zwiększenia produktywności
        </footer>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity:0; transform:translateY(40px); }
          100% { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  );
}