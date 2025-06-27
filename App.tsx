// test push for GitHub sync
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, ArrowRight, Zap, Brain, Cog, FileText, BarChart3, MessageSquare, Bot, Lightbulb, Rocket, Target, TrendingUp, Users, Mail, Calendar, Code, Database, PenTool, Globe, Plus, ChevronDown, Copy, CheckCircle, RefreshCw, AlertCircle, ExternalLink, Wifi, WifiOff } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Alert, AlertDescription } from './components/ui/alert'

interface AIApplication {
  id: string
  title: string
  description: string
  category: string
  icon: React.ReactNode
  prompt?: string
  examples?: string[]
  isExtended?: boolean
  isGenerated?: boolean
}

interface AICategory {
  name: string
  icon: React.ReactNode
  color: string
  applications: AIApplication[]
  hasMore?: boolean
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
]

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<AICategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [generatingMore, setGeneratingMore] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [connectionTest, setConnectionTest] = useState<'testing' | 'success' | 'failed' | null>(null)
  const [rawApiOutput, setRawApiOutput] = useState<string | null>(null)

  // Replicate API Configuration
  const REPLICATE_TOKEN = process.env.NEXT_PUBLIC_REPLICATE_TOKEN || ''
  const REPLICATE_VERSION = 'openai/gpt-4.1-mini'

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Rotate suggestions
  useEffect(() => {
    if (showSuggestions) {
      const interval = setInterval(() => {
        setCurrentSuggestion(prev => (prev + 1) % searchSuggestions.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showSuggestions])

  const categoryIcons = {
    'Automatyzacja Procesów': <Cog className="w-5 h-5" />,
    'Analiza i Raporty': <BarChart3 className="w-5 h-5" />,
    'Tworzenie Treści': <FileText className="w-5 h-5" />,
    'Research i Analiza': <Brain className="w-5 h-5" />,
    'Komunikacja': <MessageSquare className="w-5 h-5" />,
    'Asystent Biznesowy': <Bot className="w-5 h-5" />,
    'Marketing i Sprzedaż': <Target className="w-5 h-5" />,
    'Zarządzanie Projektami': <Calendar className="w-5 h-5" />,
    'Rozwój Osobisty': <Lightbulb className="w-5 h-5" />,
    'Technologia': <Code className="w-5 h-5" />,
    'Customer Success': <Users className="w-5 h-5" />,
    'Finanse i Księgowość': <Database className="w-5 h-5" />,
    'Design i Kreatywność': <PenTool className="w-5 h-5" />,
    'E-commerce': <Globe className="w-5 h-5" />
  }

  const getCategoryBulletColor = (categoryColor: string) => {
    const colorMap: {[key: string]: string} = {
      'from-pink-400 to-rose-600': 'from-pink-400 to-rose-500',
      'from-green-400 to-emerald-600': 'from-green-400 to-emerald-500',
      'from-purple-400 to-pink-600': 'from-purple-400 to-pink-500',
      'from-blue-400 to-blue-600': 'from-blue-400 to-blue-500',
      'from-emerald-400 to-teal-600': 'from-emerald-400 to-teal-500',
      'from-teal-400 to-cyan-600': 'from-teal-400 to-cyan-500',
      'from-yellow-400 to-orange-500': 'from-yellow-400 to-orange-500',
      'from-indigo-400 to-blue-600': 'from-indigo-400 to-blue-500'
    }
    return colorMap[categoryColor] || 'from-purple-400 to-pink-500'
  }

  const getCategoryColorByName = (categoryName: string) => {
    const colors = {
      'Automatyzacja Procesów': 'from-blue-400 to-blue-600',
      'Analiza i Raporty': 'from-green-400 to-emerald-600',
      'Tworzenie Treści': 'from-purple-400 to-pink-600',
      'Research i Analiza': 'from-orange-400 to-red-500',
      'Komunikacja': 'from-indigo-400 to-blue-600',
      'Asystent Biznesowy': 'from-yellow-400 to-orange-500',
      'Marketing i Sprzedaż': 'from-pink-400 to-rose-600',
      'Zarządzanie Projektami': 'from-teal-400 to-cyan-600',
      'Customer Success': 'from-emerald-400 to-teal-600',
      'Finanse i Księgowość': 'from-indigo-400 to-blue-600',
      'Design i Kreatywność': 'from-purple-400 to-pink-600',
      'E-commerce': 'from-cyan-400 to-blue-600'
    }
    return colors[categoryName as keyof typeof colors] || 'from-gray-400 to-gray-600'
  }

  // Update callReplicateAPI to use /api/replicate
  const callReplicateAPI = async (systemPrompt: string, userPrompt: string, maxTokens: number = 4000) => {
    console.log('🚀 Wywołuję Replicate API przez backend proxy...')
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 30000) // 30 second timeout for creation

      const createResponse = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: REPLICATE_VERSION,
          input: {
            prompt: systemPrompt + "\n" + userPrompt
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('📡 Create Response Status:', createResponse.status)

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('❌ Błąd tworzenia predykcji:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          console.error('❌ Error details:', errorData)
        } catch (e) {
          console.error('❌ Raw error:', errorText)
        }
        if (createResponse.status === 401) {
          throw new Error('INVALID_TOKEN')
        } else if (createResponse.status === 402) {
          throw new Error('INSUFFICIENT_CREDITS')
        } else if (createResponse.status === 429) {
          throw new Error('RATE_LIMITED')
        } else if (createResponse.status === 422) {
          throw new Error('INVALID_INPUT')
        } else {
          throw new Error(`CREATE_ERROR_${createResponse.status}`)
        }
      }

      const prediction = await createResponse.json()
      console.log('📋 Prediction created:', prediction.id, 'Status:', prediction.status)

      // Polling for prediction status with timeout
      let currentPrediction = prediction
      const maxAttempts = 120 // max 2 minutes
      let attempts = 0

      while ((currentPrediction.status === 'starting' || currentPrediction.status === 'processing') && attempts < maxAttempts) {
        console.log(`⏳ Polling attempt ${attempts + 1}: Status = ${currentPrediction.status}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
        const statusController = new AbortController()
        const statusTimeoutId = setTimeout(() => {
          statusController.abort()
        }, 10000) // 10 second timeout for each status check
        try {
          const statusResponse = await fetch(`/api/replicate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: prediction.id }),
            signal: statusController.signal
          })
          clearTimeout(statusTimeoutId)
          if (!statusResponse.ok) {
            console.error('❌ Status check failed:', statusResponse.status)
            throw new Error(`STATUS_ERROR_${statusResponse.status}`)
          }
          currentPrediction = await statusResponse.json()
        } catch (statusError: any) {
          clearTimeout(statusTimeoutId)
          if (statusError.name === 'AbortError') {
            console.error('⏰ Status check timed out')
            throw new Error('STATUS_TIMEOUT')
          }
          throw statusError
        }
      }

      console.log('🏁 Final prediction status:', currentPrediction.status)
      if (currentPrediction.status === 'failed') {
        console.error('❌ Prediction failed:', currentPrediction.error)
        throw new Error('PREDICTION_FAILED')
      }
      if (currentPrediction.status === 'canceled') {
        throw new Error('PREDICTION_CANCELED')
      }
      if (currentPrediction.status !== 'succeeded') {
        console.error('⏰ Prediction timeout. Final status:', currentPrediction.status)
        throw new Error('PREDICTION_TIMEOUT')
      }
      if (!currentPrediction.output) {
        console.error('❌ No output in response:', currentPrediction)
        throw new Error('NO_OUTPUT')
      }
      console.log('✅ Prediction succeeded! Output type:', typeof currentPrediction.output)
      console.log('📊 Output preview:', String(currentPrediction.output).substring(0, 200) + '...')
      return currentPrediction.output
    } catch (error: any) {
      console.error('💥 Replicate API Error:', error)
      if (error.name === 'AbortError') {
        throw new Error('REQUEST_TIMEOUT')
      }
      throw error
    }
  }

  const generateAIRecommendations = async (jobDescription: string) => {
    setIsLoading(true)
    setApiError(null)
    
    try {
      const systemPrompt = `Jesteś ekspertem od rozwiązań AI dla biznesu. Na podstawie opisu pracy użytkownika, wygeneruj szczegółową listę konkretnych zastosowań AI assistentów.

WAŻNE: Odpowiadaj TYLKO w formacie czystego JSON, bez żadnych dodatkowych komentarzy, nagłówków, markdown ani tekstu. NIE DODAWAJ ŻADNYCH WYJAŚNIEŃ, KOMENTARZY, MARKDOWN, ANI TEKSTU PRZED ANI PO JSON. Odpowiadaj tylko czystym JSON. Jeśli nie możesz odpowiedzieć w tym formacie, nie odpowiadaj wcale.`

      const userPrompt = `Opis mojej pracy: ${jobDescription}`

      const output = await callReplicateAPI(systemPrompt, userPrompt, 4000)
      
      // Now: aggressively clean outputText before parsing
      let outputText = ''
      if (typeof output === 'string') {
        outputText = output
      } else if (Array.isArray(output)) {
        outputText = output.join('')
      } else if (output && typeof output === 'object' && output.content) {
        outputText = output.content
      } else if (output && typeof output === 'object' && output.text) {
        outputText = output.text
      } else {
        console.error('❌ Unexpected output format:', typeof output, output)
        throw new Error('INVALID_OUTPUT_FORMAT')
      }

      // Now: aggressively clean outputText before parsing
      outputText = outputText.replace(/```json|```/g, '').replace(/^[^\{]*([\{\[].*)$/, '$1').replace(/([\}\]])[^\}\]]*$/, '$1').trim();
      let aiResponse
      let rawOutputError = null
      try {
        const jsonMatch = outputText.match(/[\{\[][\s\S]*[\}\]]/)
        const jsonText = jsonMatch ? jsonMatch[0] : outputText
        aiResponse = JSON.parse(jsonText)
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError)
        console.log('📄 Raw output:', outputText)
        rawOutputError = outputText
      }

      if (!aiResponse || !aiResponse.categories || !Array.isArray(aiResponse.categories)) {
        setApiError('json_parse')
        setResults([])
        setRawApiOutput(rawOutputError)
        setIsLoading(false)
        setHasSearched(true)
        return
      }

      // Transform the response to match our interface
      const transformedResults: AICategory[] = aiResponse.categories.map((category: any) => ({
        name: category.name,
        icon: categoryIcons[category.name as keyof typeof categoryIcons] || <Zap className="w-5 h-5" />,
        color: getCategoryColorByName(category.name),
        hasMore: false,
        applications: category.applications.map((app: any, index: number) => ({
          id: `${category.name}-${index}-${Date.now()}`,
          title: app.title,
          description: app.description,
          category: category.name,
          icon: <Sparkles className="w-4 h-4" />,
          prompt: app.prompt,
          examples: app.examples || []
        }))
      }))

      console.log('🎯 Wygenerowano', transformedResults.length, 'kategorii przez Replicate')
      setResults(transformedResults)
      
    } catch (error: any) {
      console.error('💥 Błąd podczas wywołania Replicate API:', error)
      
      // Handle specific error types and show smart fallback
      if (error.message === 'CONNECTION_FAILED' || error.message.includes('fetch')) {
        setApiError('cors_blocked')
      } else if (error.message === 'INSUFFICIENT_CREDITS') {
        setApiError('credits')
      } else if (error.message === 'INVALID_TOKEN') {
        setApiError('token')
      } else if (error.message === 'RATE_LIMITED') {
        setApiError('rate_limit')
      } else if (error.message === 'REQUEST_TIMEOUT') {
        setApiError('timeout')
      } else {
        setApiError('general')
      }
    }
    
    setIsLoading(false)
    setHasSearched(true)
  }

  const generateMoreApplications = async (categoryName: string) => {
    setGeneratingMore(categoryName)
    setApiError(null)
    
    try {
      const systemPrompt = `Wygeneruj 2 dodatkowe zastosowania AI dla kategorii "${categoryName}" na podstawie opisu pracy użytkownika.

WAŻNE: Odpowiadaj TYLKO w formacie czystego JSON, bez żadnych dodatkowych komentarzy, nagłówków, markdown ani tekstu. Nie dodawaj żadnych wyjaśnień, tylko JSON!

Zwróć odpowiedź w formacie JSON:
{
  "applications": [
    {
      "title": "Tytuł zastosowania (max 5 słów)",
      "description": "Szczegółowy opis jak AI może pomóc",
      "prompt": "Gotowy prompt do użycia (min 200 znaków)",
      "examples": ["Przykład 1", "Przykład 2", "Przykład 3", "Przykład 4", "Przykład 5"]
    }
  ]
}

Zasady:
- Używaj tylko języka polskiego
- Przykłady muszą być bardzo konkretne
- Prompty gotowe do skopiowania i użycia
- Każde zastosowanie 5 przykładów
- Różne od już wygenerowanych zastosowań`

      const userPrompt = `Kategoria: ${categoryName}\nOpis pracy: ${searchQuery}`

      const output = await callReplicateAPI(systemPrompt, userPrompt, 2500)
      
      let outputText = ''
      if (typeof output === 'string') {
        outputText = output
      } else if (Array.isArray(output)) {
        outputText = output.join('')
      } else if (output && typeof output === 'object' && output.content) {
        outputText = output.content
      } else if (output && typeof output === 'object' && output.text) {
        outputText = output.text
      }

      const jsonMatch = outputText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : outputText
      const aiResponse = JSON.parse(jsonText)
      
      const newApplications: AIApplication[] = aiResponse.applications.map((app: any, index: number) => ({
        id: `${categoryName}-gen-${Date.now()}-${index}`,
        title: app.title,
        description: app.description,
        category: categoryName,
        icon: <Sparkles className="w-4 h-4" />,
        prompt: app.prompt,
        examples: app.examples || [],
        isGenerated: true
      }))

      setResults(prevResults => 
        prevResults.map(category => 
          category.name === categoryName 
            ? { ...category, applications: [...category.applications, ...newApplications] }
            : category
        )
      )
      
      console.log('✅ Dodano', newApplications.length, 'nowych zastosowań przez Replicate')
      
    } catch (error: any) {
      console.error('💥 Błąd podczas generowania więcej aplikacji:', error)
      
      // Fallback for "generate more" - create mock additional applications
      const mockApps: AIApplication[] = [
        {
          id: `${categoryName}-fallback-${Date.now()}`,
          title: 'Smart Process Optimizer',
          description: 'Optymalizuje procesy w kategorii poprzez analizę przepływów pracy i automatyzację kluczowych zadań.',
          category: categoryName,
          icon: <Sparkles className="w-4 h-4" />,
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
      ]

      setResults(prevResults => 
        prevResults.map(category => 
          category.name === categoryName 
            ? { ...category, applications: [...category.applications, ...mockApps] }
            : category
        )
      )

      if (error.message === 'CONNECTION_FAILED' || error.message.includes('fetch')) {
        setApiError('cors_blocked')
      }
    }
    
    setGeneratingMore(null)
  }

  const copyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(id)
      setTimeout(() => setCopiedPrompt(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      generateAIRecommendations(searchQuery)
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const renderApiError = () => {
    if (!apiError) return null

    const errorMessages = {
      cors_blocked: {
        title: "Ograniczenia CORS - API niedostępne z przeglądarki",
        description: "Replicate API blokuje bezpośrednie wywołania z przeglądarki. Wygenerowałem inteligentne rekomendacje na podstawie Twojego opisu.",
        action: "Więcej informacji",
        icon: <WifiOff className="h-4 w-4" />,
        showFallback: true
      },
      credits: {
        title: "Brak środków na koncie Replicate",
        description: "Twoje konto Replicate ma niewystarczające środki. Wygenerowałem przykładowe rekomendacje.",
        action: "Doładuj Replicate",
        icon: <AlertCircle className="h-4 w-4" />,
        showFallback: true
      },
      token: {
        title: "Nieprawidłowy token Replicate",
        description: "Token Replicate API jest nieprawidłowy lub nie ma odpowiednich uprawnień.",
        action: "Sprawdź token",
        icon: <AlertCircle className="h-4 w-4" />,
        showFallback: false
      },
      rate_limit: {
        title: "Limit zapytań przekroczony",
        description: "Przekroczyłeś limit zapytań na minutę dla Replicate API. Poczekaj chwilę.",
        action: "Spróbuj za chwilę",
        icon: <AlertCircle className="h-4 w-4" />,
        showFallback: false
      },
      timeout: {
        title: "Przekroczono limit czasu",
        description: "Połączenie z Replicate API przekroczyło limit czasu. Wygenerowałem przykładowe rekomendacje.",
        action: "Spróbuj ponownie",
        icon: <AlertCircle className="h-4 w-4" />,
        showFallback: true
      },
      general: {
        title: "Problem z połączeniem API",
        description: "Wystąpił problem z Replicate API. Wygenerowałem inteligentne rekomendacje na podstawie Twojego opisu.",
        action: "Spróbuj ponownie",
        icon: <WifiOff className="h-4 w-4" />,
        showFallback: true
      },
      json_parse: {
        title: "Nie udało się sparsować odpowiedzi z Replicate",
        description: "Replicate API nie zwrócił czystego JSON. Popraw prompt lub spróbuj ponownie.",
        action: "Spróbuj ponownie",
        icon: <AlertCircle className="h-4 w-4" />,
        showFallback: true
      }
    }

    const error = errorMessages[apiError as keyof typeof errorMessages]

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <Alert className={`${error.showFallback ? 'bg-amber-900/20 border-amber-500/50' : 'bg-red-900/20 border-red-500/50'} text-white`}>
          {error.icon}
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-white">{error.title}</strong>
              <br />
              {error.description}
              {error.showFallback && (
                <div className="mt-2 text-amber-200">
                  ✨ <strong>Dobra wiadomość:</strong> Aplikacja działa w trybie inteligentnych rekomendacji opartych na analizie Twojego opisu pracy!
                </div>
              )}
            </div>
            {('url' in error) && typeof error.url === 'string' && error.url && (
              <Button
                variant="outline"
                size="sm"
                className={`ml-4 ${error.showFallback ? 'border-amber-500/50 text-amber-200 hover:bg-amber-500/20' : 'border-red-500/50 text-red-200 hover:bg-red-500/20'}`}
                onClick={() => window.open(String(error.url), '_blank')}
              >
                {String(error.action)}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Geometric shapes */}
        <motion.div 
          className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rotate-45"
          animate={{ 
            rotate: [45, 225, 45],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity 
          }}
        />
        <motion.div 
          className="absolute bottom-32 right-32 w-6 h-6 border-2 border-cyan-400"
          animate={{ 
            rotate: [0, 360],
            borderRadius: ["0%", "50%", "0%"]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity 
          }}
        />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="pt-16 pb-12"
        >
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-4 mb-8"
            >
              <motion.div 
                className="p-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Bot className="w-10 h-10" />
              </motion.div>
              <h1 className="text-4xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI Assistant Explorer
              </h1>
              {connectionTest === 'testing' && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Wifi className="w-4 h-4" />
                  </motion.div>
                  <span className="text-sm">Testing connection...</span>
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-8"
            >
              <h2 className="text-7xl md:text-9xl mb-6 leading-none">
                <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  W czym może
                </span>
                <br />
                <span className="text-5xl md:text-7xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  pomóc Ci AI?
                </span>
              </h2>
            </motion.div>
            
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-2xl text-gray-300 max-w-4xl mx-auto mb-16 leading-relaxed"
            >
              Opisz szczegółowo czym się zajmujesz w pracy, a otrzymasz spersonalizowaną listę konkretnych zastosowań AI assistentów z gotowymi promptami
            </motion.p>
          </div>
        </motion.header>

        {/* Giant Search Section */}
        <motion.section 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="container mx-auto px-6 mb-20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <motion.div 
                className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-10 border border-gray-700/50">
                <div className="flex items-center gap-8">
                  <motion.div 
                    className="flex-shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Search className="w-10 h-10 text-purple-400" />
                  </motion.div>
                  
                  <div className="flex-1 relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder=""
                      className="bg-transparent border-none text-5xl placeholder:text-gray-500 focus:ring-0 focus:outline-none h-24 pr-4"
                      style={{ fontSize: '3rem', lineHeight: '1.2' }}
                    />
                    
                    {/* Custom placeholder with blinking cursor */}
                    {!searchQuery && (
                      <motion.div 
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 text-4xl text-gray-500 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        style={{ fontSize: '2.5rem', lineHeight: '1.2' }}
                      >
                        Opisz bardzo szczegółowo czym się zajmujesz w pracy...
                        <motion.span
                          className="text-purple-400"
                          animate={{ opacity: showCursor ? 1 : 0 }}
                          transition={{ duration: 0.1 }}
                        >
                          |
                        </motion.span>
                      </motion.div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 px-16 py-8 rounded-2xl transition-all duration-300 disabled:opacity-50 text-2xl"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-8 h-8" />
                      </motion.div>
                    ) : (
                      <>
                        Analizuj
                        <ArrowRight className="w-8 h-8 ml-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Suggestions dropdown */}
                <AnimatePresence>
                  {showSuggestions && !searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-6 left-0 right-0 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-600/50 overflow-hidden z-50"
                    >
                      <div className="p-8">
                        <p className="text-gray-400 mb-6 text-lg">Przykłady szczegółowych opisów:</p>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {searchSuggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left p-4 rounded-xl hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-white text-lg"
                              whileHover={{ x: 8 }}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ 
                                opacity: 1, 
                                x: 0,
                                backgroundColor: index === currentSuggestion ? 'rgba(147, 51, 234, 0.1)' : 'transparent'
                              }}
                              transition={{ delay: index * 0.05 }}
                            >
                              {suggestion}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.section>

        {/* API Error Section */}
        {apiError && renderApiError()}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {hasSearched && (
            <motion.section 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.8 }}
              className="container mx-auto px-6 pb-20"
            >
              <div className="max-w-7xl mx-auto">
                {isLoading ? (
                  <div className="text-center py-24">
                    <motion.div
                      className="inline-flex flex-col items-center gap-6"
                    >
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center"
                      >
                        <Sparkles className="w-8 h-8" />
                      </motion.div>
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl text-purple-300"
                      >
                        {connectionTest === 'testing' ? 
                          'Testuję połączenie z AI...' : 
                          'AI analizuje Twoje potrzeby i tworzy spersonalizowane rozwiązania...'
                        }
                      </motion.p>
                    </motion.div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-12">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-16"
                    >
                      <h3 className="text-5xl mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {apiError && (apiError === 'cors_blocked' || apiError === 'credits' || apiError === 'timeout' || apiError === 'general') ? 
                          'Inteligentne rekomendacje AI' : 
                          'Spersonalizowane rozwiązania od GPT-4.1-mini'
                        }
                      </h3>
                      <p className="text-xl text-gray-400">
                        {results.length} kategorii • {results.reduce((sum, cat) => sum + cat.applications.length, 0)} konkretnych zastosowań 
                        {apiError && (apiError === 'cors_blocked' || apiError === 'credits' || apiError === 'timeout' || apiError === 'general') ? 
                          ' wygenerowanych inteligentnie' : 
                          ' wygenerowanych przez AI'
                        }
                      </p>
                    </motion.div>
                    
                    {results.map((category, idx) => {
                      const bulletColor = getCategoryBulletColor(category.color)

                      return (
                        <motion.div
                          key={category.name}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.2, duration: 0.8 }}
                          className="mb-12"
                        >
                          <motion.div 
                            className="flex items-center gap-4 mb-8"
                            whileHover={{ x: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className={`p-4 bg-gradient-to-r ${category.color} rounded-2xl`}>
                              {category.icon}
                            </div>
                            <h4 className="text-3xl">{category.name}</h4>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
                          </motion.div>
                          
                          <div className="grid lg:grid-cols-2 gap-8 mb-6">
                            <AnimatePresence>
                              {category.applications.map((app, appIndex) => (
                                <motion.div
                                  key={app.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ 
                                    delay: app.isGenerated ? 0 : idx * 0.2 + appIndex * 0.1, 
                                    duration: 0.6 
                                  }}
                                  whileHover={{ 
                                    scale: 1.02,
                                    y: -5
                                  }}
                                  className="group"
                                >
                                  <Card className={`bg-gray-900/60 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 h-full overflow-hidden ${app.isGenerated ? 'ring-2 ring-green-500/20' : ''}`}>
                                    <div className="p-8">
                                      <div className="flex items-start gap-4 mb-6">
                                        <div className={`p-3 bg-gradient-to-r ${category.color} rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                          {app.icon}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-3">
                                            <h5 className="text-xl text-white group-hover:text-purple-200 transition-colors">
                                              {app.title}
                                            </h5>
                                            {app.isGenerated && (
                                              <Badge variant="outline" className="text-green-400 border-green-500/30">
                                                Nowe
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-gray-300 leading-relaxed mb-6">
                                            {app.description}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {app.examples && app.examples.length > 0 && (
                                        <div className="mb-6">
                                          <Badge variant="outline" className="mb-4 text-cyan-300 border-cyan-500/30">
                                            Konkretne przykłady zastosowań:
                                          </Badge>
                                          <div className="space-y-3">
                                            {app.examples.map((example, idx) => (
                                              <div key={idx} className="flex items-start gap-3 text-gray-300">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${bulletColor} mt-2 flex-shrink-0`}></div>
                                                <span className="leading-relaxed">{example}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {app.prompt && (
                                        <div className="border-t border-gray-700/50 pt-6">
                                          <div className="flex items-center justify-between mb-3">
                                            <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                                              Gotowy prompt do skopiowania:
                                            </Badge>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => copyPrompt(app.prompt!, app.id)}
                                              className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                                            >
                                              {copiedPrompt === app.id ? (
                                                <CheckCircle className="w-4 h-4" />
                                              ) : (
                                                <Copy className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </div>
                                          <div className="bg-black/50 rounded-xl p-4 text-sm text-gray-300 leading-relaxed font-mono border border-gray-700/30">
                                            "{app.prompt}"
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>

                          <div className="flex justify-center gap-4">
                            <Button
                              onClick={() => generateMoreApplications(category.name)}
                              disabled={generatingMore === category.name}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                            >
                              {generatingMore === category.name ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 mr-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </motion.div>
                              ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                              )}
                              Generuj więcej zastosowań
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : apiError === 'json_parse' && rawApiOutput ? (
                  <div className="max-w-2xl mx-auto my-8 p-6 rounded-xl bg-red-900/80 border border-red-400 text-red-100 font-mono text-xs whitespace-pre-wrap shadow-lg">
                    <div className="font-bold text-red-200 mb-2">Nie udało się sparsować odpowiedzi z Replicate (model AI nie zwrócił czystego JSON):</div>
                    <div>{rawApiOutput}</div>
                    <div className="mt-2 text-red-300">Popraw prompt lub spróbuj ponownie.</div>
                  </div>
                ) : apiError ? null : (
                  <div className="text-center py-24">
                    <p className="text-xl text-gray-400">
                      Wpisz opis swojej pracy powyżej, aby AI wygenerował spersonalizowane rozwiązania
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="text-center py-16 border-t border-gray-800/50"
        >
          <p className="text-gray-500">
            Napędzane przez AI • Stworzone z ❤️ dla zwiększenia produktywności
          </p>
        </motion.footer>
      </div>
    </div>
  )
}