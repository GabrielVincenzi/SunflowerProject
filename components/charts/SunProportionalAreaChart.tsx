import { animationDuration, CHART_COLORS, CHART_TEXT_FONT, THEME_COLORS } from "@/constants/utilities";
import { parsePeriod } from "@/functions/dateHandlers";
import { scaleSqrt } from "d3-scale";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, GProps, Path, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedG = Animated.createAnimatedComponent(G);

// ─── Parse activePeriods ──────────────────────────────────────
function parsePeriods(activePeriods: string[]): string[] {
    if (!activePeriods || activePeriods.length === 0) return [];
    if (activePeriods.length === 1 && activePeriods[0].includes("+")) {
        return activePeriods[0].split("+");
    }
    return activePeriods;
}

function periodYear(p: string): string {
    const d = parsePeriod(p);
    if (!isNaN(d.getTime())) return d.getFullYear().toString();
    return p;
}

// ─── Animated half: fades + scales up from cx,cy ─────────────
// Unchanged — same scale-from-center transform, same stagger between
// the two periods (right half first, left half 40% into the timing).
function AnimatedHalf({ cx, cy, r, fill, buildPath, delay = 0 }: {
    cx: number;
    cy: number;
    r: number;
    fill: string;
    buildPath: (cx: number, cy: number, r: number) => string;
    delay?: number;
}) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
    }, [r, delay]);

    const animatedProps = useAnimatedProps<GProps>(() => ({
        opacity: progress.value,
        transform: [{ translateX: cx }, { translateY: cy }, { scale: progress.value }, { translateX: -cx }, { translateY: -cy }],
    }));

    return (
        <AnimatedG animatedProps={animatedProps}>
            <Path d={buildPath(cx, cy, r)} fill={fill} />
        </AnimatedG>
    );
}

// ─── Half-circle path builders ────────────────────────────────
function leftHalfPath(cx: number, cy: number, r: number): string {
    if (r < 0.5) return "";
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} Z`;
}
function rightHalfPath(cx: number, cy: number, r: number): string {
    if (r < 0.5) return "";
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} Z`;
}

// ─── Component ────────────────────────────────────────────────
// Layout, row math, and two-period comparison logic unchanged —
// only styling and the props contract have been aligned to the rest
// of the chart family.
function SunProportionalAreaChart({
    screenWidth,
    apiData,
    xTickCount,
    yTickCount,
    height: heightProp = 280,
    yDomainOverride, // no axis, but the sqrt radius scale honors yMax when given
}: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const width = screenWidth;

    const periods = useMemo(() => parsePeriods(apiData.activePeriods || []), [apiData.activePeriods]);
    const p1Idx = 0;
    const p2Idx = Math.max(0, periods.length - 1);
    const p1Label = periods[p1Idx] ? periodYear(periods[p1Idx]) : "Period 1";
    const p2Label = periods[p2Idx] ? periodYear(periods[p2Idx]) : "Period 2";

    const geos = apiData.activeGeos || [];
    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))),
        [apiData]
    );

    const firstVariable = variables[0] ?? "";

    const chartData = useMemo(() =>
        geos.map((geo, gi) => {
            const series = apiData.series[`${firstVariable}_${geo}`] || [];
            return {
                geo,
                label: geo,
                color: palette[gi % palette.length],
                v1: Math.abs(series[p1Idx]?.value ?? 0),
                v2: Math.abs(series[p2Idx]?.value ?? 0),
                color1: palette[gi % palette.length] + "88",
                color2: palette[gi % palette.length],
            };
        }),
        [geos, firstVariable, apiData, p1Idx, p2Idx, palette]
    );

    const legendItems = useMemo<LegendItem[]>(
        () => chartData.map(({ label, color }) => ({ label, color })),
        [chartData]
    );

    // yDomainOverride.yMax, when given, is a deliberate manipulation of the
    // radius scale — same invariant as every other chart's domain override.
    const maxVal = yDomainOverride?.yMax ?? Math.max(...chartData.flatMap((e) => [e.v1, e.v2]), 1);
    const maxR = 52;
    const rScale = scaleSqrt().domain([0, maxVal]).range([0, maxR]);

    const rowHeight = maxR * 2 + 28;
    const height = Math.max(heightProp, geos.length * rowHeight + 60);
    const cx = width / 2;

    const rightDelay = 0;
    const leftDelay = animationDuration * 0.4;

    const formatVal = (v: number) => {
        if (maxVal >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
        if (maxVal >= 1_000) return (v / 1_000).toFixed(1) + "K";
        return v.toFixed(1);
    };

    return (
        // No card, no border, no radius, no background of its own.
        <View className="w-full px-4 items-center">
            <ChartLegend items={legendItems} />

            <Svg width={width} height={height}>
                <SvgText x={cx} y={24} textAnchor="middle" fontSize={CHART_TEXT_FONT} fontStyle="italic" fill={THEME_COLORS.grey}>{firstVariable}</SvgText>
                <SvgText x={cx - 100} y={24} textAnchor="middle" fontSize={CHART_TEXT_FONT} fontStyle="italic" fill={THEME_COLORS.grey}>{p1Label}</SvgText>
                <SvgText x={cx + 100} y={24} textAnchor="middle" fontSize={CHART_TEXT_FONT} fontStyle="italic" fill={THEME_COLORS.grey}>{p2Label}</SvgText>
                <SvgLine x1={cx} x2={cx} y1={34} y2={height - 10} stroke={`${THEME_COLORS.dark}24`} strokeWidth={1} />

                {chartData.map((e, i) => {
                    const cy = 60 + i * rowHeight + maxR;
                    const r1 = rScale(e.v1);
                    const r2 = rScale(e.v2);
                    const rMax = Math.max(r1, r2);
                    return (
                        <G key={e.geo}>
                            <AnimatedHalf cx={cx} cy={cy} r={r2} fill={e.color2} buildPath={rightHalfPath} delay={rightDelay} />
                            <AnimatedHalf cx={cx} cy={cy} r={r1} fill={e.color1} buildPath={leftHalfPath} delay={leftDelay} />
                            <SvgText x={cx - rMax - 30} y={cy + 5} textAnchor="middle" fontSize={CHART_TEXT_FONT} fontStyle="italic" fill={THEME_COLORS.grey}>{formatVal(e.v1)}</SvgText>
                            <SvgText x={cx + rMax + 30} y={cy + 5} textAnchor="middle" fontSize={CHART_TEXT_FONT} fontStyle="italic" fill={THEME_COLORS.grey}>{formatVal(e.v2)}</SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}

export default SunProportionalAreaChart;