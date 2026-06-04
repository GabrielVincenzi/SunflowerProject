import { ExportSheet } from "@/components/ExportSheet";
import SunButton from "@/components/SunButton";
import { popupEntering, popupExiting, scrimEntering, scrimExiting } from "@/functions/animations";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useExportChart } from "@/services/useExportChart";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";

import { buildPeriodOptions, normalizePeriod } from '@/functions/dateHandlers';
import { deleteSavedEvent, fetchChartData, fetchDbAvailabilities, fetchSavedIdsEvents, postNewEvent } from '@/services/api';

// Chart Components Mapping
import SunBarChart from "@/components/charts/SunBarChart";
import SunHeatStripe from "@/components/charts/SunHeatStripe";
import SunLineChart from "@/components/charts/SunLineChart";
import SunPackedCircleChart from "@/components/charts/SunPackedCircleChart";
import SunPieChart from "@/components/charts/SunPieChart";
import SunPopulationPyramidChart from "@/components/charts/SunPopulationPyramidChart";
import SunProportionalAreaChart from "@/components/charts/SunProportionalAreaChart";
import SunRadarChart from "@/components/charts/SunRadarChart";
import SunSortedStreamChart from "@/components/charts/SunSortedStreamChart";
import SunStackedAreaChart from "@/components/charts/SunStackedAreaChart";
import SunTreemapChart from "@/components/charts/SunTreemapChart";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useTranslations } from "@/services/useTranslation";

// Import original app theme colors

