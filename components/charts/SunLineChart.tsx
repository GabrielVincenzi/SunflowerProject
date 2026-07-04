import { animationDuration, CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
import { detectGranularity, formatPeriod, parsePeriod } from "@/functions/dateHandlers";
import { detectScale } from "@/functions/formatHandlers";
import { max, min } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { line } from "d3-shape";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, PathProps, Stop, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Animated line draw ───────────────────────────────────────
function AnimatedLine({ d, color }: { d: string; color: string }) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d) return;
        const timeout = setTimeout(() => {
            if (pathRef.current && d) {
                const length = pathRef.current.getTotalLength?.() ?? 0;
                if (length > 0) {
                    setPathLength(length);
                    progress.value = 0;
                    progress.value = withTiming(1, {
                        duration: animationDuration,
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
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

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            stroke={color}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity={pathLength > 0 ? 1 : 0}
            animatedProps={animatedProps}
        />
    );
}

// ─── End-of-line marker ───────────────────────────────────────
// Filled dot with a cream ring at the final data point per series.
// Draws the eye to "where things are now." Fades in with a spring
// overshoot after the line-draw animation completes.
function EndMarker({ x, y, color }: { x: number; y: number; color: string }) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
        scale.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.back(1.6)) });
    }, []);

    const dotProps = useAnimatedProps(() => ({ opacity: opacity.value, r: 5.5 * scale.value }));
    const ringProps = useAnimatedProps(() => ({ opacity: opacity.value, r: 9 * scale.value }));

    return (
        <G>
            <AnimatedCircle cx={x} cy={y} fill={THEME_COLORS.background} animatedProps={ringProps} />
            <AnimatedCircle cx={x} cy={y} fill={color} animatedProps={dotProps} />
        </G>
    );
}

// ─── Area fill ────────────────────────────────────────────────
// Soft gradient beneath each line — light pooling under the signal.
// 0% → 18% opacity of series color at the top, fading to 0 at baseline.
function createAreaPath(
    data: { value: number; label: string }[],
    xScale: ReturnType<typeof scalePoint<string>>,
    yScale: ReturnType<typeof scaleLinear>,
    baseline: number
): string {
    const pts = data.filter(d => d.value !== null);
    if (pts.length === 0) return "";
    const top = pts.map(d => `${xScale(d.label)},${yScale(d.value)}`).join("L");
    const firstX = xScale(pts[0].label);
    const lastX = xScale(pts[pts.length - 1].label);
    return `M${firstX},${baseline}L${top}L${lastX},${baseline}Z`;
}

// ─── Scale helpers (logic strictly preserved from original) ───
function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const absN = Math.abs(n);
    const maxFractionDigits = absN < 10 ? 2 : absN < 100 ? 1 : 0;
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
    }).format(Number(n.toFixed(maxFractionDigits)));
}

function pickXTicks(labels: string[], count: number) {
    if (!labels || labels.length === 0) return [];
    if (count >= labels.length) return labels;
    if (count <= 1) return [labels[0]];
    const result: string[] = [];
    const step = (labels.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) result.push(labels[Math.round(i * step)]);
    return Array.from(new Set(result));
}

