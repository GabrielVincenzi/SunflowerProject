import { animationDuration, CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
import { detectGranularity, formatPeriod, parsePeriod } from "@/functions/dateHandlers";
import { detectScale } from "@/functions/formatHandlers";
import { max, min } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { line } from "d3-shape";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Path, PathProps, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

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
                    // Applying High-Impact mechanical easing
                    progress.value = withTiming(1, {
                        duration: animationDuration,
                        easing: Easing.bezier(0.16, 1, 0.3, 1)
                    });
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
            // High Impact: Thickened signal stroke
            strokeWidth={6}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity={isReady ? 1 : 0}
            animatedProps={animatedProps}
        />
    );
}

// helpers (Logic strictly preserved)
function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const absN = Math.abs(n);
    const maxFractionDigits = absN < 10 ? 2 : absN < 100 ? 1 : 0;

    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
    }).format(Number(n.toFixed(maxFractionDigits)));
}

// pick evenly-spaced X tick labels (Logic strictly preserved)
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
    return Array.from(new Set(result));
}

// Create starting scales
function createLineChart({
    width,
    height,
    margin,
    xLabels,
    yValues,
    yDomainOverride,
}: {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    xLabels: string[];
    yValues: number[];
    yDomainOverride?: { yMin?: number; yMax?: number };
}) {
    const xScale = scalePoint<string>()
        .domain(xLabels)
        .range([margin.left, width - margin.right]);

    const domainMin = yDomainOverride?.yMin ?? (min(yValues) ?? 0);
    const domainMax = yDomainOverride?.yMax ?? (max(yValues) ?? 0);

    const yScale = scaleLinear()
        .domain([domainMin, domainMax])
        .range([height - margin.bottom, margin.top]);

    // .nice() rounds the domain to clean tick values — skipped when an
    // explicit override is given, since "nice" rounding would undo a
    // deliberately precise axis truncation.
    if (!yDomainOverride) {
        yScale.nice();
    }

    const lineGenerator = line<{ value: number; label: string }>()
        .x((d) => xScale(d.label)!)
        .y((d) => yScale(d.value))
        .defined((d) => d.value !== null);

    return { xScale, yScale, lineGenerator };
}

