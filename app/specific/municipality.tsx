import SunButton from '@/components/SunButton';
import TerrainBuilder from '@/components/TerrainBuilder';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

// ─── 1 · Demographics — Population Pyramid ───────────────────────────────────
// activeGeos[0] = left bars (MAL), activeGeos[1] = right bars (FEM)
// Variables extracted via /_[A-Z]{2,3}$/ → age cohort labels (e.g. '0-9')
// Series length 1 (snapshot at 2023)
const pyramidApiData: ChartApiData = {
    activeGeos: ['MAL', 'FEM'],
    activePeriods: ['2023-01-01T00:00:00'],
    variableLabels: { MAL: 'Male', FEM: 'Female' },
    series: {
        '0-9_MAL': [{ value: 318 }], '0-9_FEM': [{ value: 302 }],
        '10-19_MAL': [{ value: 275 }], '10-19_FEM': [{ value: 261 }],
        '20-29_MAL': [{ value: 243 }], '20-29_FEM': [{ value: 258 }],
        '30-39_MAL': [{ value: 308 }], '30-39_FEM': [{ value: 322 }],
        '40-49_MAL': [{ value: 415 }], '40-49_FEM': [{ value: 428 }],
        '50-59_MAL': [{ value: 388 }], '50-59_FEM': [{ value: 412 }],
        '60-69_MAL': [{ value: 352 }], '60-69_FEM': [{ value: 381 }],
        '70-79_MAL': [{ value: 281 }], '70-79_FEM': [{ value: 334 }],
        '80p_MAL': [{ value: 174 }], '80p_FEM': [{ value: 263 }],
        //              ^ '80+' avoids '+' in key; chart displays the variable as-is
    },
};

// ─── 2 · Housing & Land — Treemap ────────────────────────────────────────────
// SunTreemapChart uses lastIndexOf('_') → strips '_MLC' → area label
// Any-length geo code works here; we use 'MLC' for consistency
const treemapApiData: ChartApiData = {
    activeGeos: ['MLC'],
    activePeriods: ['2023-01-01T00:00:00'],
    variableLabels: {},
    series: {
        'residenziale_MLC': [{ value: 42 }],
        'agricola_MLC': [{ value: 28 }],
        'commerciale_MLC': [{ value: 10 }],
        'industriale_MLC': [{ value: 7 }],
        'verde_MLC': [{ value: 9 }],
        'infrastrutture_MLC': [{ value: 4 }],
    },
};

// ─── 3 · Economy — Line (Unemployment trend) ─────────────────────────────────
// SunLineChart uses key.replace(`_${geo}`, '') → 'tasso_disoccupazione'
// activePeriods: one ISO date per year; series values indexed by period
const lineApiData: ChartApiData = {
    activeGeos: ['MLC'],
    activePeriods: [
        '2017-01-01T00:00:00',
        '2018-01-01T00:00:00',
        '2019-01-01T00:00:00',
        '2020-01-01T00:00:00', // COVID spike — chart can add a marker
        '2021-01-01T00:00:00',
        '2022-01-01T00:00:00',
        '2023-01-01T00:00:00',
    ],
    variableLabels: {
        tasso_disoccupazione: 'Unemployment %',
    },
    series: {
        'tasso_disoccupazione_MLC': [
            { value: 6.2 },
            { value: 5.8 },
            { value: 5.4 },
            { value: 8.1 }, // COVID peak
            { value: 7.4 },
            { value: 6.0 },
            { value: 5.1 },
        ],
    },
};

// ─── 4 · Environment — Radar (Sustainability score) ──────────────────────────
// SunRadarChart uses lastIndexOf('_') → e.g. 'aria_MLC' → 'aria'
// Two geos render two overlaid polygons: solid (MLC) + dashed/filled (VNT)
// VNT = Veneto regional average (used as benchmark overlay)
const radarApiData: ChartApiData = {
    activeGeos: ['MLC', 'VNT'],
    activePeriods: ['2023-01-01T00:00:00'],
    variableLabels: {},
    series: {
        'aria_MLC': [{ value: 72 }],
        'acqua_MLC': [{ value: 88 }],
        'verde_MLC': [{ value: 64 }],
        'rumore_MLC': [{ value: 55 }],
        'rifiuti_MLC': [{ value: 79 }],
        'aria_VNT': [{ value: 61 }],
        'acqua_VNT': [{ value: 74 }],
        'verde_VNT': [{ value: 58 }],
        'rumore_VNT': [{ value: 62 }],
        'rifiuti_VNT': [{ value: 70 }],
    },
};