function createLineChart({
    width, height, margin, xLabels, yValues, yDomainOverride,
}: {
    width: number; height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    xLabels: string[]; yValues: number[];
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

    // Skip .nice() when an explicit override is given — rounding would
    // silently undo a deliberate axis truncation (Manipulator's Studio).
    if (!yDomainOverride) yScale.nice();

    const lineGenerator = line<{ value: number; label: string }>()
        .x(d => xScale(d.label)!)
        .y(d => yScale(d.value))
        .defined(d => d.value !== null);

    return { xScale, yScale, lineGenerator };
}

// ─── SunLineChart ─────────────────────────────────────────────
// Full-width, card-free. The chart is the surface — no wrapper,
// no border, no radius. Background is whatever the parent screen
// provides (always bg-background cream in practice).
function SunLineChart({
    screenWidth,
    apiData,
    xTickCount = 6,
    yTickCount = 5,
    height = 280,
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
            Object.keys(apiData.series).filter(k => k.endsWith(`_${geo}`));
        let seriesCounter = 0;

        if (multipleGeos && apiData.variables?.length === 1) {
            return apiData.activeGeos.map((geo: string) => {
                const key = variableKeysByGeo(geo)[0];
                const series = {
                    geo, label: geo,
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
            const qMatch = s.match(/(\d{4})[- ]?Q(\d)/i);
            if (qMatch) return Number(qMatch[1]) * 100 + Number(qMatch[2]);
            const mMatch = s.match(/(\d{4})[- ]?M?(\d{1,2})/i);
            if (mMatch) return Number(mMatch[1]) * 100 + Number(mMatch[2]);
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
        () => createLineChart({ width, height, margin, xLabels, yValues, yDomainOverride }),
        [width, height, margin, xLabels.join(","), yValues.join(","), yDomainOverride?.yMin, yDomainOverride?.yMax]
    );

    const rawYTicks = yScale.ticks(yTickCount);
    const formattedYTicks = rawYTicks.map(t => formatScaled(t, yFactor));
    const displayedXLabels = pickXTicks(xLabels, xTickCount);
    const baselineY = height - margin.bottom;

    return (
        // No card, no border, no radius. bg-background is inherited from
        // the parent screen. The chart is purely a composition of SVG marks.
        <View className="w-full">
            {/* Legend above — position is non-negotiable per spec */}
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <Svg width={width} height={height}>
                <Defs>
                    {chartData.map((series: any) => (
                        <LinearGradient
                            key={`grad-${series.label}`}
                            id={`sf-area-${series.geo}-${series.label}`}
                            x1="0" y1="0" x2="0" y2="1"
                        >
                            <Stop offset="0" stopColor={series.color} stopOpacity={0.16} />
                            <Stop offset="1" stopColor={series.color} stopOpacity={0} />
                        </LinearGradient>
                    ))}
                </Defs>

                {/* Horizontal gridlines — y only, dashed, very recessive */}
                {rawYTicks.map((tick, i) => (
                    <SvgLine
                        key={i}
                        x1={margin.left} x2={width - margin.right}
                        y1={yScale(tick)} y2={yScale(tick)}
                        stroke={THEME_COLORS.subtle}
                        strokeWidth={1}
                        strokeDasharray="4,5"
                    />
                ))}

                {/* x-axis hairline */}
                <SvgLine
                    x1={margin.left} x2={width - margin.right}
                    y1={baselineY} y2={baselineY}
                    stroke={`${THEME_COLORS.dark}24`}
                    strokeWidth={1}
                />

                {/* x-axis labels — italic, sentence case, muted */}
                {displayedXLabels.map((label, i) => (
                    <SvgText
                        key={i}
                        x={xScale(label)}
                        y={baselineY + 22}
                        fontSize={11}
                        fill={THEME_COLORS.grey}
                        textAnchor="middle"
                        fontStyle="italic"
                    >
                        {label}
                    </SvgText>
                ))}

                {/* y-axis labels — no rule, no tick marks, labels only */}
                {rawYTicks.map((tick, i) => (
                    <SvgText
                        key={i}
                        x={margin.left - 10}
                        y={yScale(tick)}
                        dy="0.35em"
                        fontSize={11}
                        fill={THEME_COLORS.grey}
                        textAnchor="end"
                        fontStyle="italic"
                    >
                        {formattedYTicks[i]}
                    </SvgText>
                ))}

                {/* Area fills — one per series, drawn below the line */}
                {chartData.map((series: any) => (
                    <Path
                        key={`area-${series.label}`}
                        d={createAreaPath(series.data, xScale, yScale, baselineY)}
                        fill={`url(#sf-area-${series.geo}-${series.label})`}
                        stroke="none"
                    />
                ))}

                {/* Signal lines */}
                {chartData.map((series: any) => (
                    <AnimatedLine
                        key={series.label}
                        d={lineGenerator(series.data) ?? ""}
                        color={series.color}
                    />
                ))}

                {/* End-of-line markers */}
                {chartData.map((series: any) => {
                    const pts = series.data.filter((d: any) => d.value !== null);
                    if (pts.length === 0) return null;
                    const last = pts[pts.length - 1];
                    const x = xScale(last.label);
                    if (x === undefined) return null;
                    return (
                        <EndMarker
                            key={`marker-${series.label}`}
                            x={x}
                            y={yScale(last.value)}
                            color={series.color}
                        />
                    );
                })}
            </Svg>
        </View>
    );
}

export default SunLineChart;