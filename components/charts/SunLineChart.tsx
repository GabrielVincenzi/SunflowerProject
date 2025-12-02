import { animationDuration, colors, margin } from "@/constants/utilities";
import { max, min } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { line } from "d3-shape";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Path, PathProps, Line as SvgLine, Text as SvgText } from "react-native-svg";

// Wrap Path in Animated
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Function to animate the SVG
function AnimatedLine({ d, color }: { d: string; color: string }) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    // Measure the path length when the path is mounted
    useEffect(() => {
        if (!d) return;
        const timeout = setTimeout(() => {
            if (pathRef.current && d) {
                const length = pathRef.current.getTotalLength?.() ?? 0;
                if (length > 0) {
                    setPathLength(length);
                    progress.value = 0;
                    progress.value = withTiming(1, { duration: animationDuration });
                }
            }
        }, 0);

        return () => clearTimeout(timeout);
    }, [d]);

    const animatedProps = useAnimatedProps<PathProps>(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
    }));

    const isReady = pathLength > 0;

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            stroke={color}
            strokeWidth={4}
            fill="none"
            opacity={isReady ? 1 : 0}
            animatedProps={animatedProps}
        />
    );
}

// helpers
function detectScale(maxAbsValue: number) {
    if (maxAbsValue >= 1_000_000) return { factor: 1_000_000, label: "Millions" };
    if (maxAbsValue >= 1_000) return { factor: 1_000, label: "Thousands" };
    return { factor: 1, label: "" };
}

function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const absN = Math.abs(n);
    const maxFractionDigits = absN < 10 ? 2 : absN < 100 ? 1 : 0;

    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
    }).format(Number(n.toFixed(maxFractionDigits)));
}

// pick evenly-spaced X tick labels (always include first and last)
function pickXTicks(labels: string[], count: number) {
    if (!labels || labels.length === 0) return [];
    if (count >= labels.length) return labels;
    if (count <= 1) return [labels[0]];

    const result: string[] = [];
    const step = (labels.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
        const idx = Math.round(i * step);
        result.push(labels[idx]);
    }
    // de-duplicate (rounding can duplicate), keep first/last
    return Array.from(new Set(result));
}

// Create starting scales
function createLineChart({
    width,
    height,
    margin,
    xLabels,
    yValues,
}: {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    xLabels: string[];
    yValues: number[];
}) {
    const xScale = scalePoint<string>()
        .domain(xLabels)
        .range([margin.left, width - margin.right]);

    const yScale = scaleLinear()
        .domain([min(yValues) ?? 0, max(yValues) ?? 0])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const lineGenerator = line<{ value: number; label: string }>()
        .x((d) => xScale(d.label)!)
        .y((d) => yScale(d.value))
        .defined((d) => d.value !== null);

    return { xScale, yScale, lineGenerator };
}

