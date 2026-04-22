'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  defaultDisplayLanguage,
  displayLanguageStorageKey,
  isSupportedDisplayLanguage,
  translations,
  type DisplayLanguage,
  type TranslationCatalog,
} from '@/lib/localization'

type LanguageContextValue = {
  language: DisplayLanguage
  setLanguage: (language: DisplayLanguage) => void
  strings: TranslationCatalog
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<DisplayLanguage>(defaultDisplayLanguage)

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(displayLanguageStorageKey)
    if (isSupportedDisplayLanguage(storedLanguage)) {
      setLanguageState(storedLanguage)
      return
    }
    window.localStorage.setItem(displayLanguageStorageKey, defaultDisplayLanguage)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(displayLanguageStorageKey, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    strings: translations[language],
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
