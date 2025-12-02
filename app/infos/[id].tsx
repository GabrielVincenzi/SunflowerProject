import SunAreaChart from "@/components/charts/SunAreaChart";
import SunBarChart from "@/components/charts/SunBarChart";
import SunLineChart from "@/components/charts/SunLineChart";
import SunRadarChart from "@/components/charts/SunRadarChart";
import SunPieChart from "@/components/old/SunPieChart";
import { defaultGeo } from "@/constants/utilities";
import { buildPeriodOptions, normalizePeriod } from '@/functions/dateHandlers';
import { deleteSavedEvent, fetchChartData, fetchDbAvailabilities, fetchSavedIdsEvents, postNewEvent } from '@/services/api';
import useSeen from "@/services/useSeen";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const chartComponents: { [key: string]: React.ElementType } = {
    line: SunLineChart,
    radar: SunRadarChart,
    bar: SunBarChart,
    area: SunAreaChart,
    pie: SunPieChart,
    // add more chart mappings here
};

const ChartPage = () => {
    const screenWidth = Dimensions.get("window").width * 0.9;
    const { user } = useUser();
    const { id, title, description, db, variables, chart_type } = useLocalSearchParams();
    const queryClient = useQueryClient();

    /////////////////////////////// Fetching availabilities  ////////////////////////////////
    // Fetch db availability
    const { data: availableData, isPending: isPendingDbAvailable, error: errorDb } = useQuery({
        queryKey: ['dbs', db],
        queryFn: () => fetchDbAvailabilities({ db: chartDb }),
    });

    // Transform available data to dropdown options
    const geoOptions = availableData?.availableGeos.split("+")
        .map((g) => ({ label: g, value: g })) ?? [];
    const periodOptions = buildPeriodOptions(availableData?.availablePeriods);
    const dbSource = availableData?.dbSource ?? [];

    const lastPeriods = periodOptions.slice(-6);

    /////////////////////////////// Parameters ////////////////////////////////
    const userId = user?.id ?? "";
    const chartId = id as string;
    const chartType = chart_type as string;
    const chartTitle = title as string;
    const chartDescr = description as string;
    const chartDb = db as string;
    const chartVariables = variables ? JSON.parse(variables as string) : [];
    const chartGeosArray = defaultGeo ? (defaultGeo as string).replace(/^"|"$/g, "").split("+").filter(Boolean) : [];
    const chartStartPeriod: string | null = lastPeriods.length > 0 ? lastPeriods[0].value : null;
    const chartEndPeriod: string | null =
        lastPeriods.length > 0
            ? lastPeriods[lastPeriods.length - 1].value
            : null;

    /////////////////////////////// Handle selections ////////////////////////////////
    // Allow multiple geos only if one variable
    let variableCount = 0;

    // Handle variable type
    if (typeof variables === "string") {
        variableCount = variables.split("+").filter(v => v.trim() !== "").length;
    } else if (Array.isArray(variables)) {
        variableCount = variables.length;
    }

    const isMultiGeo = variableCount <= 1;

    // State for editable inputs
    const [selectedGeosArray, setSelectedGeosArray] = useState<string[]>(chartGeosArray);
    const [selectedStartPeriod, setSelectedStartPeriod] = useState<string | null>(chartStartPeriod ? chartStartPeriod : null);
    const [selectedEndPeriod, setSelectedEndPeriod] = useState<string | null>(chartEndPeriod ? chartEndPeriod : null);

    // Handle selected geos safely
    const setSelectedGeosSafe = useCallback((val:
        string | string[] | null | ((prev: string[]) => string[] | string | null)
    ) => {
        // functional updater
        if (typeof val === "function") {
            setSelectedGeosArray(prev => {
                const result = (val as (prev: string[]) => any)(prev);
                if (Array.isArray(result)) return result.map(String).filter(Boolean);
                if (result == null) return [];
                return String(result).split("+").map(s => s.trim()).filter(Boolean);
            });
            return;
        }

        // direct value
        if (Array.isArray(val)) {
            setSelectedGeosArray(val.map(String).filter(Boolean));
        } else if (val == null) {
            setSelectedGeosArray([]);
        } else {
            // string case: may be "US" or "US+FR"
            const cleaned = String(val).replace(/^"|"$/g, "").trim();
            const arr = cleaned === "" ? [] : cleaned.split("+").map(s => s.trim()).filter(Boolean);
            setSelectedGeosArray(arr);
        }
    }, []);

    /////////////////////////////// React Query Hooks ////////////////////////////////
    // User seen analytics
    useSeen({ userId, objectId: chartId, delayMs: 20000 });

    // Query state
    const [query, setQuery] = useState({
        geos: isMultiGeo
            ? selectedGeosArray.join("+")
            : selectedGeosArray[0] ?? "",
        startPeriod: normalizePeriod(selectedStartPeriod),
        endPeriod: normalizePeriod(selectedEndPeriod),
    });

    const { data: apiData, isLoading: isLoadingChartData, isPending: isPendingChartData, isError, error } = useQuery({
        queryKey: ['charts', chartDb, chartVariables, query.geos, query.startPeriod, query.endPeriod],
        queryFn: () => fetchChartData({
            db: chartDb,
            variables: chartVariables,
            geos: query.geos,
            startPeriod: query.startPeriod,
            endPeriod: query.endPeriod,
        }),
        placeholderData: keepPreviousData,
    });

    // Handle OK button
    const handleOk = () => {
        setQuery({
            geos: selectedGeosArray.join("+"),
            startPeriod: normalizePeriod(selectedStartPeriod),
            endPeriod: normalizePeriod(selectedEndPeriod),
        });
    };

    const onOkPress = () => {
        // write back local selections to main state (so existing handleOk sees them)
        setSelectedGeosSafe(localSelectedGeos);
        setSelectedStartPeriod(localStartPeriod);
        setSelectedEndPeriod(localEndPeriod);

        // call existing fetch/handler
        handleOk();

        // close overlay
        closeOverlay();
    };

    /////////////////////////////// Save graph ////////////////////////////////
    // Query if saved graph
    const { data: savedSet = new Set<string>(), isLoading: isLoadingSavedSet, isSuccess: isSuccessSavedSet } = useQuery({
        queryKey: ['charts', 'savedIds', userId],
        queryFn: () => fetchSavedIdsEvents(userId),
    });

    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState<boolean>(() =>
        Boolean(savedSet?.has?.(String(chartId)))
    );

    useEffect(() => {
        setIsSaved(Boolean(savedSet?.has?.(String(chartId))));
    }, [savedSet, chartId]);

    const savedMutation = useMutation({
        mutationFn: ({ userId, objectId }: any) => postNewEvent({ userId, action: 'saved', objectId, time: new Date().toISOString() }),
        onMutate: async ({ userId, objectId }) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ['charts', 'savedIds', userId] }),
                queryClient.cancelQueries({ queryKey: ['charts', 'saved', userId] }),
            ])

            const prev = queryClient.getQueryData<Set<string>>(['charts', 'savedIds', userId]);
            queryClient.setQueryData(['charts', 'savedIds', userId], (old) => {
                const s = new Set(old instanceof Set ? Array.from(old) : []);
                s.add(String(objectId));
                return s;
            });
            setIsSaved(true);
            return { prev };
        },
        onError: (_err, vars, context) => {
            // rollback...
            if (context?.prev) queryClient.setQueryData(['charts', 'savedIds', vars.userId], context.prev);
            setIsSaved(Boolean(context?.prev?.has?.(String(vars.objectId))));
        },
        onSettled: async (_data, _err, vars) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['charts', 'saved', vars.userId], exact: true, refetchType: 'all' }),
                //queryClient.refetchQueries({ queryKey: ['charts', 'saved', vars.userId], exact: true, type: 'all' })
            ])
        }
    });

    const deleteSavedMutation = useMutation({
        mutationFn: ({ userId, objectId }: any) => deleteSavedEvent({ userId, objectId }),
        onMutate: async ({ userId, objectId }: any) => {
            // cancel queries that might be reading/writing these caches
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ['charts', 'savedIds', userId] }),
                queryClient.cancelQueries({ queryKey: ['charts', 'saved', userId] }),
            ]);

            // snapshot previous
            const prev = queryClient.getQueryData<Set<string>>(['charts', 'savedIds', userId]);

            // optimistic: remove the id from the Set
            queryClient.setQueryData(['charts', 'savedIds', userId], (old) => {
                const s = new Set(old instanceof Set ? Array.from(old) : []);
                s.delete(String(objectId));
                return s;
            });

            // update local UI
            setIsSaved(false);

            return { prev };
        },
        onError: (_err, vars: any, context: any) => {
            // rollback if server fails
            if (context?.prev) queryClient.setQueryData(['charts', 'savedIds', vars.userId], context.prev);
            setIsSaved(Boolean(context?.prev?.has?.(String(vars.objectId))));
        },
        onSettled: async (_data, _err, vars: any) => {
            // refetch/invalidates so server and client stay in sync
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['charts', 'saved', vars.userId], exact: true, refetchType: 'all' }),
                //queryClient.refetchQueries({ queryKey: ['charts', 'saved', vars.userId], exact: true, type: 'all' })
            ]);
        },
    });

    const handleSave = useCallback(() => {
        if (!user) return;

        if (isSaved) {
            // currently saved -> delete it
            deleteSavedMutation.mutate({ userId: userId, objectId: chartId });
        } else {
            // currently not saved -> save it
            savedMutation.mutate({ userId: userId, objectId: chartId });
        }
    }, [user, isSaved, chartId, savedMutation, deleteSavedMutation]);

    /////////////////////////////// Chart Component ////////////////////////////////
    const ChartComponent = chartComponents[chartType] || SunLineChart;

    const chartElement = useMemo(
        () => <ChartComponent screenWidth={screenWidth} apiData={apiData} />,
        [ChartComponent, screenWidth, apiData]
    );

    /////////////////////////////// UI - Reanimated animations ////////////////////////////////
    // Filter overlay handlers
    const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");
    const BUTTON_SIZE = 48;

    // UI state
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [showCountryList, setShowCountryList] = useState(false);
    const [showStartPeriodList, setShowStartPeriodList] = useState(false);
    const [showEndPeriodList, setShowEndPeriodList] = useState(false);

    // local selection copies
    const [localSelectedGeos, setLocalSelectedGeos] = useState<string[]>(selectedGeosArray ?? []);
    const [localStartPeriod, setLocalStartPeriod] = useState<string | null>(selectedStartPeriod ?? null);
    const [localEndPeriod, setLocalEndPeriod] = useState<string | null>(selectedEndPeriod ?? null);

    // reanimated shared values
    const scale = useSharedValue(0.001); // tiny initial value
    const contentOpacity = useSharedValue(0);

    // Animated styles
    const circleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    // circle position & size (JS state because layout/position used for absolute placement)
    const [circleX, setCircleX] = useState(0);
    const [circleY, setCircleY] = useState(0);
    const [circleSize, setCircleSize] = useState(BUTTON_SIZE);

    // ref to the button instance (correct element ref type)
    const buttonRef = useRef<ComponentRef<typeof TouchableOpacity> | null>(null);

    // compute final scale from a start center to cover whole screen
    const computeScaleForFullScreen = (cx: number, cy: number, startDiameter: number) => {
        const d1 = Math.hypot(cx - 0, cy - 0);
        const d2 = Math.hypot(cx - WINDOW_WIDTH, cy - 0);
        const d3 = Math.hypot(cx - 0, cy - WINDOW_HEIGHT);
        const d4 = Math.hypot(cx - WINDOW_WIDTH, cy - WINDOW_HEIGHT);
        const maxDist = Math.max(d1, d2, d3, d4);
        const targetDiameter = maxDist * 2;
        return targetDiameter / startDiameter;
    };

    // measure button (with a tiny rAF guard to avoid early-zero measurements)
    const measureButton = async (): Promise<{ x: number; y: number; w: number; h: number } | null> => {
        // wait a frame to ensure layout settled (helps on very fast taps)
        await new Promise((r) => requestAnimationFrame(() => r(null)));

        const node = buttonRef.current;
        if (!node || typeof (node as any).measureInWindow !== "function") return null;

        return new Promise((resolve) => {
            (node as any).measureInWindow((x: number, y: number, w: number, h: number) => {
                resolve({ x, y, w, h });
            });
        });
    };

    // open overlay: measure, position circle, animate scale and content opacity
    const openOverlay = async () => {
        // re-init local selections from parent
        setLocalSelectedGeos(selectedGeosArray ?? []);
        setLocalStartPeriod(selectedStartPeriod ?? null);
        setLocalEndPeriod(selectedEndPeriod ?? null);

        const measured = await measureButton();
        // fallback center top-right if measuring fails
        const fallbackCx = WINDOW_WIDTH - 48;
        const fallbackCy = 48;
        const cx = measured ? measured.x + measured.w / 2 : fallbackCx;
        const cy = measured ? measured.y + measured.h / 2 : fallbackCy;
        const measuredW = measured?.w ?? BUTTON_SIZE;
        const measuredH = measured?.h ?? BUTTON_SIZE;
        const startDiameter = Math.max(measuredW, measuredH, BUTTON_SIZE);

        // set absolute placement so circle center aligns with button center
        setCircleX(cx - startDiameter / 2);
        setCircleY(cy - startDiameter / 2);
        setCircleSize(startDiameter);

        // compute final scale for this center / diameter
        const finalScale = computeScaleForFullScreen(cx, cy, startDiameter);

        // reveal overlay container
        setOverlayOpen(true);

        // reset shared values then animate
        scale.value = 0.001;
        contentOpacity.value = 0;

        scale.value = withTiming(finalScale, {
            duration: 700,
            easing: Easing.out(Easing.cubic),
        });

        contentOpacity.value = withDelay(
            200,
            withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
        );
    };

    // close overlay: fade content then shrink circle, then hide overlay
    const closeOverlay = () => {
        const contentFadeDuration = 160;
        const scaleDelay = 80;
        const scaleDuration = 320;

        contentOpacity.value = withTiming(0, { duration: contentFadeDuration, easing: Easing.in(Easing.cubic) });
        scale.value = withDelay(scaleDelay, withTiming(0.001, { duration: scaleDuration, easing: Easing.in(Easing.cubic) }));

        const total = Math.max(contentFadeDuration, scaleDelay + scaleDuration) + 40;
        setTimeout(() => {
            setOverlayOpen(false);
            setShowCountryList(false);
            setShowStartPeriodList(false);
            setShowEndPeriodList(false);
        }, total);
    };

    // circle base style (absolute placement)
    const circleBaseStyle = {
        position: "absolute" as const,
        left: circleX,
        top: circleY,
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
        backgroundColor: "#F7DA8A",
        overflow: "hidden" as const,
    };


    /////////////////////////////// Components ////////////////////////////////
    const renderGeoRow = (item: GeoOption) => {
        const selected = localSelectedGeos.includes(item.value);
        return (
            <TouchableOpacity
                key={item.value}
                activeOpacity={0.8}
                onPress={() => {
                    if (isMultiGeo) {
                        setLocalSelectedGeos((prev) => {
                            const next = prev.includes(item.value) ? prev.filter((v) => v !== item.value) : [...prev, item.value];
                            // persist immediately so collapsing the list doesn't lose selection
                            setSelectedGeosSafe(next);
                            return next;
                        });
                    } else {
                        const next = [item.value];
                        setLocalSelectedGeos(next);
                        // persist immediately for single-select as well
                        setSelectedGeosSafe(next);
                    }
                }}
                className="px-4 py-3 border-b border-neutral-200 flex-row justify-between items-center"
            >
                <Text className="text-base">{item.label}</Text>
                <View className={`${selected ? "w-5 h-5 rounded-full bg-secondary" : "w-5 h-5 rounded-full border border-neutral-300"}`} />
            </TouchableOpacity>
        );
    };

    const renderStartPeriodRow = (p: PeriodOption) => {
        const selected = localStartPeriod === p.value;
        return (
            <TouchableOpacity
                key={p.value}
                onPress={() => {
                    setLocalStartPeriod(p.value);
                    setSelectedStartPeriod(p.value);
                }}
                className="py-3 px-2 border-b border-neutral-100"
            >
                <View className="flex-row justify-between items-center">
                    <Text className={`text-base ${selected ? "font-semibold" : ""}`}>{p.label}</Text>
                    <View className={`${selected ? "w-4 h-4 rounded-full bg-secondary" : "w-4 h-4 rounded-full border border-neutral-300"}`} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEndPeriodRow = (p: PeriodOption | { label: string; value: string }) => {
        const selected = localEndPeriod === p.value;
        return (
            <TouchableOpacity
                key={p.value}
                onPress={() => {
                    setLocalEndPeriod(p.value);
                    setSelectedEndPeriod(p.value);
                }}
                className="py-3 px-2 border-b border-neutral-100"
            >
                <View className="flex-row justify-between items-center">
                    <Text className={`text-base ${selected ? "font-semibold" : ""}`}>{p.label}</Text>
                    <View className={`${selected ? "w-4 h-4 rounded-full bg-secondary" : "w-4 h-4 rounded-full border border-neutral-300"}`} />
                </View>
            </TouchableOpacity>
        );
    };

    /////////////////////////////// Loading ////////////////////////////////
    if (!apiData || isLoadingChartData || isLoadingSavedSet || isError || isPendingChartData || isPendingDbAvailable)
        return (
            <View className="bg-background">
                <Text className="text-neutral-600 text-center mt-10">No data available</Text>
            </View>
        );

    return (
        <View className="bg-background flex-1">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
            >
                {/* Title */}
                <View className="px-6 mt-8 mb-2">
                    <Text className="text-neutral-900 font-elms-bold mb-4 font-bold text-3xl tracking-tight">{chartTitle}</Text>
                </View>
                {/* Chart container */}
                <View className="px-4 pb-1 relative">
                    {chartElement}
                </View>
                <View className="flex-row items-start justify-between px-10">
                    {/* Source info */}
                    <View className="">
                        <Text className="text-neutral-500 text-sm">Data from {dbSource ? dbSource[0].toUpperCase() + dbSource.slice(1) : ""}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-4">
                        {/* FILTER button is relative inside header */}
                        <TouchableOpacity
                            ref={buttonRef}
                            onPress={openOverlay}
                            activeOpacity={0.9}
                            className="rounded-full"
                            style={{
                                width: BUTTON_SIZE,
                                height: BUTTON_SIZE,
                                borderRadius: BUTTON_SIZE / 2,
                                backgroundColor: "#F7DA8A",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="funnel-outline" size={24} color="#000" />
                        </TouchableOpacity>

                        {/*Saved Button */}
                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.8}
                            style={{
                                width: BUTTON_SIZE,
                                height: BUTTON_SIZE,
                                borderRadius: BUTTON_SIZE / 2,
                                backgroundColor: user ? "#F7DA8A" : "#D3D3D3",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Ionicons
                                    name={isSaved ? "checkmark" : "bookmark-outline"}
                                    size={26}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Overview */}
                <View className="flex-col items-start justify-center mt-6 px-6">
                    <Text className="text-neutral-800 font-elms-bold text-lg mb-2">Overview</Text>
                    <Text className="text-neutral-500 leading-relaxed text-base">{chartDescr}</Text>
                </View>
            </ScrollView >
            {/* Bottom button */}
            < TouchableOpacity
                className="absolute bottom-6 left-6 right-6 bg-secondary rounded-2xl py-4 flex-row items-center justify-center"
                onPress={() => router.back()}
                activeOpacity={0.85}
            >
                <Text className="text-white font-semibold text-base">Go back</Text>
            </TouchableOpacity >

            {/* Overlay Filters*/}
            {overlayOpen && (
                <TouchableWithoutFeedback onPress={() => { }}>
                    <View
                        pointerEvents="box-none"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: WINDOW_WIDTH,
                            height: WINDOW_HEIGHT,
                            zIndex: 999,
                        }}
                    >
                        {/* animated expanding circle (REANIMATED Animated.View) */}
                        <Animated.View style={[circleBaseStyle, circleAnimatedStyle]} />

                        {/* overlay content (animates opacity) */}
                        <Animated.View
                            style={[
                                {
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    paddingTop: 80,
                                    paddingHorizontal: 22,
                                },
                                overlayAnimatedStyle,
                            ]}
                        >
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="bg-transparent">
                                    <Text className="text-white text-2xl font-semibold mb-4">Filters</Text>

                                    {/* Country card */}
                                    <View className="bg-white rounded-xl p-4 mb-4">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-neutral-900 font-medium text-lg">Country</Text>
                                            <Pressable
                                                onPress={() => setShowCountryList((s) => !s)}
                                                style={({ pressed }) => [{ transform: [{ rotate: showCountryList ? "180deg" : "0deg" }], opacity: pressed ? 0.7 : 1 }]}
                                                accessibilityRole="button"
                                                hitSlop={8}
                                            >
                                                <Text className="text-neutral-500 text-lg">{showCountryList ? "▴" : "▾"}</Text>
                                            </Pressable>
                                        </View>
                                        {showCountryList && (
                                            <View style={{ maxHeight: 240 }} className="border-t border-neutral-200 mt-2">
                                                <ScrollView nestedScrollEnabled contentContainerStyle={{ paddingBottom: 8 }}>
                                                    {geoOptions.map((g) => renderGeoRow(g))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>

                                    {/* Start Period */}
                                    <View className="bg-white rounded-xl p-4 mb-4">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <View className="flex-1">
                                                <Text className="text-neutral-900 font-medium text-lg">Start period</Text>
                                                <Text className="text-neutral-500 text-sm">{localStartPeriod ?? "Not set"}</Text>
                                            </View>
                                            <Pressable
                                                onPress={() => setShowStartPeriodList((s) => !s)}
                                                style={({ pressed }) => [{ transform: [{ rotate: showStartPeriodList ? "180deg" : "0deg" }], opacity: pressed ? 0.7 : 1 }]}
                                                accessibilityRole="button"
                                                hitSlop={8}
                                            >
                                                <Text className="text-neutral-500 text-lg">{showStartPeriodList ? "▴" : "▾"}</Text>
                                            </Pressable>
                                        </View>
                                        {showStartPeriodList && <View className="mt-3">{periodOptions.map((p) => renderStartPeriodRow(p))}</View>}
                                    </View>

                                    {/* End Period */}
                                    <View className="bg-white rounded-xl p-4 mb-6">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <View className="flex-1">
                                                <Text className="text-neutral-900 font-medium text-lg">End period</Text>
                                                <Text className="text-neutral-500 text-sm">{localEndPeriod ?? "Not set"}</Text>
                                            </View>
                                            <Pressable
                                                onPress={() => setShowEndPeriodList((s) => !s)}
                                                style={({ pressed }) => [{ transform: [{ rotate: showEndPeriodList ? "180deg" : "0deg" }], opacity: pressed ? 0.7 : 1 }]}
                                                accessibilityRole="button"
                                                hitSlop={8}
                                            >
                                                <Text className="text-neutral-500 text-lg">{showEndPeriodList ? "▴" : "▾"}</Text>
                                            </Pressable>
                                        </View>
                                        {showEndPeriodList && <View className="mt-3">{periodOptions.map((p) => renderEndPeriodRow(p))}</View>}
                                    </View>

                                    {/* Action buttons */}
                                    <View className="flex-row justify-between mb-12">
                                        <TouchableOpacity onPress={closeOverlay} className="bg-neutral-200 rounded-xl px-5 py-3">
                                            <Text>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                onOkPress?.();
                                                closeOverlay();
                                            }}
                                            className="bg-secondary rounded-xl px-6 py-3"
                                        >
                                            <Text className="text-white font-semibold">OK</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            )}
        </View>
    );
};

export default ChartPage;

