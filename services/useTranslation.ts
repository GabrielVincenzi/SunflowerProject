import { useLanguage } from '@/components/LanguageContext';
import { translationStorage } from '@/interfaces/translationStorage';
import { useQuery } from '@tanstack/react-query';
import { fetchTranslations } from './api';

export function useTranslations() {
    const { lang } = useLanguage();
    return useQuery<Translations>({
        queryKey: ['translations', lang],
        queryFn: async () => {
            try {
                const stored = await translationStorage.get(lang);
                if (stored && Object.keys(stored).length > 0) return stored;
                const fresh = await fetchTranslations(lang);
                await translationStorage.set(lang, fresh);
                return fresh;
            } catch (e) {
                console.error('queryFn threw:', e);
                throw e;
            }
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });
}