// ─── 5 · Governance — Bar (Budget allocation) ────────────────────────────────
// SunBarChart: activeGeos = x-axis groups (thematic areas, 3-char codes)
//              variables  = sub-bars (MUN, NAT — extracted by regex)
//              series key = `${subBar}_${group}` → e.g. 'MUN_ENV'
// variableLabels maps sub-bar codes → legend labels
const barApiData: ChartApiData = {
    activeGeos: ['ENV', 'SOC', 'ECO', 'EDU', 'CUL', 'SEC'],
    activePeriods: ['2023-01-01T00:00:00'],
    variableLabels: {
        MUN: 'Malcesine',
        NAT: 'National Avg',
    },
    series: {
        'MUN_ENV': [{ value: 23277 }], 'NAT_ENV': [{ value: 19900 }],
        'MUN_SOC': [{ value: 18500 }], 'NAT_SOC': [{ value: 21000 }],
        'MUN_ECO': [{ value: 15400 }], 'NAT_ECO': [{ value: 17300 }],
        'MUN_EDU': [{ value: 12000 }], 'NAT_EDU': [{ value: 14500 }],
        'MUN_CUL': [{ value: 9200 }], 'NAT_CUL': [{ value: 8100 }],
        'MUN_SEC': [{ value: 7800 }], 'NAT_SEC': [{ value: 9200 }],
    },
};

// ─── 6 · Participation — Sorted Stream (Voter turnout by age group) ───────────
// SunSortedStreamChart: single geo 'MLC' (3-char for regex /_[A-Z]{3}$/)
// Variables = stream names (youth, adults, seniors, elderly)
// activePeriods: one date per election year; values array indexed by period
const streamApiData: ChartApiData = {
    activeGeos: ['MLC'],
    activePeriods: [
        '2004-06-13T00:00:00',
        '2008-04-13T00:00:00',
        '2012-05-06T00:00:00',
        '2016-06-05T00:00:00',
        '2020-09-20T00:00:00',
        '2024-06-08T00:00:00',
    ],
    variableLabels: {
        youth: '18–34',
        adults: '35–54',
        seniors: '55–74',
        elderly: '75+',
    },
    series: {
        'youth_MLC': [{ value: 42 }, { value: 48 }, { value: 38 }, { value: 44 }, { value: 50 }, { value: 55 }],
        'adults_MLC': [{ value: 68 }, { value: 70 }, { value: 65 }, { value: 66 }, { value: 67 }, { value: 69 }],
        'seniors_MLC': [{ value: 74 }, { value: 76 }, { value: 73 }, { value: 72 }, { value: 71 }, { value: 73 }],
        'elderly_MLC': [{ value: 71 }, { value: 72 }, { value: 70 }, { value: 68 }, { value: 65 }, { value: 63 }],
    },
};

