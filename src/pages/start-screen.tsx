// src/pages/start-screen.tsx - 5 NYELVVEL ÉS CAROUSEL-EL
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface StartScreenProps {
  onLanguageSelect: (language: 'hu' | 'de' | 'en' | 'fr' | 'it') => void;
}

const languages = [
  {
    code: 'de' as const,
    name: 'Deutsch',
    continueText: 'Weiter',
    flag: (
      <>
        <div className="absolute top-0 left-0 w-full h-1/3 bg-black"></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600"></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400"></div>
      </>
    ),
    gradient: 'from-gray-300/30 to-gray-400/30',
    border: 'group-hover:border-gray-300'
  },
  {
    code: 'hu' as const,
    name: 'Magyar',
    continueText: 'Tovább',
    flag: (
      <>
        <div className="absolute top-0 left-0 w-full h-1/3 bg-red-600"></div>
        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-white"></div>
        <div className="absolute top-2/3 left-0 w-full h-1/3 bg-green-600"></div>
      </>
    ),
    gradient: 'from-red-300/20 via-white/20 to-green-300/20',
    border: 'group-hover:border-green-300'
  },
  {
    code: 'en' as const,
    name: 'English',
    continueText: 'Continue',
    flag: (
      <>
        {/* Union Jack - British Flag - Simplified version */}
        <div className="absolute inset-0 bg-blue-800"></div>
        
        {/* White diagonals */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 60 30" preserveAspectRatio="none">
          <path d="M 0,0 L 60,30 M 60,0 L 0,30" stroke="white" strokeWidth="5" />
        </svg>
        
        {/* Red diagonals (narrower) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 60 30" preserveAspectRatio="none">
          <path d="M 0,0 L 60,30 M 60,0 L 0,30" stroke="#DC2626" strokeWidth="3" />
        </svg>
        
        {/* White cross (St George) */}
        <div className="absolute top-0 left-1/2 w-[20%] h-full bg-white -translate-x-1/2"></div>
        <div className="absolute left-0 top-1/2 w-full h-[20%] bg-white -translate-y-1/2"></div>
        
        {/* Red cross (St George) - narrower */}
        <div className="absolute top-0 left-1/2 w-[12%] h-full bg-red-600 -translate-x-1/2"></div>
        <div className="absolute left-0 top-1/2 w-full h-[12%] bg-red-600 -translate-y-1/2"></div>
      </>
    ),
    gradient: 'from-blue-300/30 via-red-300/20 to-blue-300/30',
    border: 'group-hover:border-blue-400'
  },
  {
    code: 'fr' as const,
    name: 'Français',
    continueText: 'Continuer',
    flag: (
      <>
        <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-600"></div>
        <div className="absolute top-0 left-1/3 w-1/3 h-full bg-white"></div>
        <div className="absolute top-0 left-2/3 w-1/3 h-full bg-red-600"></div>
      </>
    ),
    gradient: 'from-blue-300/30 via-white/20 to-red-300/30',
    border: 'group-hover:border-blue-400'
  },
  {
    code: 'it' as const,
    name: 'Italiano',
    continueText: 'Continua',
    flag: (
      <>
        <div className="absolute top-0 left-0 w-1/3 h-full bg-green-600"></div>
        <div className="absolute top-0 left-1/3 w-1/3 h-full bg-white"></div>
        <div className="absolute top-0 left-2/3 w-1/3 h-full bg-red-600"></div>
      </>
    ),
    gradient: 'from-green-300/30 via-white/20 to-red-300/30',
    border: 'group-hover:border-green-400'
  }
];

export function StartScreen({ onLanguageSelect }: StartScreenProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? languages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === languages.length - 1 ? 0 : prev + 1));
  };

  // Két nyelv megjelenítése egyszerre
  const visibleLanguages = [
    languages[currentIndex],
    languages[(currentIndex + 1) % languages.length]
  ];

  if (theme === 'modern') {
    // MODERN VERSION WITH CAROUSEL
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30">
        {/* Subtle animated background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/10 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          {/* OTIS Logo */}
          <div className="mb-16 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-1 shadow-lg border border-blue-100/50">
              <div className="relative bg-white rounded-3xl p-8">
                <img 
                  src="/otis-logo.png" 
                  alt="OTIS Logo" 
                  className="h-40 w-40 object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.log('Logo load failed, path:', (e.target as HTMLImageElement).src);
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Slogan */}
          <div className="mb-20 text-center">
            <p className="text-2xl md:text-3xl font-light text-gray-500 tracking-wide uppercase">
              Made to move you<sup className="text-xs ml-1">™</sup>
            </p>
          </div>
          
          {/* Language Carousel */}
          <div className="relative w-full max-w-2xl">
            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 border border-gray-200"
              aria-label="Previous language"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 border border-gray-200"
              aria-label="Next language"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>

            {/* Language Cards Container */}
            <div className="flex gap-8 justify-center px-12">
              {visibleLanguages.map((lang, idx) => (
                <button
                  key={`${lang.code}-${currentIndex}-${idx}`}
                  onClick={() => {
                    console.log(`🌍 ${lang.name.toUpperCase()} BUTTON CLICKED!`);
                    onLanguageSelect(lang.code);
                  }}
                  className="group relative flex-1 max-w-[200px]"
                >
                  {/* Subtle outer glow */}
                  <div className={`absolute -inset-2 bg-gradient-to-r ${lang.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                  
                  {/* Main card */}
                  <div className={`relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border border-gray-200/50 ${lang.border}`}>
                    {/* Flag */}
                    <div className="w-32 h-20 rounded-xl mb-6 relative overflow-hidden shadow-md transform group-hover:scale-110 transition-transform duration-300">
                      {lang.flag}
                    </div>
                    
                    {/* Text */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xl font-semibold text-gray-700">{lang.name}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>{lang.continueText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Indicator Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {languages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'bg-blue-500 w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to language ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-24 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} OTIS Elevator Company
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CLASSIC VERSION WITH CAROUSEL
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* OTIS Logo */}
      <div className="mb-3">
        <img 
          src="/otis-logo.png" 
          alt="OTIS Logo" 
          className="h-48 w-48 object-contain"
          onError={(e) => {
            console.log('Logo load failed, path:', (e.target as HTMLImageElement).src);
          }}
        />
      </div>
      
      {/* Slogan */}
      <h1 className="text-6xl md:text-7xl font-light text-gray-700 mb-16 text-center tracking-wide leading-relaxed">
        <span className="font-extralight text-gray-600 uppercase text-xl md:text-2xl tracking-widest">
          Made to move you<sup className="text-xs ml-1">™</sup>
        </span>
      </h1>
      
      {/* Language Carousel */}
      <div className="relative w-full max-w-xl">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 hover:scale-110 transition-all duration-200 border-2 border-gray-200"
          aria-label="Previous language"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 hover:scale-110 transition-all duration-200 border-2 border-gray-200"
          aria-label="Next language"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Language Cards */}
        <div className="flex gap-6 justify-center px-8">
          {visibleLanguages.map((lang, idx) => (
            <Button
              key={`${lang.code}-${currentIndex}-${idx}`}
              variant="outline"
              className="flex flex-col items-center p-6 h-auto border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
              onClick={() => {
                console.log(`🌍 ${lang.name.toUpperCase()} BUTTON CLICKED!`);
                onLanguageSelect(lang.code);
              }}
            >
              <div className="w-20 h-14 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                {lang.flag}
              </div>
              <span className="text-lg font-medium text-gray-700">{lang.name}</span>
            </Button>
          ))}
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {languages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to language ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}