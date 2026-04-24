import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const queryClient = new QueryClient();

// Reusing existing charts
import SunBarChart from '@/components/charts/SunBarChart';
import SunPieChart from '@/components/charts/SunPieChart';
import SunRadarChart from '@/components/charts/SunRadarChart';
import SunTreemapChart from '@/components/charts/SunTreemapChart';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * FloatingDot Component
 * Replicates the Sunflower "Information Wilderness" aesthetic in the mobile app.
 */
const FloatingDot = ({ index }: { index: number }) => {
    const tx = useSharedValue(Math.random() * SCREEN_WIDTH);
    const ty = useSharedValue(Math.random() * 400);
    const opacity = useSharedValue(0.1 + Math.random() * 0.3);

    useEffect(() => {
        tx.value = withRepeat(
            withTiming(tx.value + (Math.random() - 0.5) * 100, { duration: 5000 + Math.random() * 5000 }),
            -1,
            true
        );
        ty.value = withRepeat(
            withTiming(ty.value + (Math.random() - 0.5) * 100, { duration: 5000 + Math.random() * 5000 }),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }, { translateY: ty.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[style, { width: 4 + Math.random() * 6, height: 4 + Math.random() * 6 }]}
            className="absolute bg-primary rounded-full"
        />
    );
};

/**
 * Mock data fetcher for demonstration.
 * In a real app, this would call an API.
 */
// Add this normalizer near the top of the component
const normalizeGeo = (geo: string) => geo.replace(/_/g, '-');

// Update fetchMunicipalityData to build keys with normalized geos
const fetchMunicipalityData = async (municipality: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const provincePrefix = municipality.split('_')[0] || 'VR';
    const regionName = 'Veneto';

    // Normalize all geo identifiers — no underscores
    const mGeo = normalizeGeo(municipality);           // VR-MALCESINE
    const provGeo = normalizeGeo(`${provincePrefix}_avg`); // VR-avg
    const regGeo = `${regionName}-avg`;                   // Veneto-avg
    const natGeo = 'National-avg';

    return {
        activeGeos: [mGeo, provGeo, regGeo, natGeo],
        activePeriods: ["2020-12-01T00:00:00"],
        variableLabels: {
            "area_ambiente-e-gestione-rifiuti": "Environment & Waste",
            "area_economia": "Economy",
            "area_istruzione": "Education",
            "area_sicurezza": "Security",
            "area_sociale": "Social Services",
            "area_cultura": "Culture & Tourism"
        },
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
        }
    };
};

/**
 * MunicipalityBalanceSheetScreen
 * A deep-dive journey into municipal financial health and spending priorities.
 */
