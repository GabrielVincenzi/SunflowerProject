import { THEME_COLORS } from '@/constants/utilities';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import SunDrawer from './SunDrawer';

// ─── Types and constants (kept co-located per existing pattern) ────────────

export interface ChartFilters {
    topics: string[];
    countries: string[];
    sources: string[];
}

export interface TopicDef {
    key: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
}

export const TOPICS: TopicDef[] = [
    { key: 'press_media', label: 'Press & media', icon: 'radio' },
    { key: 'income_work', label: 'Income & work', icon: 'briefcase' },
    { key: 'climate_energy', label: 'Climate & energy', icon: 'sun' },
    { key: 'gender_safety', label: 'Gender & safety', icon: 'shield' },
    { key: 'health', label: 'Health', icon: 'heart' },
    { key: 'migration', label: 'Migration', icon: 'globe' },
];

export const EMPTY_FILTERS: ChartFilters = { topics: [], countries: [], sources: [] };

export function countActiveFilters(f: ChartFilters): number {
    return f.topics.length + f.countries.length + f.sources.length;
}

const SOURCE_OPTIONS = ['Eurostat', 'Reporters Without Borders', 'World Bank', 'OECD'];
const COUNTRY_OPTIONS = ['Italy', 'Germany', 'France', 'Spain', 'Poland'];

function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// ─── Shared pill ───────────────────────────────────────────────────────────

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
                backgroundColor: active ? THEME_COLORS.dark : THEME_COLORS.light,
                borderWidth: active ? 0 : 1,
                borderColor: THEME_COLORS.dark,
            }}
        >
            <Text style={{
                fontSize: 12, fontFamily: 'sf-bold',
                color: active ? THEME_COLORS.primary : THEME_COLORS.dark,
            }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <Text style={{
            fontSize: 10, fontFamily: 'sf-bold',
            textTransform: 'uppercase', letterSpacing: 1.2,
            color: THEME_COLORS.dark, marginBottom: 10,
        }}>
            {children}
        </Text>
    );
}

// ─── Main component ────────────────────────────────────────────────────────

interface FilterSheetProps {
    visible: boolean;
    initialFilters: ChartFilters;
    resultCount?: number;
    onClose: () => void;
    onApply: (filters: ChartFilters) => void;
}

export default function FilterSheet({
    visible,
    initialFilters,
    resultCount,
    onClose,
    onApply,
}: FilterSheetProps) {
    const [draft, setDraft] = useState<ChartFilters>(initialFilters);

    useEffect(() => {
        if (visible) setDraft(initialFilters);
    }, [visible, initialFilters]);

    const activeCount = countActiveFilters(draft);

    const ctaLabel = activeCount > 0
        ? `Show ${resultCount != null ? resultCount + ' ' : ''}charts`
        : 'Show all charts';

    return (
        <SunDrawer
            visible={visible}
            onClose={onClose}
            icon="sliders"
            label="Filters"
            title="Filter signals"
            ctaLabel={ctaLabel}
            onCta={() => onApply(draft)}
        >
            {/* Clear all — secondary action inside content area */}
            <TouchableOpacity
                onPress={() => setDraft(EMPTY_FILTERS)}
                style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 }}
            >
                <Text style={{
                    fontSize: 11, fontFamily: 'sf-bold',
                    color: THEME_COLORS.grey,
                }}>
                    Clear all
                </Text>
            </TouchableOpacity>

            {/* Topics */}
            <SectionLabel>Topic</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {TOPICS.map((topic) => (
                    <FilterPill
                        key={topic.key}
                        label={topic.label}
                        active={draft.topics.includes(topic.key)}
                        onPress={() => setDraft((d) => ({ ...d, topics: toggleInList(d.topics, topic.key) }))}
                    />
                ))}
            </View>

            {/* Countries */}
            <SectionLabel>Country</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {COUNTRY_OPTIONS.map((c) => (
                    <FilterPill
                        key={c}
                        label={c}
                        active={draft.countries.includes(c)}
                        onPress={() => setDraft((d) => ({ ...d, countries: toggleInList(d.countries, c) }))}
                    />
                ))}
            </View>

            {/* Sources */}
            <SectionLabel>Source</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {SOURCE_OPTIONS.map((s) => (
                    <FilterPill
                        key={s}
                        label={s}
                        active={draft.sources.includes(s)}
                        onPress={() => setDraft((d) => ({ ...d, sources: toggleInList(d.sources, s) }))}
                    />
                ))}
            </View>
        </SunDrawer>
    );
}