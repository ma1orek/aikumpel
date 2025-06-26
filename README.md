# 🤖 AI Assistant Explorer

Odkryj spersonalizowane zastosowania AI assistentów dla Twojej pracy. Aplikacja analizuje opis Twojej roli zawodowej i generuje konkretne, praktyczne rozwiązania AI z gotowymi promptami.

## ✨ Funkcje

- 🎯 **Spersonalizowane rekomendacje** - AI analizuje Twój opis pracy i generuje dopasowane rozwiązania
- 📝 **Gotowe prompty** - Każde rozwiązanie zawiera szczegółowy prompt gotowy do skopiowania
- 🎨 **Piękny UI/UX** - Nowoczesny, dark theme z animacjami i gradientami
- 🚀 **Szybki i responsywny** - Zoptymalizowany dla wszystkich urządzeń
- 🧠 **Inteligentny fallback** - Działa nawet gdy API jest niedostępne
- 🔄 **Dynamiczne kategorie** - Rozwijaj wyniki o dodatkowe zastosowania

## 🛠️ Technologie

- **Next.js 14** - React framework z App Router
- **TypeScript** - Type safety i lepsze developer experience
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations i transitions
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible component primitives
- **Replicate API** - AI model integration (GPT-4.1-mini)

## 🚀 Szybki start

### Wymagania

- Node.js 18.17+ 
- npm lub yarn
- Konto Replicate (opcjonalne)

### Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/your-username/ai-assistant-explorer.git
   cd ai-assistant-explorer
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   # lub
   yarn install
   ```

3. **Skonfiguruj zmienne środowiskowe**
   ```bash
   cp .env.example .env.local
   ```
   
   Edytuj `.env.local` i dodaj swój token Replicate:
   ```env
   REPLICATE_API_TOKEN=your_replicate_token_here
   ```

4. **Uruchom aplikację**
   ```bash
   npm run dev
   # lub
   yarn dev
   ```

5. **Otwórz przeglądarkę**
   ```
   http://localhost:3000
   ```

## 🌐 Wdrożenie na Vercel

### Automatyczne wdrożenie

1. **Fork tego repozytorium**
2. **Połącz z Vercel**
   - Idź na [vercel.com](https://vercel.com)
   - Kliknij "New Project"
   - Importuj swoje repo z GitHub
3. **Skonfiguruj zmienne środowiskowe**
   - W ustawieniach projektu dodaj `REPLICATE_API_TOKEN`
4. **Deploy!**

### Ręczne wdrożenie

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

## 🔧 Konfiguracja

### Replicate API

1. Utwórz konto na [replicate.com](https://replicate.com)
2. Idź do [Account API Tokens](https://replicate.com/account/api-tokens)
3. Wygeneruj nowy token
4. Dodaj token do `.env.local`

**Ważne:** Aplikacja ma wbudowany inteligentny fallback system, więc działa nawet bez API!

### Customizacja

- **Style**: Edytuj `styles/globals.css` dla Tailwind variables
- **Kolory**: Zmień gradient colors w `App.tsx`
- **Animacje**: Dostosuj Framer Motion animations
- **Kategorie**: Dodaj nowe kategorie AI w `categoryIcons` object

## 📁 Struktura projektu

```
├── App.tsx                 # Main application component
├── components/
│   ├── ui/                 # ShadCN UI components
│   └── figma/             # Custom components
├── styles/
│   └── globals.css        # Global styles & Tailwind config
├── package.json           # Dependencies & scripts
├── next.config.js         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## 🎨 Design System

Aplikacja używa spójnego design system z:

- **Dark theme** z akcent purple/cyan gradients
- **Typography** - Custom Tailwind v4 typography scale
- **Spacing** - Consistent spacing scale
- **Animations** - Subtle micro-interactions
- **Responsive design** - Mobile-first approach

## 🧪 Development

### Dostępne scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript checking
```

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting (recommended)

## 📈 Performance

- **Core Web Vitals** optimized
- **Image optimization** z Next.js
- **Code splitting** automatic
- **Bundle size** minimized
- **SEO ready** z meta tags

## 🐛 Troubleshooting

### Częste problemy

**CORS errors z Replicate API**
- To normalne w browser environment
- Aplikacja automatycznie przechodzi na fallback mode

**Build errors**
- Sprawdź Node.js version (18.17+)
- Usuń `node_modules` i reinstaluj
- Sprawdź TypeScript errors

**Styling issues**
- Upewnij się że używasz Tailwind v4
- Sprawdź `globals.css` import

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Replicate](https://replicate.com) - AI model hosting
- [Vercel](https://vercel.com) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev) - Icon library
- [Radix UI](https://www.radix-ui.com) - Component primitives

---

Made with ❤️ for AI productivity enthusiasts