// ─── Assembled cards ─────────────────────────────────────────────────────────
const MOCK_CARDS: StatCardConfig[] = [
    {
        id: 'demographics',
        category: 'Demographics',
        emoji: '👥',
        chartType: 'populationPyramid',
        data: pyramidApiData,
        headline: '34%',
        headlineUnit: 'over 60',
        interpretiveLine: '1 in 3 residents is over 60 — this town is ageing faster than the national average.',
        source: 'ISTAT — Rilevazione Demografica 2023',
        year: '2023',
        bgTheme: 'white',
        tooltipText: 'A population pyramid shows how many people live in each age group, split by gender. A wide base = many young people; a wide top = an ageing population. Left bars are male, right are female.',
        expandRows: [
            { label: 'Total population', value: '3,640' },
            { label: 'Under 18', value: '593  (16%)' },
            { label: '18–59', value: '1,821 (50%)' },
            { label: '60+', value: '1,226 (34%)' },
            { label: 'Median age', value: '48.2 yrs' },
            { label: 'Gender ratio', value: '94 M / 100 F' },
        ],
    },
    {
        id: 'land-use',
        category: 'Housing & Land',
        emoji: '🏘️',
        chartType: 'treemap',
        data: treemapApiData,
        headline: '42%',
        headlineUnit: 'residential land',
        interpretiveLine: 'Nearly half the territory is built-up — green space and agriculture share the rest.',
        source: 'Catasto Comunale — Piano Regolatore 2023',
        year: '2023',
        bgTheme: 'dark',
        tooltipText: 'A treemap shows proportional composition: each rectangle\'s area equals its share of the total. Bigger block = bigger share of land use.',
        expandRows: [
            { label: 'Residential', value: '42%' },
            { label: 'Agricultural', value: '28%' },
            { label: 'Commercial', value: '10%' },
            { label: 'Green Spaces', value: '9%' },
            { label: 'Industrial', value: '7%' },
            { label: 'Infrastructure', value: '4%' },
        ],
    },
    {
        id: 'employment',
        category: 'Economy',
        emoji: '📈',
        chartType: 'line',
        data: lineApiData,
        headline: '5.1%',
        headlineUnit: 'unemployment',
        interpretiveLine: 'After a COVID spike to 8.1% in 2020, unemployment has recovered to its lowest point in 7 years.',
        source: 'ISTAT — Rilevazione Forze di Lavoro 2023',
        year: '2023',
        bgTheme: 'primary',
        tooltipText: 'A line chart shows how a value changes over time. The sharp upward spike marks the COVID-19 impact in 2020; the downward trend shows economic recovery.',
        expandRows: [
            { label: '2017 rate', value: '6.2%' },
            { label: '2020 peak', value: '8.1%' },
            { label: '2023 rate', value: '5.1%' },
            { label: 'Regional avg', value: '5.8%' },
            { label: 'National avg', value: '6.7%' },
        ],
    },
    {
        id: 'sustainability',
        category: 'Environment',
        emoji: '🌳',
        chartType: 'radar',
        data: radarApiData,
        headline: '88',
        headlineUnit: 'water quality score',
        interpretiveLine: 'Water quality leads all dimensions. Air quality and noise control remain below the regional benchmark.',
        source: 'ARPA Veneto — Rapporto Ambientale 2023',
        year: '2023',
        bgTheme: 'white',
        tooltipText: 'A radar chart plots multiple scores on axes radiating from a centre. The wider the shape, the better the overall performance. The second polygon is the Veneto regional average.',
        expandRows: [
            { label: 'Air Quality', value: '72 / 100' },
            { label: 'Water', value: '88 / 100' },
            { label: 'Green Space', value: '64 / 100' },
            { label: 'Noise', value: '55 / 100' },
            { label: 'Waste Mgmt', value: '79 / 100' },
            { label: 'Overall', value: '71.6 / 100' },
        ],
    },
    {
        id: 'budget',
        category: 'Governance',
        emoji: '⚖️',
        chartType: 'bar',
        data: barApiData,
        headline: '€23K',
        headlineUnit: '/ resident on environment',
        interpretiveLine: 'Environment & waste is the largest budget line — 17% above the national average per resident.',
        source: 'Ministero dell\'Interno — Bilancio Consuntivo 2023',
        year: '2023',
        bgTheme: 'dark',
        tooltipText: 'Each pair of bars compares this municipality (solid) against the national average (lighter). Taller bar = more spending in that category per resident.',
        expandRows: [
            { label: 'Environment', value: '€23,277 / res.' },
            { label: 'Social', value: '€18,500 / res.' },
            { label: 'Economy', value: '€15,400 / res.' },
            { label: 'Education', value: '€12,000 / res.' },
            { label: 'Culture', value: '€9,200 / res.' },
            { label: 'Security', value: '€7,800 / res.' },
        ],
    },
    {
        id: 'voter-turnout',
        category: 'Participation',
        emoji: '🗳️',
        chartType: 'sortedStream',
        data: streamApiData,
        headline: '+13 pts',
        headlineUnit: 'youth turnout since 2004',
        interpretiveLine: 'Young voters are closing the gap — their turnout rose 13 points over 20 years while elderly participation declined.',
        source: 'Ministero dell\'Interno — Archivio Storico Elezioni 2004–2024',
        year: '2024',
        bgTheme: 'primary',
        tooltipText: 'A stream chart shows how participation shifted across age groups over multiple elections. Thicker streams = more votes from that group in that year. Flow left to right = time moving forward.',
        expandRows: [
            { label: '18–34 (2004)', value: '42%' },
            { label: '18–34 (2024)', value: '55%' },
            { label: '35–54 (2024)', value: '69%' },
            { label: '55–74 (2024)', value: '73%' },
            { label: '75+ (2024)', value: '63%' },
            { label: 'Overall avg', value: '66%' },
        ],
    },
];

