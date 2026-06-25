// LanguageContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext<{
    lang: string;
    setLang: (lang: string) => void;
}>({ lang: 'en', setLang: () => { } });

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<string>('en');

    useEffect(() => {
        AsyncStorage.getItem('language').then(stored => {
            if (stored) setLangState(stored);
        });
    }, []);

    const setLang = async (newLang: string) => {
        await AsyncStorage.setItem('language', newLang);
        setLangState(newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return ctx;
};
