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
    <div className="min-h-screen bg-[#20407b] text-white flex flex-col items-center px-2">
      <Head>
        <title>AIKUMPEL</title>
        <meta name="description" content="KUMPLU, JAK AI MOŻE POMÓC MI W MOJEJ PRACY?" />
      </Head>
      {/* LOGO */}
      <header className="w-full flex justify-center pt-8 pb-2">
        <img src="/aikumpel-logo.png" alt="AIKUMPEL" className="h-8 md:h-10" style={{maxWidth: 180}} />
      </header>
      {/* HERO */}
      <section className="w-full max-w-3xl flex flex-col items-center text-center mb-8">
        <h1 className="font-archivo text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#b3d1ff] leading-tight mb-4 animate-fadein">
          KUMPLU, JAK AI MOŻE POMÓC<br className="hidden md:block"/> MI W MOJEJ PRACY?
        </h1>
        <p className="font-archivo text-base md:text-lg font-bold uppercase text-[#b3d1ff] mb-2 animate-fadein2">
          OPIESZ CZYM SIĘ ZAJMUJESZ, A AI WYGENERUJE DLA CIEBIE GOTOWE ZASTOSOWANIA I PROMPTY DO WYKORZYSTANIA W TWOJEJ PRACY.
        </p>
        {/* SEARCH BAR */}
        <form className="w-full flex flex-col md:flex-row items-center gap-2 mt-4 animate-fadein3" onSubmit={e => e.preventDefault()}>
          <input
            className="flex-1 px-6 py-4 rounded-lg border border-[#b3d1ff] bg-transparent text-lg font-bold text-[#b3d1ff] placeholder-[#b3d1ff] font-archivo outline-none focus:ring-2 focus:ring-[#b3d1ff] transition"
            type="text"
            placeholder="OPISZ TUTAJ CZYM SIĘ ZAJMUJESZ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            className="px-8 py-4 rounded-lg border border-[#b3d1ff] bg-[#20407b] text-[#b3d1ff] font-black font-archivo text-lg uppercase tracking-wider flex items-center gap-2 hover:bg-[#2a4a8c] transition"
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
          >
            ANALIZUJ <span className="text-2xl leading-none">+</span>
          </button>
        </form>
      </section>
      {/* SEKCJA: AUTOMATYZACJA PROCESÓW */}
      <section className="w-full max-w-5xl mt-4 animate-fadein4">
        <h2 className="font-archivo text-2xl md:text-3xl font-black uppercase text-[#b3d1ff] mb-4">AUTOMATYZACJA PROCESÓW</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map((i) => (
            <div key={i} className="rounded-xl bg-[#2a4a8c] border border-[#b3d1ff] p-6 flex flex-col gap-4 shadow-lg relative animate-fadein5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-archivo text-lg md:text-xl font-bold text-white">Automatyzacja umawiania wizyt</h3>
                <img src="/aikumpel-ico.png" alt="AIKUMPEL" className="h-6 w-6" />
              </div>
              <p className="text-[#b3d1ff] text-sm md:text-base font-semibold">AI może przejąć proces komunikacji z pacjentem poprzez automatyczne ustalanie terminów wizyt, wysyłanie przypomnień i zarządzanie kalendarzem lekarza. Dzięki temu zmniejsza się liczba nieobecności i zwiększa efektywność planowania pracy.<br/><br/>Zaprojektuj automatyczny system przypominający i planujący wizyty lekarskie u specjalisty, uwzględniający preferencje pacjenta oraz dostępność lekarza, który ma ograniczone godziny pracy. Uwzględnij wysyłanie przypomnień na email/SMS na 24 godziny i 2 godziny przed wizytą.</p>
              <div className="bg-[#18305c] rounded-lg p-4 mt-2 font-mono text-xs md:text-sm text-white tracking-wide">
                <div className="font-bold mb-1">PROMPT DO AI</div>
                PRZETWÓRZ PONIŻSZE NOTATKI PACJENTA Z KONSULTACJI W PEŁNĄ, PROFESJONALNĄ DOKUMENTACJĘ MEDYCZNĄ ZAWIERAJĄCĄ DIAGNOZĘ, ZALECENIA TERAPEUTYCZNE, HISTORIĘ CHOROBY ORAZ PLAN DALSZEGO LECZENIA. UWZGLĘDNIJ KONTAKTY, DATY I USTALENIA. SEGREGUJ MEDYCZNE INFORMACJE WG STANDARDÓW HL7.
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ANIMACJE */}
      <style jsx>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(-30px);} to { opacity: 1; transform: none; } }
        @keyframes fadein2 { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: none; } }
        @keyframes fadein3 { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
        @keyframes fadein4 { from { opacity: 0; transform: translateY(40px);} to { opacity: 1; transform: none; } }
        @keyframes fadein5 { from { opacity: 0; transform: scale(0.98);} to { opacity: 1; transform: scale(1); } }
        .animate-fadein { animation: fadein 0.7s cubic-bezier(.4,2,.6,1) both; }
        .animate-fadein2 { animation: fadein2 0.8s cubic-bezier(.4,2,.6,1) both; }
        .animate-fadein3 { animation: fadein3 0.9s cubic-bezier(.4,2,.6,1) both; }
        .animate-fadein4 { animation: fadein4 1s cubic-bezier(.4,2,.6,1) both; }
        .animate-fadein5 { animation: fadein5 1.1s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
}