// ── COLOR ACCESSIBILITY PALETTES ─────────────────────────────────────────────
export const CHART_PALETTES = {
    default: { name: "Sunburst", colors: ["#EE9B00", "#CA6702", "#0A9396", "#BB3E03", "#005F73", "#001219", "#AE2012"], colorblindSafe: false },
    nordic: { name: "Nordic", colors: ["#5B8DB8", "#E07B54", "#6BAA75", "#B5838D", "#7B9E87", "#C9A96E", "#8B7FB8"], colorblindSafe: false },
    ink: { name: "Ink & Dust", colors: ["#141414", "#3D3D3D", "#6B6B6B", "#9E9E9E", "#C5C5C5", "#E0E0E0", "#F7CE46"], colorblindSafe: false },
    terracotta: { name: "Terracotta", colors: ["#C0392B", "#E67E22", "#F39C12", "#D4AC0D", "#7D6608", "#A04000", "#641E16"], colorblindSafe: false },
    ocean: { name: "Deep Ocean", colors: ["#1A237E", "#1565C0", "#0288D1", "#00838F", "#00695C", "#2E7D32", "#558B2F"], colorblindSafe: false },
    tableau10: { name: "Tableau 10", colors: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1"], colorblindSafe: false },
    wong: { name: "Wong 8", colors: ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00"], colorblindSafe: true },
    ibm: { name: "IBM Carbon", colors: ["#648FFF", "#785EF0", "#DC267F", "#FE6100", "#FFB000", "#001141", "#0043CE"], colorblindSafe: true },
    okabe: { name: "Okabe-Ito", colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"], colorblindSafe: true },
} as const;

export type PaletteKey = keyof typeof CHART_PALETTES;

interface Props {
    value: PaletteKey;
    onChange: (key: PaletteKey) => void;
}

export const PaletteSelect = ({ value, onChange }: Props) => {
    const [open, setOpen] = useState(false);
    const active = CHART_PALETTES[value];

    return (
        <View>
            {/* Trigger — same rounded-[32px] style as variable toggles */}
            <View className="relative">
                <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-0.5 translate-y-0.5" />
                <TouchableOpacity
                    onPress={() => setOpen(o => !o)}
                    className={`flex-row items-center justify-between px-6 py-[18px] rounded-[32px] border-2 border-dark ${open ? "bg-primary" : "bg-white"}`}
                    activeOpacity={0.85}
                >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                        <Text className="text-lg font-elms-bold italic text-dark tracking-tight">{active.name}</Text>
                        {/* Continuous gradient-style swatch indicator */}
                        <View className="flex-1 flex-row h-3 rounded-full overflow-hidden border border-dark/10">
                            {active.colors.map((c, i) => (
                                <View key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                            ))}
                        </View>
                    </View>
                    <Feather
                        name="chevron-down"
                        size={18}
                        color="#141414"
                        style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
                    />
                </TouchableOpacity>
            </View>

            {/* Dropdown list */}
            {open && (
                <Animated.View
                    entering={FadeIn.duration(120)}
                    exiting={FadeOut.duration(80)}
                    className="mt-2 rounded-[28px] border-2 border-dark overflow-hidden bg-white"
                >
                    {(Object.entries(CHART_PALETTES) as [PaletteKey, typeof CHART_PALETTES[PaletteKey]][]).map(
                        ([key, palette], i, arr) => {
                            const isSelected = value === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => { onChange(key); setOpen(false); }}
                                    className={`flex-row items-center justify-between gap-3 px-5 py-[14px] ${isSelected ? "bg-primary" : "bg-white"} ${i < arr.length - 1 ? "border-b border-dark/[0.07]" : ""}`}
                                    activeOpacity={0.7}
                                >
                                    <View className="w-[100px]">
                                        <Text className="text-[15px] font-elms-bold italic text-dark" numberOfLines={1}>{palette.name}</Text>
                                    </View>

                                    <View className="flex-1 flex-row h-[18px] rounded-md overflow-hidden border border-dark/10">
                                        {palette.colors.map((c, ci) => (
                                            <View key={ci} className="flex-1 h-full" style={{ backgroundColor: c }} />
                                        ))}
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        {palette.colorblindSafe && (
                                            <View className="bg-dark/5 px-2 py-0.5 rounded-full">
                                                <Text className="text-[8px] font-elms-bold text-dark/50 uppercase tracking-wider">Safe</Text>
                                            </View>
                                        )}
                                        {isSelected && <Feather name="check" size={15} color="#141414" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    )}
                </Animated.View>
            )}
        </View>
    );
};

const CHART_REGISTRY = {
    line: { component: SunLineChart, label: "Line", icon: "activity", group: "time_series" },
    areaStacked: { component: SunStackedAreaChart, label: "Stacked Area", icon: "layers", group: "time_series" },
    areaProp: { component: SunProportionalAreaChart, label: "Proportional", icon: "bar-chart-2", group: "time_series" },
    heatstripe: { component: SunHeatStripe, label: "Heat Stripe", icon: "grid", group: "time_series" },
    sortedStream: { component: SunSortedStreamChart, label: "Stream", icon: "wind", group: "time_series" },
    hist: { component: SunBarChart, label: "Histogram", icon: "bar-chart", group: "distribution" },
    pie: { component: SunPieChart, label: "Pie", icon: "pie-chart", group: "distribution" },
    circles: { component: SunPackedCircleChart, label: "Bubbles", icon: "circle", group: "distribution" },
    tree: { component: SunTreemapChart, label: "Treemap", icon: "square", group: "distribution" },
    radar: { component: SunRadarChart, label: "Radar", icon: "target", group: "comparison" },
    pyramid: { component: SunPopulationPyramidChart, label: "Pyramid", icon: "triangle", group: "comparison" },
} as const;

type ChartTypeKey = keyof typeof CHART_REGISTRY;

const { width: WINDOW_WIDTH } = Dimensions.get("window");

const ChartPage = () => {
    const queryClient = useQueryClient();
    const authFetch = useAuthFetch();
    const router = useRouter();
    const { user } = useUser();
    const { data } = useTranslations();

    if (!data) return null;
    const t: any = data.payload;

    const { db, chart_id, title, description, variables, variableLabels, chart_type } = useLocalSearchParams();
    const chartDb = String(db);
    const chartId = String(chart_id);
    const initialChartType = String(chart_type) as ChartTypeKey;

    const chartRef = useRef<ViewShot>(null);

    // ── Data Fetching ────────────────────────────────────────────────────────
    const { data: availableData, isLoading: isLoadingAvail } = useQuery({
        queryKey: ['dbs', chartDb],
        queryFn: () => fetchDbAvailabilities({ db: chartDb, authFetch }),
    });

    const geoOptions = useMemo(() => availableData?.availableGeos.split("+").map(g => ({ label: g, value: g })) ?? [], [availableData]);
    const periodOptions = useMemo(() => buildPeriodOptions(availableData?.availablePeriods), [availableData]);
    const chartVariablesArray = useMemo(() => Array.isArray(variables) ? variables : String(variables || "").split("+").filter(Boolean), [variables]);


    // ── Local State ──────────────────────────────────────────────────────────
    const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
    const [selectedVars, setSelectedVars] = useState<string[]>(chartVariablesArray.slice(0, 1));
    const [periods, setPeriods] = useState<[string | null, string | null]>([null, null]);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [exportSheetOpen, setExportSheetOpen] = useState(false);
    const [selectedChartType, setSelectedChartType] = useState<ChartTypeKey>(initialChartType);

    // Core applied palette state vs Tentative temporary selections inside the drawer
    const [selectedPalette, setSelectedPalette] = useState<PaletteKey>("default");
    const [tempPalette, setTempPalette] = useState<PaletteKey>("default");

    const compatibleCharts = useMemo(() => {
        const currentGroup = CHART_REGISTRY[selectedChartType]?.group;
        return (Object.entries(CHART_REGISTRY) as [ChartTypeKey, typeof CHART_REGISTRY[ChartTypeKey]][])
            .filter(([, meta]) => meta.group === currentGroup)
            .map(([key, meta]) => ({ key, label: meta.label, icon: meta.icon }));
    }, [selectedChartType]);

    const [query, setQuery] = useState({
        geos: "",
        variables: chartVariablesArray.slice(0, 1).join("+"),
        start: normalizePeriod(periods[0]),
        end: normalizePeriod(periods[1])
    });

    useEffect(() => {
        if (geoOptions.length > 0 && query.geos === "") {
            const initialGeo = geoOptions[0].value;
            setSelectedGeos([initialGeo]);
            setQuery(prev => ({ ...prev, geos: initialGeo }));
        }
    }, [geoOptions]);

    // ── Api Data ──────────────────────────────────────────────────────────
    const { data: apiData, isFetching: isFetchingChart } = useQuery({
        queryKey: ['chartData', chartDb, query],
        queryFn: () => fetchChartData({
            db: chartDb,
            variables: query.variables,
            geos: query.geos,
            startPeriod: query.start,
            endPeriod: query.end,
            authFetch,
        }),
        enabled: !!query.geos,
        placeholderData: keepPreviousData,
    });

    const varLabelMap: Record<string, string> = useMemo(() => {
        if (!variableLabels) return {};
        const raw = Array.isArray(variableLabels) ? variableLabels[0] : variableLabels;
        try {
            return JSON.parse(raw) as Record<string, string>;
        } catch {
            // Fallback: "gdp:GDP Growth+pop:Population" flat format
            return Object.fromEntries(
                raw.split("+")
                    .map(pair => pair.split(":") as [string, string])
                    .filter(([k]) => Boolean(k))
            );
        }
    }, [variableLabels]);

    // Enrich apiData with the labels that came from navigation params and current active palette choices
    const enrichedApiData = useMemo(() => {
        if (!apiData) return undefined;
        return {
            ...apiData,
            variableLabels: varLabelMap,
            palette: CHART_PALETTES[selectedPalette].colors,
        };
    }, [apiData, varLabelMap, selectedPalette]);

    const { data: savedSet, isLoading: isLoadingSavedSet } = useQuery({
        queryKey: ['charts', 'savedIds'],
        queryFn: () => fetchSavedIdsEvents(authFetch),
        select: useCallback((data: string[]) => new Set(data.map(String)), []),
    });

    const isSaved = savedSet?.has(String(chartId)) ?? false;


    // ── Mutations ────────────────────────────────────────────────────────────
    const savedMutation = useMutation({
        mutationFn: ({ chartId }: { chartId: string }) => postNewEvent({ action: 'saved', objectId: chartId, authFetch }),
        onMutate: async ({ chartId }) => {
            await queryClient.cancelQueries({ queryKey: ['charts', 'savedIds'] });
            await queryClient.cancelQueries({ queryKey: ['charts', 'saved'] });
            const prev = queryClient.getQueryData<string[]>(['charts', 'savedIds']);
            queryClient.setQueryData<string[]>(['charts', 'savedIds'], (old = []) => old.includes(chartId) ? old : [...old, chartId]);
            return { prev };
        },
        onError: (_err, vars, context) => context?.prev !== undefined && queryClient.setQueryData(['charts', 'savedIds'], context.prev),
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['charts', 'savedIds'], refetchType: 'all' }),
                queryClient.invalidateQueries({ queryKey: ['charts', 'saved'], refetchType: 'all' }),
            ]);
        },
    });

    const deleteSavedMutation = useMutation({
        mutationFn: ({ chartId }: { chartId: string }) => deleteSavedEvent({ objectId: chartId, authFetch }),
        onMutate: async ({ chartId }) => {
            await queryClient.cancelQueries({ queryKey: ['charts', 'savedIds'] });
            await queryClient.cancelQueries({ queryKey: ['charts', 'saved'] });
            const prev = queryClient.getQueryData<string[]>(['charts', 'savedIds']);
            queryClient.setQueryData<string[]>(['charts', 'savedIds'], (old = []) => old.filter(id => id !== chartId));
            return { prev };
        },
        onError: (_err, vars, context) => context?.prev !== undefined && queryClient.setQueryData(['charts', 'savedIds'], context.prev),
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['charts', 'savedIds'], refetchType: 'all' }),
                queryClient.invalidateQueries({ queryKey: ['charts', 'saved'], refetchType: 'all' }),
            ]);
        },
    });

    const handleSave = useCallback(() => {
        if (!user) return;
        isSaved ? deleteSavedMutation.mutate({ chartId }) : savedMutation.mutate({ chartId });
    }, [user, isSaved, chartId]);


    // ── Export ───────────────────────────────────────────────────────────────
    const { exportAs, isExporting, exportError } = useExportChart({
        chartRef,
        title: String(title),
        description: String(description),
        chartType: selectedChartType,
        dataSource: availableData?.dbSource ?? "",
        activeGeos: enrichedApiData?.activeGeos ?? selectedGeos,
        apiData: enrichedApiData,
    });

    const handleExport = useCallback(async (format: ExportFormat) => {
        if (!enrichedApiData || !enrichedApiData.activeGeos?.length) return;
        await exportAs(format, enrichedApiData);
        if (!exportError) setExportSheetOpen(false);
    }, [exportAs, exportError, enrichedApiData]);

    // ── Chart Rendering ──────────────────────────────────────────────────────
    const ChartComponent = CHART_REGISTRY[selectedChartType]?.component ?? SunLineChart;
    const chartElement = useMemo(
        () => <ChartComponent screenWidth={WINDOW_WIDTH * 0.9} apiData={enrichedApiData} />,
        [ChartComponent, enrichedApiData],
    );

    // ── Early return: loading ────────────────────────────────────────────────
    if (!enrichedApiData || isLoadingSavedSet || isFetchingChart)
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-dark/40 font-elms-bold italic uppercase tracking-widest">
                    {t.chartPage.header.signalAnalysisLabel}
                </Text>
            </View>
        );


    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-background">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, overflow: 'visible' }}>

                {/* 1. Header Section */}
                <Animated.View entering={FadeInDown.delay(100)} className="px-8 mt-14 mb-8">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[2px] w-10 bg-dark" />
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                            {t.chartPage.header.signalAnalysis} // {String(selectedChartType).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-none">
                        {title}
                    </Text>
                </Animated.View>

                {/* 2. Visual Layer (ViewShot for Export) */}
                <ViewShot ref={chartRef} options={{ format: "png", quality: 1 }} style={{ backgroundColor: "#FDFCF6", paddingBottom: 20 }}>
                    {/* Chart Core */}
                    <Animated.View entering={FadeIn.delay(400)} className="px-4 mb-4 items-center justify-center min-h-[320]">
                        {chartElement}
                    </Animated.View>
                </ViewShot>

                {/* 3. Action Logic Bar */}
                <View className="px-8 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="text-[9px] uppercase font-elms-bold text-dark/40 tracking-[0.2em] mb-1">{t.chartPage.actionBar.dataSourceLabel}</Text>
                        <Text className="text-xs font-elms-bold italic text-dark uppercase leading-none">{availableData?.dbSource || t.chartPage.actionBar.dataSourceFallback}</Text>
                    </View>

                    <View className="flex-row gap-4">
                        {/* Filter Button */}
                        <View className="relative">
                            <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                            <TouchableOpacity
                                onPress={() => {
                                    // Make sure current applied values are synced to draft states when opening 
                                    setTempPalette(selectedPalette);
                                    setOverlayOpen(true);
                                }}
                                className="w-14 h-14 rounded-full bg-primary border-2 border-dark items-center justify-center"
                            >
                                <Feather name="sliders" size={20} color="#141414" />
                            </TouchableOpacity>
                        </View>

                        {/* Export Button */}
                        <View className="relative">
                            <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                            <TouchableOpacity onPress={() => setExportSheetOpen(true)} className="w-14 h-14 rounded-full bg-white border-2 border-dark items-center justify-center">
                                <Feather name="share-2" size={20} color="#141414" />
                            </TouchableOpacity>
                        </View>

                        {/* Save Button */}
                        <View className="relative">
                            <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                            <TouchableOpacity onPress={handleSave} className={`w-14 h-14 rounded-full items-center justify-center border-2 border-dark ${isSaved ? "bg-dark" : "bg-white"}`}>
                                <Feather name={isSaved ? "check" : "bookmark"} size={20} color={isSaved ? "#F7CE46" : "#141414"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 4. Narrative Description */}
                <Animated.View entering={FadeInDown.delay(600)} className="px-8 mt-4 pt-8 border-t border-dark/5">
                    <View className="flex-row items-center gap-2 mb-4">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                        <Text className="text-[10px] uppercase font-elms-bold text-dark/40 tracking-[0.4em]">{t.chartPage.synthesis.label}</Text>
                    </View>
                    <Text className="text-xl font-elms-regular italic text-dark/70 leading-relaxed">
                        {description}
                    </Text>
                </Animated.View>
            </ScrollView>

            {/* Fixed Back Button */}
            <View className="absolute bottom-4 left-0 right-0 px-8">
                <SunButton text="GO BACK" onPress={() => router.back()} />
            </View>

            {/* --- EXPORT MODAL --- */}
            {exportSheetOpen && (
                <>
                    <Animated.View entering={scrimEntering} exiting={scrimExiting} style={StyleSheet.absoluteFill} className="bg-dark/40" />
                    <Animated.View entering={popupEntering} exiting={popupExiting} style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                        <ExportSheet onClose={() => setExportSheetOpen(false)} onExport={handleExport} isExporting={isExporting} exportError={exportError} title={String(title)} windowWidth={WINDOW_WIDTH} />
                    </Animated.View>
                </>
            )}

            {/* --- FILTER OVERLAY --- */}
            {overlayOpen && (
                <Animated.View
                    entering={popupEntering}
                    exiting={popupExiting}
                    style={StyleSheet.absoluteFill}
                    className="bg-[#FDFCF6]"
                >
                    <View className="p-8 flex-1">
                        {/* Overlay Header */}
                        <View className="flex-row justify-between items-center mt-8 mb-12">
                            <Text className="text-5xl font-elms-bold italic text-dark tracking-tighter">
                                {t.chartPage.filterOverlay.title}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setOverlayOpen(false)}
                                className="w-12 h-12 bg-dark rounded-2xl items-center justify-center"
                            >
                                <Feather name="x" size={24} color="#F7CE46" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ overflow: 'visible' }}>

                            {/* ── Chart Type Section ───────────────────────────────── */}
                            {compatibleCharts.length > 1 && (
                                <View className="mb-12">
                                    {/* Section header */}
                                    <View className="flex-row items-center gap-3 mb-6">
                                        <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em]">
                                            {t.chartPage.filterOverlay.chartTypeLabel ?? "Chart Type"}
                                        </Text>
                                        {/* Group badge */}
                                        <View className="flex-row items-center gap-1.5 bg-dark/5 px-3 py-1 rounded-full">
                                            <Text className="text-[9px] font-elms-bold text-dark/40 uppercase tracking-widest">
                                                {CHART_REGISTRY[selectedChartType]?.group.replace("_", " ")}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Chart type pills */}
                                    <View className="flex-row flex-wrap gap-3">
                                        {compatibleCharts.map(({ key, label, icon }) => {
                                            const active = selectedChartType === key;
                                            return (
                                                <View key={key} className="relative">
                                                    <View className="absolute inset-0 bg-dark rounded-[20px] translate-x-1 translate-y-1" />
                                                    <TouchableOpacity
                                                        onPress={() => setSelectedChartType(key)}
                                                        className={`flex-row items-center gap-2 px-5 py-3.5 rounded-[20px] border-2 border-dark ${active ? 'bg-primary' : 'bg-white'}`}
                                                    >
                                                        <Feather name={icon as any} size={14} color="#141414" />
                                                        <Text className="font-elms-bold italic text-dark text-base">{label}</Text>
                                                        {active && (
                                                            <View className="w-2 h-2 rounded-full bg-dark ml-1" />
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {/* Compatibility hint */}
                                    <View className="flex-row items-center gap-2 mt-4 opacity-40">
                                        <Feather name="info" size={11} color="#141414" />
                                        <Text className="text-[9px] font-elms-bold text-dark uppercase tracking-widest">
                                            {t.chartPage.filterOverlay.chartTypeHint
                                                ?? "Showing compatible chart types only"}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* ── Colour Palette Selector ──────────────────────────── */}
                            <View className="mb-12">
                                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-6">
                                    {t.chartPage.filterOverlay.paletteLabel ?? "Colour Palette"}
                                </Text>
                                <PaletteSelect value={tempPalette} onChange={setTempPalette} />
                            </View>

                            {/* ── Geography ────────────────────────────────────────── */}
                            <View className="mb-12">
                                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-6">
                                    {t.chartPage.filterOverlay.geoLabel}
                                </Text>
                                <SearchableSelect
                                    options={geoOptions}
                                    selected={selectedGeos}
                                    onToggle={v => setSelectedGeos(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                                    placeholder="Search geographies..."
                                />
                            </View>

                            {/* ── Variables ─────────────────────────────────────────── */}
                            <View className="mb-12">
                                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-6">
                                    {t.chartPage.filterOverlay.varLabel}
                                </Text>
                                <View className="gap-y-2">
                                    {chartVariablesArray.map((v: string) => {
                                        const active = selectedVars.includes(v);
                                        return (
                                            <TouchableOpacity
                                                key={v}
                                                onPress={() =>
                                                    setSelectedVars(prev =>
                                                        active ? prev.filter(x => x !== v) : [...prev, v],
                                                    )
                                                }
                                                className={`p-6 rounded-[32px] border-2 border-dark flex-row items-center justify-between ${active ? 'bg-primary' : 'bg-white'}`}
                                            >
                                                <Text className="text-lg font-elms-bold italic text-dark flex-1 mr-4 tracking-tight">{varLabelMap[v] ?? v}</Text>
                                                {active && <Feather name="check-circle" size={20} color="#141414" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* ── Time Slider ───────────────────────────────────────── */}
                            {periodOptions.length > 1 && (
                                <View className="mb-12">
                                    <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-10">
                                        {t.chartPage.filterOverlay.timeLabel}
                                    </Text>
                                    <View className="items-center px-4">
                                        <MultiSlider
                                            values={[0, periodOptions.length - 1]}
                                            min={0}
                                            max={periodOptions.length - 1}
                                            sliderLength={WINDOW_WIDTH - 120}
                                            onValuesChangeFinish={vals =>
                                                setPeriods([periodOptions[vals[0]].value, periodOptions[vals[1]].value])
                                            }
                                            selectedStyle={{ backgroundColor: "#141414", height: 4 }}
                                            markerStyle={{
                                                backgroundColor: "#F7CE46",
                                                height: 24, width: 24,
                                                borderEndWidth: 2, borderStartWidth: 2,
                                                borderTopWidth: 2, borderBottomWidth: 2,
                                                borderColor: '#141414',
                                                shadowOpacity: 0,
                                            }}
                                        />
                                        <View className="flex-row justify-between w-full mt-6">
                                            <Text className="text-[10px] font-elms-bold italic text-dark">{periodOptions[0].label}</Text>
                                            <Text className="text-[10px] font-elms-bold italic text-dark">{periodOptions[periodOptions.length - 1].label}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Apply Button */}
                        <SunButton
                            text={t.chartPage.filterOverlay.applyButton}
                            onPress={() => {
                                setQuery({
                                    geos: selectedGeos.join("+"),
                                    variables: selectedVars.join("+"),
                                    start: normalizePeriod(periods[0]),
                                    end: normalizePeriod(periods[1]),
                                });
                                // Commit the temporary selected palette palette state on apply synthesis click!
                                setSelectedPalette(tempPalette);
                                setOverlayOpen(false);
                            }}
                        />
                    </View>
                </Animated.View >
            )}
        </View >
    );
};

export default ChartPage;