// SunLineChart
function SunLineChart({
    screenWidth,
    apiData,
    xTickCount = 6, // default show ~6 x labels (years)
    yTickCount = 6, // default y ticks
    height = 260,
}: any) {
    const safeColors = colors || ["#000000"];

    const hasData =
        apiData &&
        Array.isArray(apiData.activeGeos) &&
        apiData.activeGeos.length > 0 &&
        apiData.series &&
        Object.keys(apiData.series).length > 0;

    // Build chartData
    const chartData = hasData
        ? apiData.activeGeos.length > 1
            ? apiData.activeGeos.map((geo: any, idx: number) => {
                const key = Object.keys(apiData.series).find((k) => k.endsWith(`_${geo}`));
                const values = key && apiData.series[key] ? apiData.series[key] : [];
                return {
                    geo,
                    label: geo,
                    data: values.map((pt: any, i: number) => {
                        const date = apiData.activePeriods?.[i] ? new Date(apiData.activePeriods[i]) : null;
                        const year = date ? date.getFullYear().toString() : "";
                        return { value: pt?.value ?? 0, label: year };
                    }),
                    color: safeColors[idx % safeColors.length],
                };
            })
            : (() => {
                const geo = apiData.activeGeos[0];
                const variableKeys = Object.keys(apiData.series).filter((k) => k.endsWith(`_${geo}`));
                return variableKeys.map((key, idx) => {
                    const variableName = key.replace(`_${geo}`, "");
                    const values = apiData.series[key] || [];
                    return {
                        geo,
                        label: variableName,
                        data: values.map((pt: any, i: number) => {
                            const date = apiData.activePeriods?.[i] ? new Date(apiData.activePeriods[i]) : null;
                            const year = date ? date.getFullYear().toString() : "";
                            return { value: pt?.value ?? 0, label: year };
                        }),
                        color: safeColors[idx % safeColors.length],
                    };
                });
            })()
        : [];

    const width = screenWidth;
    const allDataPoints = chartData.flatMap((s: any) => s.data);
    const xLabels = Array.from(
        new Set(allDataPoints.map((d: any) => d.label as string))
    ) as string[];
    const yValues = allDataPoints.map((d: any) => d.value);

    // detect scale for Y axis labels (Thousands / Millions)
    const maxAbs = yValues.length ? Math.max(...yValues.map((v: any) => Math.abs(v))) : 0;
    const { factor: yFactor, label: yUnitLabel } = detectScale(maxAbs);

    const { xScale, yScale, lineGenerator } = useMemo(
        () =>
            createLineChart({
                width,
                height,
                margin,
                xLabels,
                yValues,
            }),
        [width, height, margin, xLabels.join(","), yValues.join(",")]
    );

    // compute Y ticks (raw values) and formatted labels
    const rawYTicks = yScale.ticks(yTickCount);
    const formattedYTicks = rawYTicks.map((t) => formatScaled(t, yFactor));

    // compute which x labels to show
    const displayedXLabels = pickXTicks(xLabels, xTickCount);

    return (
        <View>
            {/* Legend */}
            <View className="items-center">
                <View className="flex-row flex-wrap justify-center mt-1">
                    {chartData.map((series: any) => (
                        <View key={series.label} className="flex-row items-center m-2" style={{ gap: 6 }}>
                            <View style={{ width: 12, height: 12, backgroundColor: series.color, borderRadius: 2, marginRight: 6 }} />
                            <Text style={{ fontSize: 12, color: "grey" }}>{series.label}</Text>
                        </View>
                    ))}
                </View>
                {yUnitLabel ? (
                    <Text style={{ fontSize: 12, color: "grey", marginTop: 4 }}>({yUnitLabel})</Text>
                ) : null}
            </View>

            {/* Chart area */}
            <View>
                {/* if you prefer the overview text at a specific absolute position you can position it over the Svg */}
                <Svg width={width} height={height}>
                    {/* X Axis */}
                    <G transform={`translate(0, ${height - margin.bottom})`}>
                        {displayedXLabels.map((label, i) => (
                            <G key={i} transform={`translate(${xScale(label)}, 0)`}>
                                <SvgLine y2={6} stroke="grey" />
                                <SvgText y={20} fontSize={12} fill="grey" textAnchor="middle">
                                    {label}
                                </SvgText>
                            </G>
                        ))}
                        <SvgLine x1={margin.left} x2={width - margin.right} stroke="grey" strokeWidth={1} />
                    </G>

                    {/* Y Axis */}
                    <G transform={`translate(${margin.left}, 0)`}>
                        {rawYTicks.map((tick, i) => (
                            <G key={i} transform={`translate(0, ${yScale(tick)})`}>
                                <SvgLine x2={-6} stroke="grey" />
                                <SvgText x={-10} dy="0.32em" fontSize={12} fill="grey" textAnchor="end">
                                    {formattedYTicks[i]}
                                </SvgText>
                            </G>
                        ))}
                        <SvgLine y1={margin.top} y2={height - margin.bottom} stroke="grey" strokeWidth={1} />
                    </G>

                    {/* Lines */}
                    {chartData.map((series: any) => (
                        <AnimatedLine key={series.label} d={lineGenerator(series.data) ?? ""} color={series.color} />
                    ))}
                </Svg>
            </View>
        </View>
    );
}

export default SunLineChart;
