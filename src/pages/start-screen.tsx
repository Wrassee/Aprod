// src/pages/start-screen.tsx - THEME AWARE VERSION
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { ArrowRight } from 'lucide-react';

interface StartScreenProps {
  onLanguageSelect: (language: 'hu' | 'de') => void;
}

export function StartScreen({ onLanguageSelect }: StartScreenProps) {
  const { theme } = useTheme(); // ← ÚJ: Theme hook

  if (theme === 'modern') {
    // MODERN VERSION
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30">
        {/* Subtle animated background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/10 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          {/* OTIS Logo - Subtle styling */}
          <div className="mb-16 relative group">
            {/* Very subtle glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Logo container - subtle border */}
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
          
          {/* Slogan - Subtle and elegant */}
          <div className="mb-20 text-center">
            <p className="text-2xl md:text-3xl font-light text-gray-500 tracking-wide uppercase">
              Made to move you<sup className="text-xs ml-1">™</sup>
            </p>
          </div>
          
          {/* Language Selection Cards - Softer design */}
          <div className="flex flex-col sm:flex-row gap-8">
            {/* German Button */}
            <button
              onClick={() => {
                console.log('🇩🇪 GERMAN BUTTON CLICKED!');
                onLanguageSelect('de');
              }}
              className="group relative"
            >
              {/* Subtle outer glow - only on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gray-300/30 to-gray-400/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              {/* Main card - soft background */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border border-gray-200/50 group-hover:border-gray-300">
                {/* Flag - softer shadows */}
                <div className="w-32 h-20 rounded-xl mb-6 relative overflow-hidden shadow-md transform group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-black"></div>
                  <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-600"></div>
                  <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400"></div>
                </div>
                
                {/* Text */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xl font-semibold text-gray-700">Deutsch</span>
                  <div className="flex items-center gap-2 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Weiter</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>

            {/* Hungarian Button */}
            <button
              onClick={() => {
                console.log('🇭🇺 HUNGARIAN BUTTON CLICKED!');
                onLanguageSelect('hu');
              }}
              className="group relative"
            >
              {/* Subtle outer glow - only on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-red-300/20 via-white/20 to-green-300/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              
              {/* Main card - soft background */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 border border-gray-200/50 group-hover:border-green-300">
                {/* Flag - Hungarian colors */}
                <div className="w-32 h-20 rounded-xl mb-6 relative overflow-hidden shadow-md transform group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-red-600"></div>
                  <div className="absolute top-1/3 left-0 w-full h-1/3 bg-white"></div>
                  <div className="absolute top-2/3 left-0 w-full h-1/3 bg-green-600"></div>
                </div>
                
                {/* Text */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xl font-semibold text-gray-700">Magyar</span>
                  <div className="flex items-center gap-2 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Tovább</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Footer - minimal */}
          <div className="mt-24 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} OTIS Elevator Company
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CLASSIC VERSION
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
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
      
      {/* Language Selection */}
      <div className="flex space-x-8">
        {/* German Flag */}
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
          onClick={() => {
            console.log('🇩🇪 GERMAN BUTTON CLICKED!');
            onLanguageSelect('de');
          }}
        >
          <div className="w-20 h-14 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/3 bg-black"></div>
            <div className="absolute top-1/3 left-0 w-full h-1/3 bg-red-500"></div>
            <div className="absolute top-2/3 left-0 w-full h-1/3 bg-yellow-400"></div>
          </div>
          <span className="text-lg font-medium text-gray-700">Deutsch</span>
        </Button>

        {/* Hungarian Flag */}
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
          onClick={() => {
            console.log('🇭🇺 HUNGARIAN BUTTON CLICKED!');
            onLanguageSelect('hu');
          }}
        >
          <div className="w-20 h-14 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/3 bg-red-500"></div>
            <div className="absolute top-1/3 left-0 w-full h-1/3 bg-white"></div>
            <div className="absolute top-2/3 left-0 w-full h-1/3 bg-green-500"></div>
          </div>
          <span className="text-lg font-medium text-gray-700">Magyar</span>
        </Button>
      </div>
    </div>
  );
}