// LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createContext, useContext, useEffect, useState } from 'react';

const SUPPORTED_LANGUAGES = ['en', 'it']; // keep in sync with LANGUAGE_TITLES/selectable langs
const DEFAULT_LANGUAGE = 'en';

const LanguageContext = createContext<{
    lang: string;
    setLang: (lang: string) => void;
    isReady: boolean;
    isAutoDetected: boolean; // true if we guessed, false if user explicitly chose
}>({ lang: DEFAULT_LANGUAGE, setLang: () => { }, isReady: false, isAutoDetected: true });

function resolveDeviceLanguage(): string {
    const locales = Localization.getLocales();
    for (const locale of locales) {
        if (SUPPORTED_LANGUAGES.includes(locale.languageCode ?? '')) {
            return locale.languageCode!;
        }
    }
    return DEFAULT_LANGUAGE;
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<string>(DEFAULT_LANGUAGE);
    const [isReady, setIsReady] = useState(false);
    const [isAutoDetected, setIsAutoDetected] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('language');
                if (stored) {
                    setLangState(stored);
                    setIsAutoDetected(false);
                } else {
                    const detected = resolveDeviceLanguage();
                    setLangState(detected);
                    setIsAutoDetected(true);
                    // Persist the detected guess so it's stable across app restarts
                    // until the user explicitly changes it
                    await AsyncStorage.setItem('language', detected);
                }
            } catch (error) {
                console.error('Failed to resolve language:', error);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const setLang = async (newLang: string) => {
        await AsyncStorage.setItem('language', newLang);
        setLangState(newLang);
        setIsAutoDetected(false);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, isReady, isAutoDetected }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return ctx;
};

export async function resetLanguageState() {
    const keys = await AsyncStorage.getAllKeys();
    const langKeys = keys.filter(
        (k) => k === 'language' || k.startsWith('translations:')
    );
    await AsyncStorage.multiRemove(langKeys);
}