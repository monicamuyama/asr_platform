import enStrings from '@/lib/locales/en.json'

export type DisplayLanguage = 'en'
export type TranslationCatalog = typeof enStrings

export const displayLanguageStorageKey = 'isdr_display_language'

export const displayLanguageOptions: Array<{
  code: DisplayLanguage
  label: string
  description: string
}> = [
  {
    code: 'en',
    label: 'English',
    description: 'Default interface language',
  },
]

export const defaultDisplayLanguage: DisplayLanguage = 'en'

export const translations: Record<DisplayLanguage, TranslationCatalog> = {
  en: enStrings,
}

export function isSupportedDisplayLanguage(value: string | null | undefined): value is DisplayLanguage {
  return value === 'en'
}