const normalizeGeo = (geo: string) => geo.replace(/_/g, '-');

const fetchMunicipalityData = async (municipality: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const provincePrefix = municipality.split('_')[0] || 'VR';
    const regionName = 'Veneto';
    const mGeo = normalizeGeo(municipality);
    const provGeo = normalizeGeo(`${provincePrefix}_avg`);
    const regGeo = `${regionName}-avg`;
    const natGeo = 'National-avg';

    return {
        activeGeos: [mGeo, provGeo, regGeo, natGeo],
        activePeriods: ['2020-12-01T00:00:00'],
        variableLabels: {
            'area_ambiente-e-gestione-rifiuti': 'Environment & Waste',
            'area_economia': 'Economy',
            'area_istruzione': 'Education',
            'area_sicurezza': 'Security',
            'area_sociale': 'Social Services',
            'area_cultura': 'Culture & Tourism',
        } as Record<string, string>,
        series: {
            [`area_ambiente-e-gestione-rifiuti_${mGeo}`]: [{ value: 23277 + Math.random() * 5000 }],
            [`area_economia_${mGeo}`]: [{ value: 15400 + Math.random() * 5000 }],
            [`area_istruzione_${mGeo}`]: [{ value: 12000 + Math.random() * 3000 }],
            [`area_sicurezza_${mGeo}`]: [{ value: 8000 + Math.random() * 2000 }],
            [`area_sociale_${mGeo}`]: [{ value: 18000 + Math.random() * 4000 }],
            [`area_cultura_${mGeo}`]: [{ value: 9000 + Math.random() * 2000 }],
            [`popolazione_i_${mGeo}`]: [{ value: 3640 }],
            [`area_ambiente-e-gestione-rifiuti_${provGeo}`]: [{ value: 33884 }],
            [`area_economia_${provGeo}`]: [{ value: 28000 }],
            [`area_istruzione_${provGeo}`]: [{ value: 22000 }],
            [`area_sicurezza_${provGeo}`]: [{ value: 15000 }],
            [`area_sociale_${provGeo}`]: [{ value: 31000 }],
            [`area_cultura_${provGeo}`]: [{ value: 14000 }],
            [`popolazione_i_${provGeo}`]: [{ value: 37449 }],
            [`area_ambiente-e-gestione-rifiuti_${regGeo}`]: [{ value: 8499302 }],
            [`area_economia_${regGeo}`]: [{ value: 7200000 }],
            [`area_istruzione_${regGeo}`]: [{ value: 6500000 }],
            [`area_sicurezza_${regGeo}`]: [{ value: 4200000 }],
            [`area_sociale_${regGeo}`]: [{ value: 9100000 }],
            [`area_cultura_${regGeo}`]: [{ value: 3800000 }],
            [`popolazione_i_${regGeo}`]: [{ value: 3389922 }],
            [`area_ambiente-e-gestione-rifiuti_${natGeo}`]: [{ value: 399404 }],
            [`area_economia_${natGeo}`]: [{ value: 350000 }],
            [`area_istruzione_${natGeo}`]: [{ value: 310000 }],
            [`area_sicurezza_${natGeo}`]: [{ value: 280000 }],
            [`area_sociale_${natGeo}`]: [{ value: 420000 }],
            [`area_cultura_${natGeo}`]: [{ value: 210000 }],
            [`popolazione_i_${natGeo}`]: [{ value: 39902 }],
        },
    };
};