const MunicipalityBalanceSheetScreenContent = () => {
    const [viewMode, setViewMode] = useState<'absolute' | 'perCapita'>('absolute');
    const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: apiData, isLoading, error } = useQuery({
        queryKey: ['reports', 'municipality', selectedMunicipality],
        queryFn: () => fetchMunicipalityData(selectedMunicipality!),
        enabled: !!selectedMunicipality,
    });

    const popularMunicipalities = ['VR_MALCESINE', 'RM_ROMA', 'MI_MILANO', 'NA_NAPOLI', 'TO_TORINO'];

    const filteredMunicipalities = popularMunicipalities.filter(m =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const primaryGeo = useMemo(
        () => selectedMunicipality ? normalizeGeo(selectedMunicipality) : 'VR-MALCESINE',
        [selectedMunicipality]
    );
    const secondaryGeo = null;

    const provinceCode = useMemo(() => primaryGeo.split('_')[0], [primaryGeo]);
    const cityName = useMemo(() => primaryGeo.split('_')[1] || primaryGeo, [primaryGeo]);

    // Extract population from series
    const population = useMemo(() => {
        if (!apiData || !selectedMunicipality) return 1;
        return apiData.series?.[`popolazione_i_${normalizeGeo(selectedMunicipality)}`]?.[0]?.value || 1;
    }, [apiData, selectedMunicipality]);

    const year = useMemo(() => {
        if (!apiData?.activePeriods?.[0]) return '';
        return new Date(apiData.activePeriods[0]).getFullYear().toString();
    }, [apiData]);

    // Replace getVal with this hardened version
    const getVal = useCallback(
        (variable: string, geo: string): number => {
            if (!apiData) return 0;

            const raw = apiData.series?.[`${variable}_${geo}`]?.[0]?.value;
            const val = typeof raw === 'number' && isFinite(raw) ? raw : 0;

            if (viewMode === 'perCapita') {
                const popRaw = apiData.series?.[`popolazione_i_${geo}`]?.[0]?.value;
                const pop = typeof popRaw === 'number' && isFinite(popRaw) && popRaw > 0
                    ? popRaw
                    : 1;
                const result = val / pop;
                // Final guard — D3 will throw on NaN/Infinity
                return isFinite(result) ? result : 0;
            }

            return val;
        },
        [apiData, viewMode],
    );

    const thematicAreas = Object.keys(apiData?.variableLabels || {});

    const pulseData = useMemo(() => {
        if (!apiData) return null;

        const series: Record<string, { value: number }[]> = {};
        thematicAreas.forEach(area => {
            const v = getVal(area, primaryGeo);
            series[`${area}_${primaryGeo}`] = [{ value: isFinite(v) ? v : 0 }];
        });

        // Guard: if every value is 0, don't render (pie of zeros crashes D3)
        const hasData = Object.values(series).some(s => (s[0]?.value ?? 0) > 0);
        if (!hasData) return null;

        return {
            activeGeos: [primaryGeo],
            series,
            variableLabels: apiData.variableLabels || {},
            activePeriods: apiData.activePeriods,
        };
    }, [apiData, primaryGeo, viewMode, getVal]);

    const architectureData = useMemo(() => {
        if (!apiData) return null;

        const series: Record<string, { value: number }[]> = {};
        thematicAreas.forEach(area => {
            const v = getVal(area, primaryGeo);
            series[`${area}_${primaryGeo}`] = [{ value: isFinite(v) ? v : 0 }];
        });

        const hasData = Object.values(series).some(s => (s[0]?.value ?? 0) > 0);
        if (!hasData) return null;

        return {
            activeGeos: [primaryGeo],
            series,
            variableLabels: apiData.variableLabels || {},
            activePeriods: apiData.activePeriods,
        };
    }, [apiData, primaryGeo, viewMode, getVal]);

    const benchmarkData = useMemo(() => {
        if (!apiData) return null;

        const benchmarks = apiData.activeGeos ?? [primaryGeo, 'National-avg'];
        const series: Record<string, { value: number }[]> = {};

        benchmarks.forEach(geo => {
            thematicAreas.forEach(area => {
                const v = getVal(area, geo);
                series[`${area}_${geo}`] = [{ value: isFinite(v) ? v : 0 }];
            });
        });

        const hasData = Object.values(series).some(s => (s[0]?.value ?? 0) > 0);
        if (!hasData) return null;

        return {
            activeGeos: benchmarks,
            series,
            variableLabels: apiData.variableLabels || {},
            activePeriods: apiData.activePeriods,
        };
    }, [apiData, primaryGeo, viewMode, getVal]);


    // Selection Screen
    if (!selectedMunicipality) {
        return (
            <View className="flex-1 bg-background">
                <View className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <FloatingDot key={i} index={i} />
                    ))}
                </View>

                <View className="flex-1 pt-32 px-8">
                    <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                        <Text className="text-[10px] font-elms-bold text-primary uppercase tracking-[0.5em] mb-4">
                            Municipal Intelligence
                        </Text>
                        <Text className="text-5xl font-elms-bold text-dark tracking-tighter mb-8">
                            Select your{"\n"}Municipality
                        </Text>

                        <View className="bg-dark/5 rounded-2xl p-4 mb-8 flex-row items-center">
                            <Ionicons name="search" size={20} color="#343a40" style={{ opacity: 0.5 }} />
                            <TextInput
                                className="flex-1 ml-3 font-elms-regular text-dark"
                                placeholder="Search municipality..."
                                placeholderTextColor="rgba(52, 58, 64, 0.3)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <Text className="text-[10px] font-elms-bold text-grey uppercase tracking-widest mb-4">Popular Cities</Text>
                        <View className="flex-row flex-wrap">
                            {filteredMunicipalities.map((city, i) => (
                                <TouchableOpacity
                                    key={city}
                                    onPress={() => setSelectedMunicipality(city)}
                                    className="bg-dark px-4 py-2 rounded-full mr-2 mb-2"
                                >
                                    <Text className="text-[10px] font-elms-bold text-primary uppercase">{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </View>
        );
    }

    // Loading State
    if (isLoading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#FCD34D" />
                <Text className="mt-4 font-elms-bold text-dark uppercase tracking-widest text-[10px]">Fetching Intelligence...</Text>
            </View>
        );
    }

    // Error State
    if (error || !apiData) {
        return (
            <View className="flex-1 bg-background justify-center items-center px-8">
                <Text className="text-dark font-elms-bold text-xl mb-4">Something went wrong</Text>
                <TouchableOpacity
                    onPress={() => setSelectedMunicipality(null)}
                    className="bg-primary px-8 py-3 rounded-full"
                >
                    <Text className="text-dark font-elms-bold uppercase text-[10px]">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Background Constellation */}
            <View className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                    <FloatingDot key={i} index={i} />
                ))}
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER ACTIONS */}
                <View className="absolute top-12 right-8 z-10">
                    <TouchableOpacity
                        onPress={() => setSelectedMunicipality(null)}
                        className="bg-dark/5 p-3 rounded-full"
                    >
                        <Ionicons name="close" size={24} color="#343a40" />
                    </TouchableOpacity>
                </View>

                {/* CHAPTER 0: THE IDENTITY */}
                <View className="pt-24 px-8 pb-12">
                    <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                        <Text className="text-[10px] font-elms-bold text-primary uppercase tracking-[0.5em] mb-4">
                            Municipal Intelligence
                        </Text>
                        <Text className="text-5xl font-elms-bold text-dark tracking-tighter">
                            {cityName}
                        </Text>
                        <View className="flex-row items-center mt-6">
                            <View className="bg-dark px-3 py-1 rounded-full mr-3">
                                <Text className="text-[9px] font-elms-bold text-primary uppercase tracking-tighter">
                                    {provinceCode}
                                </Text>
                            </View>
                            <Text className="text-sm font-elms-regular text-grey italic">
                                {population.toLocaleString()} Citizens • FY {year}
                            </Text>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(300).duration(800)}
                        className="flex-row mt-12 bg-dark/5 p-1 rounded-2xl self-start"
                    >
                        <TouchableOpacity
                            onPress={() => setViewMode('absolute')}
                            className={`px-6 py-2 rounded-xl ${viewMode === 'absolute' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-tighter">Absolute</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('perCapita')}
                            className={`px-6 py-2 rounded-xl ${viewMode === 'perCapita' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-tighter">Per Capita</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* CHAPTER 1: THE PULSE */}
                <View className="mt-10">
                    <View className="px-8 flex-row items-center mb-8">
                        <View className="w-8 h-8 rounded-full bg-dark items-center justify-center mr-4">
                            <Text className="text-[10px] font-elms-bold text-primary">01</Text>
                        </View>
                        <Text className="text-2xl font-elms-bold tracking-tighter text-dark">The Financial Pulse</Text>
                    </View>

                    <View className="bg-white p-2 border border-dark/5 shadow-sm">
                        {pulseData && <SunPieChart screenWidth={SCREEN_WIDTH} apiData={pulseData} />}
                        <View className="mt-8 pt-8 border-t border-dark/5">
                            <Text className="text-[10px] font-elms-bold text-grey uppercase tracking-widest mb-2">Analysis</Text>
                            <Text className="text-sm font-elms-regular text-dark leading-relaxed">
                                The municipality shows a {getVal('area_economia', primaryGeo) > getVal('area_ambiente-e-gestione-rifiuti', primaryGeo) ? 'surplus' : 'deficit'} of
                                €{Math.abs(getVal('area_economia', primaryGeo) - getVal('area_ambiente-e-gestione-rifiuti', primaryGeo)).toLocaleString()} for the current fiscal year.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* CHAPTER 2: THE ARCHITECTURE */}
                <View className="mt-20">
                    <View className="px-8 flex-row items-center mb-8">
                        <View className="w-8 h-8 rounded-full bg-dark items-center justify-center mr-4">
                            <Text className="text-[10px] font-elms-bold text-primary">02</Text>
                        </View>
                        <Text className="text-2xl font-elms-bold tracking-tighter text-dark">Spending Architecture</Text>
                    </View>

                    <View className="bg-dark p-2 overflow-hidden">
                        <Text className="text-[10px] font-elms-bold text-primary uppercase tracking-widest mb-6">Thematic Distribution</Text>
                        {architectureData && <SunTreemapChart screenWidth={SCREEN_WIDTH} screenHeight={SCREEN_HEIGHT} apiData={architectureData} />}
                    </View>
                </View>

                {/* CHAPTER 3: THE CONTEXT */}
                <View className="mt-20">
                    <View className="px-8 flex-row items-center mb-8">
                        <View className="w-8 h-8 rounded-full bg-dark items-center justify-center mr-4">
                            <Text className="text-[10px] font-elms-bold text-primary">03</Text>
                        </View>
                        <Text className="text-2xl font-elms-bold tracking-tighter text-dark">The Benchmark</Text>
                    </View>

                    <View className="bg-white p-2 border border-dark/5 shadow-sm">
                        <Text className="text-[10px] font-elms-bold text-grey uppercase tracking-widest mb-6">vs. National & Regional Averages</Text>
                        {benchmarkData && <SunRadarChart screenWidth={SCREEN_WIDTH} screenHeight={SCREEN_HEIGHT} apiData={benchmarkData} />}
                    </View>
                </View>

                {/* CHAPTER 4: THE MIRROR */}
                {secondaryGeo && architectureData && (
                    <Animated.View entering={FadeInRight.duration(800)} className="px-8 mt-20">
                        <View className="flex-row items-center mb-8">
                            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-4">
                                <Text className="text-[10px] font-elms-bold text-dark">04</Text>
                            </View>
                            <Text className="text-2xl font-elms-bold tracking-tighter text-dark">Side-by-Side Mirror</Text>
                        </View>

                        <View className="bg-white rounded-[40px] p-8 border border-primary/20 shadow-xl">
                            <Text className="text-[10px] font-elms-bold text-dark uppercase tracking-widest mb-6">Comparing {primaryGeo} vs {secondaryGeo}</Text>
                            <SunBarChart
                                screenWidth={SCREEN_WIDTH}
                                screenHeight={SCREEN_HEIGHT}
                                apiData={{
                                    activeGeos: [primaryGeo, secondaryGeo],
                                    series: architectureData.series,
                                    variableLabels: apiData.variableLabels,
                                    activePeriods: ['2024']
                                }}
                            />
                        </View>
                    </Animated.View>
                )}

                {/* FOOTER INSIGHT */}
                <View className="mt-24 px-12 items-center">
                    <View className="w-16 h-[1px] bg-primary mb-8" />
                    <Text className="text-center text-sm font-elms-regular text-grey italic leading-relaxed">
                        "Transparency is the first step towards civic wisdom. Sunflower makes the invisible visible, turning municipal ledgers into human understanding."
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const MunicipalityBalanceSheetScreen = () => (
    <QueryClientProvider client={queryClient}>
        <MunicipalityBalanceSheetScreenContent />
    </QueryClientProvider>
);

export default MunicipalityBalanceSheetScreen;
