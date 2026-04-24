import { animationDuration, CHART_COLORS, HEIGHT, margin } from "@/constants/utilities";
import { detectGranularity, formatPeriod } from "@/functions/dateHandlers";
import { max } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { area, curveCatmullRom } from "d3-shape";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Defs, G, LinearGradient, Path, PathProps, Stop, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Helpers ──────────────────────────────────────────────────
function detectScale(v: number) {
    if (v >= 1_000_000) return { factor: 1_000_000, label: "Millions" };
    if (v >= 1_000) return { factor: 1_000, label: "Thousands" };
    return { factor: 1, label: "" };
}
function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const abs = Math.abs(n);
    const dec = abs < 10 ? 2 : abs < 100 ? 1 : 0;
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: dec, minimumFractionDigits: 0 }).format(Number(n.toFixed(dec)));
}
function pickXTicks(labels: string[], count: number) {
    if (!labels.length) return [];
    if (count >= labels.length) return labels;
    const result: string[] = [];
    const step = (labels.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) result.push(labels[Math.round(i * step)]);
    return Array.from(new Set(result));
}

// ─── Animated area — identical to SunAreaChart pattern ────────
function AnimatedStackedArea({ d, gradientId, startDelay = 0 }: { d: string; gradientId: string; startDelay?: number }) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d) return;
        const timeout = setTimeout(() => {
            const length = pathRef.current?.getTotalLength?.() ?? 0;
            setPathLength(length);
            progress.value = 0;
            progress.value = withDelay(startDelay, withTiming(1, { duration: animationDuration, easing: Easing.inOut(Easing.ease) }));
        }, 0);
        return () => clearTimeout(timeout);
    }, [d]);

    const animatedProps = useAnimatedProps<PathProps>(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
        opacity: progress.value,
    }));

    return (
        <AnimatedPath ref={pathRef} d={d} fill={`url(#${gradientId})`} stroke="none"
            animatedProps={animatedProps} opacity={pathLength > 0 ? 1 : 0} />
    );
}

// ─── Component ────────────────────────────────────────────────
function SunStackedAreaChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const safeColors = CHART_COLORS || ["#FCD34D"];
    const width = screenWidth;
    const height = screenHeight ? screenHeight * 0.35 : HEIGHT;
    const xTickCount = 6;
    const yTickCount = 5;

    const geos = apiData.activeGeos || [];

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))),
        [apiData]
    );

    const granularity = useMemo(
        () => detectGranularity((apiData.activePeriods || []).map((p) => new Date(p))),
        [apiData.activePeriods]
    );

    const chartData = useMemo(() => {
        let idx = 0;
        return geos.flatMap((geo) =>
            variables.flatMap((v) => {
                const key = `${v}_${geo}`;
                if (!apiData.series[key]) return [];
                const label = geos.length > 1 ? `${v} (${geo})` : v;
                const vals = (apiData.series[key] || []).map((pt) => pt?.value ?? 0);
                return [{ key, label, color: safeColors[idx++ % safeColors.length], values: vals }];
            })
        );
    }, [apiData, geos, variables, safeColors]);

    const legendItems = useMemo<LegendItem[]>(
        () => chartData.map(({ label, color }) => ({ label, color })),
        [chartData]
    );

    const xLabels = useMemo(
        () => (apiData.activePeriods || []).map((p) => formatPeriod(new Date(p), granularity)),
        [apiData.activePeriods, granularity]
    );

    const stackedData = useMemo(() => {
        const n = xLabels.length;
        return chartData.map((s, si) => ({
            ...s,
            y0: Array.from({ length: n }, (_, i) => chartData.slice(0, si).reduce((sum, p) => sum + (p.values[i] ?? 0), 0)),
            y1: Array.from({ length: n }, (_, i) => chartData.slice(0, si + 1).reduce((sum, p) => sum + (p.values[i] ?? 0), 0)),
        }));
    }, [chartData, xLabels]);

    const yMax = max(stackedData.flatMap((s) => s.y1)) ?? 0;
    const { factor: yFactor, label: yUnitLabel } = detectScale(yMax);

    const xScale = useMemo(
        () => scalePoint<string>().domain(xLabels).range([margin.left, width - margin.right]),
        [xLabels, width]
    );
    const yScale = useMemo(
        () => scaleLinear().domain([0, yMax]).nice().range([height - margin.bottom, margin.top]),
        [yMax, height]
    );

    const rawYTicks = yScale.ticks(yTickCount);
    const displayedXLabels = pickXTicks(xLabels, xTickCount);

    return (
        <View className="w-full bg-background">
            {/* Legend */}
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            {/* Chart Section */}
            <Svg width={width} height={height}>
                <Defs>
                    {chartData.map((s, i) => (
                        <LinearGradient key={s.key} id={`grad_sa_${i}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
                            <Stop offset="100%" stopColor={s.color} stopOpacity={0.7} />
                        </LinearGradient>
                    ))}
                </Defs>
                {rawYTicks.map((tick, i) => (
                    <SvgLine key={i} x1={margin.left} x2={width - margin.right}
                        y1={yScale(tick)} y2={yScale(tick)} stroke="rgba(52,58,64,0.07)" strokeDasharray="4 4" />
                ))}
                {stackedData.map((s, si) => {
                    const indices = Array.from({ length: xLabels.length }, (_, i) => i);
                    const aPath = area<number>()
                        .x((i) => xScale(xLabels[i])!)
                        .y0((i) => yScale(s.y0[i]))
                        .y1((i) => yScale(s.y1[i]))
                        .curve(curveCatmullRom)(indices) ?? "";
                    return <AnimatedStackedArea key={s.key} d={aPath} gradientId={`grad_sa_${si}`} startDelay={si * 150} />;
                })}
                <G transform={`translate(0, ${height - margin.bottom})`}>
                    <SvgLine x1={margin.left} x2={width - margin.right} stroke="grey" strokeWidth={1} />
                    {displayedXLabels.map((label, i) => (
                        <G key={i} transform={`translate(${xScale(label)}, 0)`}>
                            <SvgLine y2={5} stroke="grey" />
                            <SvgText y={18} fontSize={11} fill="grey" textAnchor="middle">{label}</SvgText>
                        </G>
                    ))}
                </G>
                <G transform={`translate(${margin.left}, 0)`}>
                    <SvgLine y1={margin.top} y2={height - margin.bottom} stroke="grey" strokeWidth={1} />
                    {rawYTicks.map((tick, i) => (
                        <G key={i} transform={`translate(0, ${yScale(tick)})`}>
                            <SvgLine x2={-5} stroke="grey" />
                            <SvgText x={-8} dy="0.32em" fontSize={11} fill="grey" textAnchor="end">{formatScaled(tick, yFactor)}</SvgText>
                        </G>
                    ))}
                </G>
            </Svg>
        </View>
    );
}

export default SunStackedAreaChart;
