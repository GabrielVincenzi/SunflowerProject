import SunBarChart from '@/components/charts/SunBarChart';
import SunLineChart from '@/components/charts/SunLineChart';
import SunPieChart from '@/components/charts/SunPieChart';
import SunPopulationPyramidChart from '@/components/charts/SunPopulationPyramidChart';
import SunRadarChart from '@/components/charts/SunRadarChart';
import SunSortedStreamChart from '@/components/charts/SunSortedStreamChart';
import SunTreemapChart from '@/components/charts/SunTreemapChart';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Chart Dispatcher ─────────────────────────────────────────────────────────
interface ChartDispatcherProps {
    card: StatCardConfig;
    cardWidth: number;
}

function ChartDispatcher({ card, cardWidth }: ChartDispatcherProps) {
    const shared = {
        screenWidth: cardWidth,
        screenHeight: SCREEN_HEIGHT,
        apiData: card.data,
    };

    switch (card.chartType) {
        case 'populationPyramid': return <SunPopulationPyramidChart {...shared} />;
        case 'treemap': return <SunTreemapChart {...shared} />;
        case 'line': return <SunLineChart {...shared} />;
        case 'radar': return <SunRadarChart {...shared} />;
        case 'bar': return <SunBarChart {...shared} />;
        case 'sortedStream': return <SunSortedStreamChart {...shared} />;
        case 'pie': return <SunPieChart {...shared} />;
        default:
            return (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-[10px] font-sf-bold text-dark/25 uppercase tracking-widest">
                        Data not available
                    </Text>
                </View>
            );
    }
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export interface StatCardProps {
    card: StatCardConfig;
    cardWidth: number;
    isActive: boolean;
    onExpand: () => void;
    onChartLongPress: () => void;
}

function StatCard({
    card,
    cardWidth,
    isActive,
    onExpand,
    onChartLongPress,
}: StatCardProps) {
    const isDark = card.bgTheme === 'dark';
    const isPrimary = card.bgTheme === 'primary';

    // ── Colour tokens ─────────────────────────────────────────────────────────
    const bgClass = isDark ? 'bg-dark' : isPrimary ? 'bg-primary' : 'bg-background';
    const mutedClass = isDark ? 'text-primary/40' : 'text-dark/40';
    const tapHintClass = isDark ? 'text-primary/50' : isPrimary ? 'text-dark/50' : 'text-dark/40';
    const dividerClass = isDark ? 'bg-primary/10' : isPrimary ? 'bg-dark/10' : 'bg-dark/8';
    const accentBarClass = isPrimary ? 'bg-dark' : 'bg-primary';
    const topbarClass = isDark ? 'border-primary' : 'border-dark';

    return (
        <View style={{ width: cardWidth }} className={`flex-1 overflow-hidden ${bgClass}`}>

            {/* Left accent bar */}
            <View className={`absolute left-0 top-[12%] bottom-[12%] w-[4px] ${accentBarClass} rounded-r-full z-10`} />

            <View className="flex-1 px-4 pt-6 pb-4">
                {/* ── Zone 1: Category pill + municipality · year ─────────────────── */}
                <Animated.View
                    entering={FadeInDown.delay(80).duration(600)}
                    className="flex-row items-center justify-between mb-4"
                >
                    <View className={`border h-[2px] w-full ${topbarClass} mb-4`} />
                </Animated.View>

                {/* ── Zone 2: Chart — fills all remaining height ───────────────────
            The entire chart surface is tappable (opens sheet) and long-pressable
            (opens educational tooltip). Chart is mounted only when active so
            each Sun* component's entrance animation fires on swipe-to-focus.  ── */}
                <Animated.View
                    entering={FadeInLeft.delay(160).duration(700)}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={0.95}
                        onPress={onExpand}
                        onLongPress={onChartLongPress}
                        delayLongPress={480}
                    >
                        <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
                            {isActive
                                ? <ChartDispatcher card={card} cardWidth={cardWidth} />
                                : null
                            }
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Zone 3: Source whisper + tap cue ────────────────────────────── */}
                <Animated.View
                    entering={FadeInDown.delay(360).duration(500)}
                    className="mt-3"
                >
                    <View className={`h-[1px] ${dividerClass} mb-2`} />
                    <View className="flex-row items-center justify-between">
                        <Text
                            className={`${mutedClass} text-[8px] font-sf-regular uppercase tracking-widest flex-1 mr-3`}
                            numberOfLines={1}
                        >
                            {card.source}
                        </Text>
                        <Text className={`${tapHintClass} text-[9px] font-sf-bold uppercase tracking-widest`}>
                            Tap to explore ↗
                        </Text>
                    </View>
                </Animated.View>

            </View>
        </View>
    );
}

export default StatCard;