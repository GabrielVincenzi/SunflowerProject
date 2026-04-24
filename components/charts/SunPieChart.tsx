import { animationDuration, CHART_COLORS, HEIGHT, THEME_COLORS } from "@/constants/utilities";
import { arc, pie, PieArcDatum } from "d3-shape";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Path, PathProps } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Animated arc ─────────────────────────────────────────────
function AnimatedArc({ d, color }: { d: string; color: string }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }, [d]);

    const animatedProps = useAnimatedProps<PathProps>(() => ({
        opacity: progress.value,
    }));

    return <AnimatedPath d={d} fill={color} stroke={THEME_COLORS.dark} strokeWidth={2.5} animatedProps={animatedProps} />;
}

// ─── Component ────────────────────────────────────────────────
function SunPieChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const size = Math.min(screenWidth, screenHeight ? screenHeight * 0.4 : HEIGHT);
    const radius = size / 2;
    const innerRadius = radius * 0.6;
    const geos = apiData.activeGeos || [];
    const safeColors = CHART_COLORS || ["#000"];

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf("_"))))),
        [apiData]
    );

    const lastPeriodIndex = Math.max(0, (apiData.activePeriods?.length ?? 1) - 1);

    const chartData = useMemo(() => {
        const geo = geos[0];
        if (!geo) return [];
        return variables.map((variable, varIdx) => ({
            label: apiData.variableLabels?.[variable] ?? variable,
            value: Math.abs(apiData.series?.[`${variable}_${geo}`]?.[lastPeriodIndex]?.value ?? 0),
            color: safeColors[varIdx % safeColors.length],
        }));
    }, [apiData, geos, variables, lastPeriodIndex, safeColors]);

    const legendItems = useMemo<LegendItem[]>(
        () => chartData.map(({ label, color }) => ({ label, color })),
        [chartData]
    );

    const pieGenerator = useMemo(() => pie<typeof chartData[number]>().value((d) => d.value).sort(null), []);
    const arcs = useMemo(() => pieGenerator(chartData), [pieGenerator, chartData]);
    const arcGen = useMemo(() => arc<PieArcDatum<typeof chartData[number]>>().innerRadius(innerRadius).outerRadius(radius), [innerRadius, radius]);
    const centerLabel = geos[0] ?? "";

    return (
        <View className="w-full bg-background items-center py-8">
            <ChartLegend items={legendItems} />
            <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
                <Svg width={size} height={size}>
                    <G transform={`translate(${radius}, ${radius})`}>
                        {arcs.map((a, i) => <AnimatedArc key={i} d={arcGen(a)!} color={a.data.color} />)}
                    </G>
                </Svg>
                <View className="absolute items-center" pointerEvents="none">
                    <Text className="text-[10px] font-black italic text-dark opacity-30">SIGNAL_NODE</Text>
                    <Text className="text-xl font-black italic text-dark tracking-tighter">{(geos[0] || "").toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );
}

export default SunPieChart;