// SunLineChart
// ── CHANGE: accepts an optional `yDomainOverride` prop, shape
// { yMin?: number; yMax?: number }. Unused by every existing call site
// (ChartPage etc.) since it's optional — auto-scale behavior is
// unchanged when omitted.
function SunLineChart({
    screenWidth,
    apiData,
    xTickCount = 6,
    yTickCount = 6,
    height = 300, // Slightly taller for high impact
    yDomainOverride,
}: any) {
    const palette = apiData?.palette ?? CHART_COLORS;

    const hasData =
        apiData &&
        Array.isArray(apiData.activeGeos) &&
        apiData.activeGeos.length > 0 &&
        apiData.series &&
        Object.keys(apiData.series).length > 0;

    const granularity = useMemo(
        () => detectGranularity(apiData?.activePeriods?.map((p: any) => parsePeriod(p)) ?? []),
        [apiData?.activePeriods]
    );

    const chartData = useMemo(() => {
        if (!hasData) return [];
        const multipleGeos = apiData.activeGeos.length > 1;
        const variableKeysByGeo = (geo: string) =>
            Object.keys(apiData.series).filter((k) => k.endsWith(`_${geo}`));
        let seriesCounter = 0;

        if (multipleGeos && apiData.variables?.length === 1) {
            return apiData.activeGeos.map((geo: string) => {
                const key = variableKeysByGeo(geo)[0];
                const series = {
                    geo,
                    label: geo,
                    data: (apiData.series[key] ?? []).map((pt: any, i: number) => {
                        const date = apiData.activePeriods?.[i] ? parsePeriod(apiData.activePeriods[i]) : null;
                        return { value: pt?.value ?? 0, label: date ? formatPeriod(date, granularity) : "" };
                    }),
                    color: palette[seriesCounter % palette.length],
                };
                seriesCounter++;
                return series;
            });
        } else {
            return apiData.activeGeos.flatMap((geo: string) =>
                variableKeysByGeo(geo).map((key: string) => {
                    const variableName = key.replace(`_${geo}`, "");
                    const readable = apiData.variableLabels?.[variableName] ?? variableName;
                    const series = {
                        geo,
                        label: multipleGeos ? `${readable} (${geo})` : readable,
                        data: (apiData.series[key] ?? []).map((pt: any, i: number) => {
                            const date = apiData.activePeriods?.[i] ? parsePeriod(apiData.activePeriods[i]) : null;
                            return { value: pt?.value ?? 0, label: date ? formatPeriod(date, granularity) : "" };
                        }),
                        color: palette[seriesCounter % palette.length],
                    };
                    seriesCounter++;
                    return series;
                })
            );
        }
    }, [apiData, palette, granularity, hasData]);

    const legendItems = useMemo<LegendItem[]>(
        () => chartData.map(({ label, color }: LegendItem) => ({ label, color })),
        [chartData]
    );

    const width = screenWidth;
    const allDataPoints = chartData.flatMap((s: any) => s.data);
    const xLabels: string[] = Array.from(
        new Set<string>(allDataPoints.map((d: any) => d.label))
    ).sort((a, b) => {
        const parse = (s: string): number => {
            // Quarterly: "2023Q1", "2023-Q1"
            const qMatch = s.match(/(\d{4})[- ]?Q(\d)/i);
            if (qMatch) return Number(qMatch[1]) * 100 + Number(qMatch[2]);

            // Monthly: "2023M01", "2023-01", "Jan 2023", "2023-01-01"
            const mMatch = s.match(/(\d{4})[- ]?M?(\d{1,2})/i);
            if (mMatch) return Number(mMatch[1]) * 100 + Number(mMatch[2]);

            // Annual: "2023"
            const yMatch = s.match(/(\d{4})/);
            if (yMatch) return Number(yMatch[1]) * 100;

            return 0;
        };
        return parse(a) - parse(b);
    });
    const yValues = allDataPoints.map((d: any) => d.value);

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
                yDomainOverride,
            }),
        [width, height, margin, xLabels.join(","), yValues.join(","), yDomainOverride?.yMin, yDomainOverride?.yMax]
    );

    const rawYTicks = yScale.ticks(yTickCount);
    const formattedYTicks = rawYTicks.map((t) => formatScaled(t, yFactor));
    const displayedXLabels = pickXTicks(xLabels, xTickCount);

    return (
        <View className="w-full bg-background">
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <View className="items-center">
                <Svg width={width} height={height}>
                    {/* Brutalist Grid: Dashed Signal Floor */}
                    {rawYTicks.map((tick, i) => (
                        <SvgLine key={i} x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke={THEME_COLORS.dark} strokeOpacity={0.08} strokeDasharray="3,3" />
                    ))}

                    {/* Industrial X Axis */}
                    <G transform={`translate(0, ${height - margin.bottom})`}>
                        {displayedXLabels.map((label, i) => (
                            <G key={i} transform={`translate(${xScale(label)}, 0)`}>
                                <SvgLine y2={10} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={30} fontSize={10} fill={THEME_COLORS.dark} textAnchor="middle" fontWeight="800">
                                    {label.toUpperCase()}
                                </SvgText>
                            </G>
                        ))}
                        <SvgLine x1={margin.left} x2={width - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                    </G>

                    {/* Technical Y Axis */}
                    <G transform={`translate(${margin.left}, 0)`}>
                        {rawYTicks.map((tick, i) => (
                            <G key={i} transform={`translate(0, ${yScale(tick)})`}>
                                <SvgLine x2={-10} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText x={-14} dy="0.32em" fontSize={10} fill={THEME_COLORS.dark} opacity={0.4} textAnchor="end" fontWeight="800">
                                    {formattedYTicks[i]}
                                </SvgText>
                            </G>
                        ))}
                        <SvgLine y1={margin.top} y2={height - margin.bottom} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                    </G>

                    {/* Signal Paths */}
                    {chartData.map((series: any) => (
                        <AnimatedLine key={series.label} d={lineGenerator(series.data) ?? ""} color={series.color} />
                    ))}
                </Svg>
            </View>
        </View>
    );
}

export default SunLineChart;