// src/components/stats-card.tsx - THEME AWARE VERSION
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string; // Changed from iconClassName for consistency
  valueClassName?: string;
  theme?: 'modern' | 'classic'; // Optional override
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconColor = 'text-blue-600',
  valueClassName,
  theme: themeOverride,
}: StatsCardProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  // Extract color from iconColor for gradient mapping
  const getGradientColors = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'from-blue-500 to-sky-500';
    if (colorClass.includes('green')) return 'from-green-500 to-emerald-500';
    if (colorClass.includes('purple')) return 'from-purple-500 to-fuchsia-500';
    if (colorClass.includes('red')) return 'from-red-500 to-rose-500';
    if (colorClass.includes('orange')) return 'from-orange-500 to-amber-500';
    if (colorClass.includes('cyan')) return 'from-cyan-500 to-blue-500';
    return 'from-blue-500 to-sky-500'; // default
  };

  const getIconBgColor = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'bg-blue-100';
    if (colorClass.includes('green')) return 'bg-green-100';
    if (colorClass.includes('purple')) return 'bg-purple-100';
    if (colorClass.includes('red')) return 'bg-red-100';
    if (colorClass.includes('orange')) return 'bg-orange-100';
    if (colorClass.includes('cyan')) return 'bg-cyan-100';
    return 'bg-blue-100'; // default
  };

  // ========================================
  // MODERN THEME
  // ========================================
  if (theme === 'modern') {
    const gradientColors = getGradientColors(iconColor);
    
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-xl hover:shadow-2xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-30 animate-pulse" />
        
        <Card className="relative bg-white dark:bg-gray-900 border-0 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {title}
            </CardTitle>
            {/* Icon Badge with Gradient */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColors} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Value with Gradient Text */}
            <div className={valueClassName || `text-4xl font-bold bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent mb-2`}>
              {value}
            </div>
            
            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {description}
              </p>
            )}
            
            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-950/20">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  trend.isPositive 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs font-bold">
                    {trend.isPositive ? '+' : '-'}
                    {Math.abs(trend.value)}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  az elmúlt hónapban
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // CLASSIC THEME
  // ========================================
  return (
    <Card className="border-2 border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {/* Simple Icon with Background */}
        <div className={`p-2 rounded-lg ${getIconBgColor(iconColor)}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple Value */}
        <div className={valueClassName || 'text-3xl font-bold text-gray-900'}>
          {value}
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
        
        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 inline mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1" />
              )}
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-2">
              az elmúlt hónapban
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}