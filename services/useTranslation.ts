import { useLanguage } from '@/components/LanguageContext';
import { translationStorage } from '@/interfaces/translationStorage';
import { useQuery } from '@tanstack/react-query';
import { fetchTranslations } from './api';
import { useAuthFetch } from './useAuthFetch';

export function useTranslations() {
    const { lang } = useLanguage();
    const authFetch = useAuthFetch();
    return useQuery<Translations>({
        queryKey: ['translations', lang],
        queryFn: async () => {
            try {
                const stored = await translationStorage.get(lang);
                if (stored && Object.keys(stored).length > 0) return stored;
                const fresh = await fetchTranslations(lang, authFetch);
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