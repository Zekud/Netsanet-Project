// LanguageSwitcher.tsx — Dropdown to select between English, Amharic, Tigrinya, Afaan Oromoo, Somali, and Afar.
// Uses custom SVG flags to ensure consistent rendering across all OS (Windows fix).
// Features a premium dropdown UI with smooth transitions and design system tokens.

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';

// ─── Flag Components ──────────────────────────────────────────

const UKFlag = () => (
  <svg viewBox="0 0 60 30" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const EthiopiaFlag = () => (
  <svg viewBox="0 0 1200 600" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="200" fill="#EF3340" y="400" />
    <rect width="1200" height="200" fill="#FEDD00" y="200" />
    <rect width="1200" height="200" fill="#006233" />
    <circle cx="600" cy="300" r="140" fill="#0039A6" />
    <path d="M600,195 L632,295 L738,295 L653,358 L685,458 L600,395 L515,458 L547,358 L462,295 L568,295 Z" fill="#FEDD00" />
  </svg>
);

const TigrayFlag = () => (
  <svg viewBox="0 0 1200 600" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="600" fill="#ED1C24" />
    <polygon points="0,0 600,300 0,600" fill="#FDD017" />
    <polygon points="200,200 222,269 295,269 236,312 259,381 200,338 141,381 164,312 105,269 178,269" fill="#ED1C24" />
  </svg>
);

const OromiaFlag = () => (
  <svg viewBox="0 0 1200 600" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="200" fill="#000000" />
    <rect width="1200" height="200" y="200" fill="#ED1C24" />
    <rect width="1200" height="200" y="400" fill="#FFFFFF" />
    <path d="M 600 150 C 400 150, 350 300, 500 320 C 500 350, 550 380, 570 380 L 570 480 L 630 480 L 630 380 C 650 380, 700 350, 700 320 C 850 300, 800 150, 600 150 Z" fill="#007A33" />
  </svg>
);

const SomaliFlag = () => (
  <svg viewBox="0 0 1200 600" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="200" fill="#009A44" />
    <rect width="1200" height="200" y="200" fill="#FFFFFF" />
    <rect width="1200" height="200" y="400" fill="#D21034" />
    <polygon points="0,0 600,300 0,600" fill="#4189DD" />
    <polygon points="200,200 222,269 295,269 236,312 259,381 200,338 141,381 164,312 105,269 178,269" fill="#FFFFFF" />
  </svg>
);

const AfarFlag = () => (
  <svg viewBox="0 0 1200 600" className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="200" fill="#009A44" />
    <rect width="1200" height="200" y="200" fill="#FFFFFF" />
    <rect width="1200" height="200" y="400" fill="#00A3E0" />
    <polygon points="0,0 600,300 0,600" fill="#D21034" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = i18n.language || 'en';

  const languages = [
    { code: 'en', label: 'English', flag: <UKFlag /> },
    { code: 'am', label: 'አማርኛ', flag: <EthiopiaFlag /> },
    { code: 'ti', label: 'ትግርኛ', flag: <TigrayFlag /> },
    { code: 'om', label: 'Afaan Oromoo', flag: <OromiaFlag /> },
    { code: 'so', label: 'Soomaali', flag: <SomaliFlag /> },
    { code: 'aa', label: 'Afar', flag: <AfarFlag /> }
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => current.startsWith(l.code)) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="language-switcher"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2 text-sm font-medium text-body shadow-xs transition-all duration-200 hover:border-primary/30 hover:bg-primary-soft/30"
      >
        <div className="flex items-center" aria-hidden="true">
          {currentLang.flag}
        </div>
        <span className="hidden sm:inline">
          {currentLang.label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-surface border border-border p-1.5 shadow-xl z-50 animate-scale-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                current.startsWith(lang.code)
                  ? 'bg-primary-soft text-primary'
                  : 'text-body hover:bg-inset hover:text-heading'
              }`}
            >
              <div className="flex items-center" aria-hidden="true">
                {lang.flag}
              </div>
              <span className="font-medium">{lang.label}</span>
              {current.startsWith(lang.code) && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