// ─── ShadowCard — kept for error state ───────────────────────────────────────
const ShadowCard = ({
    children,
    bg = 'bg-white',
    shadow = 'bg-dark',
    offsetX = 5,
    offsetY = 5,
    radius = 28,
    border = true,
    className = '',
}: {
    children: React.ReactNode;
    bg?: string;
    shadow?: string;
    offsetX?: number;
    offsetY?: number;
    radius?: number;
    border?: boolean;
    className?: string;
}) => (
    <View className="relative">
        <View
            className={`absolute inset-0 ${shadow}`}
            style={{ borderRadius: radius, transform: [{ translateX: offsetX }, { translateY: offsetY }] }}
        />
        <View
            className={`${bg} ${border ? 'border-2 border-dark' : ''} ${className}`}
            style={{ borderRadius: radius }}
        >
            {children}
        </View>
    </View>
);

// ─── SelectionScreen — unchanged ─────────────────────────────────────────────
const SelectionScreen = ({ onSelect }: { onSelect: (m: string) => void }) => {
    const [search, setSearch] = useState('');
    const municipalities = ['VR_MALCESINE', 'RM_ROMA', 'MI_MILANO', 'NA_NAPOLI', 'TO_TORINO'];
    const filtered = municipalities.filter(m =>
        m.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <View
                className="absolute right-[-60] top-[-60] w-72 h-72 rounded-full bg-dark/5"
                pointerEvents="none"
            />
            <View
                className="absolute right-8 bottom-40 w-48 h-48 rounded-full bg-dark/5"
                pointerEvents="none"
            />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-8 pt-12">
                    <View className="h-[2px] w-12 bg-dark mb-8" />

                    <Animated.View entering={FadeInDown.delay(80).duration(800)}>
                        <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.4em] mb-3">
                            Municipal Intelligence
                        </Text>
                        <Text className="text-7xl font-sf-bold italic tracking-tighter text-dark leading-none">
                            Your{'\n'}City.
                        </Text>
                        <Text className="text-xl font-sf-bold italic text-dark/55 mt-5 leading-snug">
                            Select a municipality to explore its financial health and civic priorities.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(250).duration(800)} className="mt-10">
                        <ShadowCard radius={24} className="flex-row items-center px-5 py-4">
                            <Ionicons name="search" size={18} color="#343a40" style={{ opacity: 0.35 }} />
                            <TextInput
                                className="flex-1 ml-3 font-sf-regular text-dark text-base"
                                placeholder="Search municipality..."
                                placeholderTextColor="rgba(52,58,64,0.3)"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </ShadowCard>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(420).duration(800)} className="mt-10">
                        <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.4em] mb-5">
                            Popular Cities
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {filtered.map(city => (
                                <View key={city} className="relative">
                                    <View
                                        className="absolute inset-0 bg-dark rounded-full"
                                        style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => onSelect(city)}
                                        activeOpacity={0.85}
                                        className="bg-dark px-5 py-3 rounded-full border-2 border-dark"
                                    >
                                        <Text className="text-[10px] font-sf-bold text-primary uppercase tracking-widest">
                                            {city}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const MunicipalityBalanceSheetScreen = () => {
    const [municipality, setMunicipality] = useState<string | null>(null);

    // viewMode stays here — it drives getVal which drives buildCards.
    // The slider receives viewMode + onViewModeChange only to render the toggle.
    const [viewMode, setViewMode] = useState<'absolute' | 'perCapita'>('absolute');

    const { data: apiData, isLoading, error } = useQuery({
        queryKey: ['reports', 'municipality', municipality],
        queryFn: () => fetchMunicipalityData(municipality!),
        enabled: !!municipality,
    });

    // ── Derived geo + identity values (unchanged) ─────────────────────────────
    const primaryGeo = useMemo(
        () => (municipality ? normalizeGeo(municipality) : ''),
        [municipality],
    );
    const cityName = useMemo(() => {
        const parts = primaryGeo.split('-');
        return parts.length > 1 ? parts.slice(1).join(' ') : primaryGeo;
    }, [primaryGeo]);
    const provinceCode = useMemo(() => primaryGeo.split('-')[0], [primaryGeo]);
    const population = useMemo(() => {
        if (!apiData || !municipality) return 1;
        return apiData.series?.[`popolazione_i_${primaryGeo}`]?.[0]?.value || 1;
    }, [apiData, municipality, primaryGeo]);
    const year = useMemo(() => {
        if (!apiData?.activePeriods?.[0]) return '';
        return new Date(apiData.activePeriods[0]).getFullYear().toString();
    }, [apiData]);

    // ── Data helpers (unchanged) ──────────────────────────────────────────────
    const getVal = useCallback(
        (variable: string, geo: string): number => {
            if (!apiData) return 0;
            const raw = apiData.series?.[`${variable}_${geo}`]?.[0]?.value;
            const val = typeof raw === 'number' && isFinite(raw) ? raw : 0;
            if (viewMode === 'perCapita') {
                const popRaw = apiData.series?.[`popolazione_i_${geo}`]?.[0]?.value;
                const pop =
                    typeof popRaw === 'number' && isFinite(popRaw) && popRaw > 0 ? popRaw : 1;
                const result = val / pop;
                return isFinite(result) ? result : 0;
            }
            return val;
        },
        [apiData, viewMode],
    );

    const thematicAreas = Object.keys(apiData?.variableLabels || {});

    const buildSeries = useCallback(
        (geos: string[]) => {
            const series: Record<string, { value: number }[]> = {};
            geos.forEach(geo => {
                thematicAreas.forEach(area => {
                    const v = getVal(area, geo);
                    series[`${area}_${geo}`] = [{ value: isFinite(v) ? v : 0 }];
                });
            });
            return series;
        },
        [thematicAreas, getVal],
    );

    const hasData = (series: Record<string, { value: number }[]>) =>
        Object.values(series).some(s => (s[0]?.value ?? 0) > 0);

    // ── Existing chart data useMemos (unchanged) ──────────────────────────────
    // These now feed buildCards instead of Swiper slides directly.

    const pulseData = useMemo(() => {
        if (!apiData) return null;
        const series = buildSeries([primaryGeo]);
        if (!hasData(series)) return null;
        return { activeGeos: [primaryGeo], series, variableLabels: apiData.variableLabels, activePeriods: apiData.activePeriods };
    }, [apiData, primaryGeo, viewMode]);

    const architectureData = useMemo(() => {
        if (!apiData) return null;
        const series = buildSeries([primaryGeo]);
        if (!hasData(series)) return null;
        return { activeGeos: [primaryGeo], series, variableLabels: apiData.variableLabels, activePeriods: apiData.activePeriods };
    }, [apiData, primaryGeo, viewMode]);

    const benchmarkData = useMemo(() => {
        if (!apiData) return null;
        const geos = apiData.activeGeos ?? [primaryGeo, 'National-avg'];
        const series = buildSeries(geos);
        if (!hasData(series)) return null;
        return { activeGeos: geos, series, variableLabels: apiData.variableLabels, activePeriods: apiData.activePeriods };
    }, [apiData, primaryGeo, viewMode]);

    const barData = useMemo(() => {
        if (!apiData) return null;
        const geoMap: Record<string, string> = { [primaryGeo]: 'MUN', 'National-avg': 'NAT' };
        const areaShortMap: Record<string, string> = {
            'area_ambiente-e-gestione-rifiuti': 'ENV',
            'area_economia': 'ECO',
            'area_istruzione': 'EDU',
            'area_sicurezza': 'SEC',
            'area_sociale': 'SOC',
            'area_cultura': 'CUL',
        };
        const comparisonGeos = [primaryGeo, 'National-avg'];
        const series: Record<string, { value: number }[]> = {};
        thematicAreas.forEach(area => {
            const shortArea = areaShortMap[area] ?? area.slice(0, 3).toUpperCase();
            comparisonGeos.forEach(geo => {
                const shortGeo = geoMap[geo] ?? 'GEO';
                const v = getVal(area, geo);
                series[`${shortGeo}_${shortArea}`] = [{ value: isFinite(v) ? v : 0 }];
            });
        });
        if (!Object.values(series).some(s => (s[0]?.value ?? 0) > 0)) return null;
        return {
            activeGeos: thematicAreas.map(a => areaShortMap[a] ?? a.slice(0, 3).toUpperCase()),
            series,
            variableLabels: { MUN: cityName, NAT: 'National Avg' },
            activePeriods: apiData.activePeriods,
        };
    }, [apiData, primaryGeo, cityName, viewMode, getVal, thematicAreas]);

    const cards = useMemo((): StatCardConfig[] => {
        if (!apiData) return [];

        // ── Shared computed values for headlines / interpretive sentences ────────
        const formatAmount = (v: number) =>
            v >= 1_000_000
                ? `€${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                    ? `€${Math.round(v / 1_000)}K`
                    : `€${Math.round(v)}`;

        const totalSpend = thematicAreas.reduce(
            (sum, area) => sum + getVal(area, primaryGeo),
            0,
        );

        const largestArea =
            thematicAreas.length > 0
                ? thematicAreas.reduce((max, area) =>
                    getVal(area, primaryGeo) > getVal(max, primaryGeo) ? area : max,
                    thematicAreas[0],
                )
                : '';
        const largestLabel = apiData.variableLabels[largestArea] ?? largestArea;
        const largestPct =
            totalSpend > 0
                ? Math.round((getVal(largestArea, primaryGeo) / totalSpend) * 100)
                : 0;

        const areasAboveNational = thematicAreas.filter(
            area => getVal(area, primaryGeo) > getVal(area, 'National-avg'),
        ).length;

        const topVsNat =
            getVal(largestArea, 'National-avg') > 0
                ? Math.round(
                    ((getVal(largestArea, primaryGeo) - getVal(largestArea, 'National-avg')) /
                        getVal(largestArea, 'National-avg')) *
                    100,
                )
                : 0;

        const result: StatCardConfig[] = [];

        // ── Card 1: Pie — The Financial Pulse ────────────────────────────────────
        if (pulseData) {
            result.push({
                id: 'pulse',
                category: 'Finance',
                emoji: '💰',
                chartType: 'pie',
                data: pulseData,
                headline: `${largestPct}%`,
                headlineUnit: `on ${largestLabel.toLowerCase()}`,
                interpretiveLine: `${largestLabel} is ${cityName}'s largest civic investment — ${largestPct}% of total spending in FY ${year}.`,
                source: "Ministero dell'Interno — Bilancio Consuntivo",
                year,
                bgTheme: 'white',
                tooltipText:
                    'A pie chart shows how the total budget is divided. Each segment is one thematic area — the bigger the slice, the more money allocated to it.',
                expandRows: thematicAreas.map(area => ({
                    label: apiData.variableLabels[area] ?? area,
                    value: formatAmount(getVal(area, primaryGeo)),
                })),
            });
        }

        // ── Card 2: Treemap — Spending Architecture ──────────────────────────────
        if (architectureData) {
            result.push({
                id: 'architecture',
                category: 'Budget Structure',
                emoji: '🏛️',
                chartType: 'treemap',
                data: architectureData,
                headline: formatAmount(totalSpend),
                headlineUnit: 'total budget',
                interpretiveLine: `${cityName} allocates ${formatAmount(totalSpend)} across 6 civic domains. Each block's area reflects its share.`,
                source: "Ministero dell'Interno — Bilancio Consuntivo",
                year,
                bgTheme: 'dark',
                tooltipText:
                    "A treemap shows proportional composition: each rectangle's area equals its share of the total. Bigger block = more spending.",
                expandRows: thematicAreas.map(area => ({
                    label: apiData.variableLabels[area] ?? area,
                    value: formatAmount(getVal(area, primaryGeo)),
                })),
            });
        }

        // ── Card 3: Radar — The Benchmark ────────────────────────────────────────
        if (benchmarkData) {
            result.push({
                id: 'benchmark',
                category: 'Benchmark',
                emoji: '🎯',
                chartType: 'radar',
                data: benchmarkData,
                headline: `${areasAboveNational}/${thematicAreas.length}`,
                headlineUnit: 'areas above national avg',
                interpretiveLine: `${cityName} outspends the national average in ${areasAboveNational} of ${thematicAreas.length} civic domains.`,
                source: "Ministero dell'Interno — Bilancio Consuntivo",
                year,
                bgTheme: 'primary',
                tooltipText:
                    'A radar chart plots multiple spending dimensions. Each coloured shape is one geography — wider means higher spending. Shapes overlay for direct comparison.',
                expandRows: (benchmarkData.activeGeos ?? []).map(geo => ({
                    label: geo,
                    value: thematicAreas
                        .map(a => `${(apiData.variableLabels[a] ?? a).slice(0, 3)}: ${formatAmount(getVal(a, geo))}`)
                        .join('  '),
                })),
            });
        }

        // ── Card 4: Bar — The Mirror ─────────────────────────────────────────────
        if (barData) {
            result.push({
                id: 'mirror',
                category: 'Governance',
                emoji: '⚖️',
                chartType: 'bar',
                data: barData,
                headline: `${topVsNat >= 0 ? '+' : ''}${topVsNat}%`,
                headlineUnit: `vs national on ${largestLabel.toLowerCase()}`,
                interpretiveLine: `On its top spending area, ${cityName} invests ${Math.abs(topVsNat)}% ${topVsNat >= 0 ? 'more' : 'less'} than the national average.`,
                source: "Ministero dell'Interno — Bilancio Consuntivo",
                year,
                bgTheme: 'white',
                tooltipText:
                    'Each pair of bars compares this municipality against the national average. Taller municipal bar = more spending than the national baseline.',
                expandRows: thematicAreas.map(area => {
                    const munVal = getVal(area, primaryGeo);
                    const natVal = getVal(area, 'National-avg');
                    const diff =
                        natVal > 0 ? Math.round(((munVal - natVal) / natVal) * 100) : 0;
                    return {
                        label: apiData.variableLabels[area] ?? area,
                        value: `${formatAmount(munVal)} · ${diff >= 0 ? '+' : ''}${diff}% vs NAT`,
                    };
                }),
            });
        }

        // ── Cards 5 & 6: Placeholders — Pyramid + Stream ─────────────────────────
        // fetchMunicipalityData doesn't yet return demographic or election data.
        // MOCK_CARDS[0] (pyramid) and MOCK_CARDS[5] (stream) supply demo data.
        // Replace with live data once the relevant endpoints are available.
        result.push({
            ...MOCK_CARDS[0],
            interpretiveLine: `Demographic breakdown for ${cityName}. Age pyramid sourced from ISTAT demographic surveys.`,
        });
        result.push({
            ...MOCK_CARDS[5],
            interpretiveLine: `Voter participation trends for ${cityName} across election cycles from 2004 to 2024.`,
        });

        return result;
    }, [
        pulseData, architectureData, benchmarkData, barData,
        apiData, primaryGeo, cityName, year, thematicAreas, getVal,
    ]);

    // ── Guard states ─────────────────────────────────────────────────────────────

    if (!municipality) {
        return <SelectionScreen onSelect={setMunicipality} />;
    }

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-primary justify-center items-center px-8">
                <View className="h-[2px] w-12 bg-dark mb-12" />
                <ActivityIndicator size="large" color="#343a40" />
                <Text className="mt-6 font-sf-bold text-dark uppercase tracking-[0.4em] text-[10px]">
                    Fetching Intelligence...
                </Text>
            </SafeAreaView>
        );
    }

    if (error || !apiData) {
        return (
            <SafeAreaView className="flex-1 bg-primary justify-center items-center px-8">
                <View className="h-[2px] w-12 bg-dark mb-8" />
                <Text className="text-dark font-sf-bold text-5xl italic tracking-tighter mb-6 leading-none">
                    Something{'\n'}went wrong.
                </Text>
                <ShadowCard radius={24} className="w-full">
                    <TouchableOpacity
                        onPress={() => setMunicipality(null)}
                        activeOpacity={0.85}
                        className="bg-dark rounded-[24px] py-4 items-center"
                    >
                        <Text className="text-[10px] font-sf-bold text-primary uppercase tracking-[0.4em]">
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </ShadowCard>
            </SafeAreaView>
        );
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    // MunicipalitySlider is self-contained: it owns the FlatList, progress dots,
    // bottom sheet, tooltips, and share sheet. The screen passes data down and
    // receives callbacks (onBack, onViewModeChange, onShareStat) back up.
    return (
        <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
            <TerrainBuilder population={3640} elevationBias={0.65} isCoastal={true} />
            {/*<MunicipalitySlider
                municipalityName={cityName}
                provinceCode={provinceCode}
                population={population}
                year={year}
                cards={cards}
                onBack={() => setMunicipality(null)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onShareStat={card => console.log('shared:', card.id)}
            />*/}
            {/* Fixed Editorial Bottom Return Control */}
            <View className="absolute bottom-6 left-0 right-0 px-8">
                <SunButton
                    text={"Return to Hub"}
                    onPress={() => router.back()}
                />
            </View>
        </SafeAreaView>
    );
};

export default MunicipalityBalanceSheetScreen;