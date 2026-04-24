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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
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

const chartComponents: { [key: string]: React.ElementType } = {
    line: SunLineChart,
    radar: SunRadarChart,
    hist: SunBarChart,
    pie: SunPieChart,
    areaStacked: SunStackedAreaChart,
    areaProp: SunProportionalAreaChart,
    heatstripe: SunHeatStripe,
    pyramid: SunPopulationPyramidChart,
    circles: SunPackedCircleChart,
    sortedStream: SunSortedStreamChart,
    tree: SunTreemapChart
};

const { width: WINDOW_WIDTH } = Dimensions.get("window");

const ChartPage = () => {
    const queryClient = useQueryClient();
    const authFetch = useAuthFetch();
    const router = useRouter();
    const { user } = useUser();

    const { db, chart_id, title, description, variables, chart_type } = useLocalSearchParams();
    const chartDb = String(db);
    const chartId = String(chart_id);

    const chartRef = useRef<ViewShot>(null);

    // --- 1. Data Fetching & State (Logic Preserved) ---
    const { data: availableData, isLoading: isLoadingAvail } = useQuery({
        queryKey: ['dbs', chartDb],
        queryFn: () => fetchDbAvailabilities({ db: chartDb, authFetch }),
    });

    const geoOptions = useMemo(() => availableData?.availableGeos.split("+").map(g => ({ label: g, value: g })) ?? [], [availableData]);
    const periodOptions = useMemo(() => buildPeriodOptions(availableData?.availablePeriods), [availableData]);
    const chartVariablesArray = useMemo(() => Array.isArray(variables) ? variables : String(variables || "").split("+").filter(Boolean), [variables]);

    const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
    const [selectedVars, setSelectedVars] = useState<string[]>(chartVariablesArray.slice(0, 1));
    const [periods, setPeriods] = useState<[string | null, string | null]>([null, null]);

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

    const { data: savedSet, isLoading: isLoadingSavedSet } = useQuery({
        queryKey: ['charts', 'savedIds'],
        queryFn: () => fetchSavedIdsEvents(authFetch),
        select: useCallback((data: string[]) => new Set(data.map(String)), []),
    });

    const isSaved = savedSet?.has(String(chartId)) ?? false;

    // Mutation Logic (Logic Preserved)
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

    const [exportSheetOpen, setExportSheetOpen] = useState(false);
    const { exportAs, isExporting, exportError } = useExportChart({
        chartRef,
        title: String(title),
        description: String(description),
        chartType: String(chart_type),
        dataSource: availableData?.dbSource ?? "",
        activeGeos: apiData?.activeGeos ?? selectedGeos,
        apiData,
    });

    const handleExport = useCallback(async (format: ExportFormat) => {
        if (!apiData || !apiData.activeGeos?.length) return;
        await exportAs(format, apiData);
        if (!exportError) setExportSheetOpen(false);
    }, [exportAs, exportError, apiData]);

    const [overlayOpen, setOverlayOpen] = useState(false);
    const ChartComponent = chartComponents[String(chart_type)] || SunLineChart;
    const chartElement = useMemo(() => <ChartComponent screenWidth={WINDOW_WIDTH * 0.9} apiData={apiData} />, [ChartComponent, apiData]);

    if (!apiData || isLoadingSavedSet || isFetchingChart)
        return (
            <View className="flex-1 bg-[#FDFCF6] justify-center items-center">
                <Text className="text-dark/40 font-elms-bold italic uppercase tracking-widest">Synthesizing Signal...</Text>
            </View>
        );

    return (
        <View className="flex-1 bg-[#FDFCF6]">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, overflow: 'visible' }}>

                {/* 1. Header Section */}
                <Animated.View entering={FadeInDown.delay(100)} className="px-8 mt-14 mb-8">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[2px] w-10 bg-dark" />
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                            SIGNAL ANALYSIS // {String(chart_type).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-none">
                        {title}
                    </Text>
                </Animated.View>

                {/* 2. Visual Layer (ViewShot for Export) */}
                <ViewShot ref={chartRef} options={{ format: "png", quality: 1 }} style={{ backgroundColor: "#FDFCF6", paddingBottom: 20 }}>
                    {/* Editorial Legend */}
                    <Animated.View entering={FadeInDown.delay(200)} className="px-8 mb-6 flex-row flex-wrap gap-2">
                        {apiData?.activeGeos?.map((geo: string) => (
                            <View key={geo} className="flex-row items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-dark">
                                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <Text className="text-[10px] font-elms-bold italic text-dark uppercase tracking-widest">{geo}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Chart Core */}
                    <Animated.View entering={FadeIn.delay(400)} className="px-4 mb-4 items-center justify-center min-h-[320]">
                        {chartElement}
                    </Animated.View>
                </ViewShot>

                {/* 3. Action Logic Bar */}
                <View className="px-8 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="text-[9px] uppercase font-elms-bold text-dark/40 tracking-[0.2em] mb-1">DATA SOURCE</Text>
                        <Text className="text-xs font-elms-bold italic text-dark uppercase leading-none">{availableData?.dbSource || "VERIFIED REPOSITORY"}</Text>
                    </View>

                    <View className="flex-row gap-4">
                        {/* Filter Button */}
                        <View className="relative">
                            <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                            <TouchableOpacity onPress={() => setOverlayOpen(true)} className="w-14 h-14 rounded-full bg-primary border-2 border-dark items-center justify-center">
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
                        <Text className="text-[10px] uppercase font-elms-bold text-dark/40 tracking-[0.4em]">SYNTHESIS OVERVIEW</Text>
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
                <Animated.View entering={popupEntering} exiting={popupExiting} style={StyleSheet.absoluteFill} className="bg-[#FDFCF6]">
                    <View className="p-8 flex-1">
                        <View className="flex-row justify-between items-center mt-8 mb-12">
                            <Text className="text-5xl font-elms-bold italic text-dark tracking-tighter">Signal CFG</Text>
                            <TouchableOpacity onPress={() => setOverlayOpen(false)} className="w-12 h-12 bg-dark rounded-2xl items-center justify-center">
                                <Feather name="x" size={24} color="#F7CE46" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ overflow: 'visible' }}>
                            {/* Geography */}
                            <View className="mb-12">
                                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-6">TARGET_GEO</Text>
                                <View className="flex-row flex-wrap gap-3">
                                    {geoOptions.map(opt => {
                                        const active = selectedGeos.includes(opt.value);
                                        return (
                                            <View key={opt.value} className="relative">
                                                <View className="absolute inset-0 bg-dark rounded-[24px] translate-x-1 translate-y-1" />
                                                <TouchableOpacity onPress={() => setSelectedGeos(prev => active ? prev.filter(v => v !== opt.value) : [...prev, opt.value])} className={`px-6 py-4 rounded-[24px] border-2 border-dark ${active ? 'bg-primary' : 'bg-white'}`}>
                                                    <Text className="font-elms-bold italic text-dark text-lg">{opt.label}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Variables */}
                            <View className="mb-12">
                                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-6">DATA VAR</Text>
                                <View className="gap-y-2">
                                    {chartVariablesArray.map(v => {
                                        const active = selectedVars.includes(v);
                                        return (
                                            <TouchableOpacity key={v} onPress={() => setSelectedVars(prev => active ? prev.filter(x => x !== v) : [...prev, v])} className={`p-6 rounded-[32px] border-2 border-dark flex-row items-center justify-between ${active ? 'bg-primary' : 'bg-white'}`}>
                                                <Text className="text-lg font-elms-bold italic text-dark flex-1 mr-4 tracking-tight">{v}</Text>
                                                {active && <Feather name="check-circle" size={20} color="#141414" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Temporal Slider */}
                            {periodOptions.length > 1 && (
                                <View className="mb-12">
                                    <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.4em] mb-10">TIME_WINDOW</Text>
                                    <View className="items-center px-4">
                                        <MultiSlider
                                            values={[0, periodOptions.length - 1]}
                                            min={0} max={periodOptions.length - 1}
                                            sliderLength={WINDOW_WIDTH - 120}
                                            onValuesChangeFinish={(vals) => setPeriods([periodOptions[vals[0]].value, periodOptions[vals[1]].value])}
                                            selectedStyle={{ backgroundColor: "#141414", height: 4 }}
                                            markerStyle={{ backgroundColor: "#F7CE46", height: 24, width: 24, borderEndWidth: 2, borderStartWidth: 2, borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#141414', shadowOpacity: 0 }}
                                        />
                                        <View className="flex-row justify-between w-full mt-6">
                                            <Text className="text-[10px] font-elms-bold italic text-dark">{periodOptions[0].label}</Text>
                                            <Text className="text-[10px] font-elms-bold italic text-dark">{periodOptions[periodOptions.length - 1].label}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <SunButton text="APPLY SYNTHESIS" onPress={() => {
                            setQuery({ geos: selectedGeos.join("+"), variables: selectedVars.join("+"), start: normalizePeriod(periods[0]), end: normalizePeriod(periods[1]) });
                            setOverlayOpen(false);
                        }} />
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export default ChartPage;