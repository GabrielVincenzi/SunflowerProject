import { animationDuration, CHART_COLORS } from "@/constants/utilities";
import { arc, pie, PieArcDatum } from "d3-shape";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, Path, PathProps } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedMaskPath = Animated.createAnimatedComponent(Path);

// ─── Circular reveal mask ───────────────────────────────────────
// A single pie-slice-shaped clip sweeps from 0° to 360° like a clock
// hand, uncovering the fully-formed pie underneath as it goes — a
// "circular entering" reveal, rather than each wedge fading in place.
function SweepMask({ id, maskRadius }: { id: string; maskRadius: number }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }, []);

    const animatedProps = useAnimatedProps<PathProps>(() => {
        const theta = progress.value * Math.PI * 2;

        if (theta <= 0.0005) {
            return { d: "M 0,0 Z" };
        }
        if (theta >= Math.PI * 2 - 0.001) {
            // Full circle — draw as two semicircle arcs to avoid the
            // degenerate single-arc case where start === end.
            return {
                d: `M ${-maskRadius},0 A ${maskRadius} ${maskRadius} 0 1 1 ${maskRadius},0 A ${maskRadius} ${maskRadius} 0 1 1 ${-maskRadius},0 Z`,
            };
        }

        const x0 = maskRadius * Math.sin(0);
        const y0 = -maskRadius * Math.cos(0);
        const x1 = maskRadius * Math.sin(theta);
        const y1 = -maskRadius * Math.cos(theta);
        const largeArc = theta > Math.PI ? 1 : 0;

        return { d: `M 0,0 L ${x0},${y0} A ${maskRadius} ${maskRadius} 0 ${largeArc} 1 ${x1},${y1} Z` };
    });

    return (
        <Defs>
            <ClipPath id={id}>
                <AnimatedMaskPath d="M 0,0 Z" animatedProps={animatedProps} />
            </ClipPath>
        </Defs>
    );
}

// ─── Component ────────────────────────────────────────────────
function SunPieChart({
    screenWidth,
    apiData,
    xTickCount,
    yTickCount,
    height = 280,
    yDomainOverride, // no axis — accepted and silently ignored, per contract
}: ChartProps) {
    const size = Math.min(screenWidth, height);
    const radius = size / 2;
    const innerRadius = radius * 0.6;
    const geos = apiData.activeGeos || [];
    const palette = apiData?.palette ?? CHART_COLORS;

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf("_"))))),
        [apiData]
    );

    const lastPeriodIndex = Math.max(0, (apiData.activePeriods?.length ?? 1) - 1);

    // Sorted largest → smallest before the pie layout runs, so the
    // biggest wedge always starts at 12 o'clock and slices descend
    // clockwise in size order.
    const chartData = useMemo(() => {
        const geo = geos[0];
        if (!geo) return [];
        const rows = variables.map((variable, varIdx) => ({
            label: apiData.variableLabels?.[variable] ?? variable,
            value: Math.abs(apiData.series?.[`${variable}_${geo}`]?.[lastPeriodIndex]?.value ?? 0),
            color: palette[varIdx % palette.length],
        }));
        return rows.sort((a, b) => b.value - a.value);
    }, [apiData, geos, variables, lastPeriodIndex, palette]);

    const legendItems = useMemo<LegendItem[]>(
        () => chartData.map(({ label, color }) => ({ label, color })),
        [chartData]
    );

    // sort(null) preserves the array order set above — the pie layout
    // must not re-sort behind our backs, or the biggest-first ordering
    // would be lost.
    const pieGenerator = useMemo(() => pie<typeof chartData[number]>().value((d) => d.value).sort(null), []);
    const arcs = useMemo(() => pieGenerator(chartData), [pieGenerator, chartData]);
    const arcGen = useMemo(() => arc<PieArcDatum<typeof chartData[number]>>().innerRadius(innerRadius).outerRadius(radius), [innerRadius, radius]);

    const clipId = "sun-pie-sweep";

    return (
        // No card, no border, no radius, no background of its own.
        <View className="w-full items-center py-8">
            <ChartLegend items={legendItems} />
            <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
                <Svg width={size} height={size}>
                    <G transform={`translate(${radius}, ${radius})`}>
                        <SweepMask id={clipId} maskRadius={radius + 2} />
                        <G clipPath={`url(#${clipId})`}>
                            {arcs.map((a, i) => (
                                <Path key={i} d={arcGen(a)!} fill={a.data.color} />
                            ))}
                        </G>
                    </G>
                </Svg>
                <View className="absolute items-center" pointerEvents="none">
                    <Text className="text-xl italic text-dark tracking-tighter">{(geos[0] || "").toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );
}

export default SunPieChart;