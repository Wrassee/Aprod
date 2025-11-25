import React from 'react';

const HighRiseIconSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"  // ALAPÉRTELMEZETT VÉKONYSÁG CSÖKKENTVE
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Külső körvonal - Vékonyítva 1.5 -> 1.2 */}
    <circle cx="12" cy="12" r="11.5" stroke="#1D4ED8" strokeWidth="1.2" fill="none"/> 
    
    {/* Nagyobb épület */}
    <rect x="6" y="3" width="6" height="16" rx="0.5" fill="#1E3A8A" stroke="none"/> 
    <rect x="6.5" y="3.5" width="5" height="15" rx="0.2" fill="#3B82F6" stroke="none"/> 
    
    {/* Ablakcsíkok - Ultra vékony (0.4) */}
    <path d="M8 4L8 18" stroke="#93C5FD" strokeWidth="0.4"/> 
    <path d="M10 4L10 18" stroke="#93C5FD" strokeWidth="0.4"/> 
    <rect x="8" y="18" width="2" height="1" fill="#1E3A8A" stroke="none"/>
    
    {/* Kisebb épület */}
    <rect x="13" y="7" width="5" height="12" rx="0.5" fill="#1E3A8A" stroke="none"/> 
    <rect x="13.5" y="7.5" width="4" height="11" rx="0.2" fill="#3B82F6" stroke="none"/> 
    <path d="M15.5 8L15.5 18" stroke="#93C5FD" strokeWidth="0.4"/> 
    
    {/* Lift (kabin) - Kiemelve, de vékonyabb kerettel (0.8) */}
    <rect x="8" y="8" width="6" height="6" rx="1" fill="white" stroke="#2563EB" strokeWidth="0.8"/>
    
    {/* Liftajtó felező vonal - nagyon halvány */}
    <path d="M11 8.5L11 13.5" stroke="#BFDBFE" strokeWidth="0.5"/> 
    
    {/* Nyilak a liftben - Éles, vékony vonalak (0.7) */}
    <polyline points="9.5 10 9.5 12" stroke="#2563EB" strokeWidth="0.7"/>
    <polyline points="12.5 10 12.5 12" stroke="#2563EB" strokeWidth="0.7"/>
    <path d="M9 10L9.5 9L10 10" stroke="#2563EB" strokeWidth="0.7" fill="none"/>
    <path d="M12 11L12.5 12L13 11" stroke="#2563EB" strokeWidth="0.7" fill="none"/>
    
    {/* Tető elem */}
    <line x1="9" y1="3" x2="9" y2="1" stroke="#1D4ED8" strokeWidth="0.8"/>
  </svg>
);

export default HighRiseIconSVG;