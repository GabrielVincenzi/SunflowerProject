import { animationDuration, CHART_COLORS, HEIGHT, margin, THEME_COLORS } from "@/constants/utilities";
import { detectGranularity, formatPeriod } from "@/functions/dateHandlers";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, Path, Rect, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Stable clip ID ───
let _clipIdCounter = 0;
function useStableId() {
    const ref = useRef(`ribbon-clip-${_clipIdCounter++}`);
    return ref.current;
}

// ─── Animated ribbon ───
function AnimatedRibbon({ d, topEdge, bottomEdge, fill, delay = 0, chartWidth }: {
    d: string;
    topEdge: string;
    bottomEdge: string;
    fill: string;
    delay?: number;
    chartWidth: number;
}) {
    const progress = useSharedValue(0);
    const clipId = useStableId();

    useEffect(() => {
        if (!d) return;
        progress.value = 0;
        progress.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
    }, [d]);

    const animatedRectProps = useAnimatedProps(() => ({
        width: progress.value * chartWidth,
    }));

    return (
        <>
            <Defs>
                <ClipPath id={clipId}>
                    <AnimatedRect x={0} y={-9999} height={99999} animatedProps={animatedRectProps} />
                </ClipPath>
            </Defs>

            {/* Filled ribbon */}
            <Path d={d} fill={fill} opacity={0.88} clipPath={`url(#${clipId})`} />

            {/* Top edge stroke — open path, no rectangle artifacts */}
            <Path d={topEdge} fill="none" stroke={THEME_COLORS.dark} strokeWidth={2} clipPath={`url(#${clipId})`} />

            {/* Bottom edge stroke */}
            <Path d={bottomEdge} fill="none" stroke={THEME_COLORS.dark} strokeWidth={2} clipPath={`url(#${clipId})`} />
        </>
    );
}

// ─── Helpers ───────────────────────────────────────────────────
function pickXTicks(labels: string[], count: number): string[] {
    if (!labels.length) return [];
    if (count >= labels.length) return labels;
    const result: string[] = [];
    const step = (labels.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) result.push(labels[Math.round(i * step)]);
    return Array.from(new Set(result));
}

// Returns fill path + the two open edge paths separately
function ribbonPath(lx: number, ly0: number, ly1: number, rx: number, ry0: number, ry1: number): {
    fill: string;
    topEdge: string;
    bottomEdge: string;
} {
    const mx = (lx + rx) / 2;

    const bottomEdge = `M ${lx} ${ly0} C ${mx} ${ly0}, ${mx} ${ry0}, ${rx} ${ry0}`;
    const topEdge = `M ${lx} ${ly1} C ${mx} ${ly1}, ${mx} ${ry1}, ${rx} ${ry1}`;
    const fill = `${bottomEdge} L ${rx} ${ry1} C ${mx} ${ry1}, ${mx} ${ly1}, ${lx} ${ly1} Z`;

    return { fill, topEdge, bottomEdge };
}

// ─── Component ─────────────────────────────────────────────────
function SunSortedStreamChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const safeColors = CHART_COLORS || ["#FCD34D"];
    const width = screenWidth;
    const height = screenHeight ? screenHeight * 0.4 : HEIGHT;
    const xTickCount = 6;

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
                const vals = (apiData.series[key] || []).map((pt) => Math.abs(pt?.value ?? 0));
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

    const n = xLabels.length;
    const iW = width - margin.left - margin.right;
    const iH = height - margin.top - margin.bottom;
    const xPos = (i: number) => margin.left + (i / Math.max(n - 1, 1)) * iW;

    const allStacks = useMemo(() => {
        return Array.from({ length: n }, (_, ti) => {
            const sorted = chartData.map((s) => ({ key: s.key, val: s.values[ti] ?? 0 })).sort((a, b) => b.val - a.val);
            const total = sorted.reduce((s, d) => s + d.val, 0) || 1;
            const scale = iH / total;
            let cum = margin.top;
            return sorted.map((d) => {
                const h = d.val * scale;
                const band = { key: d.key, y0: cum, y1: cum + h };
                cum += h;
                return band;
            });
        });
    }, [chartData, n, iH]);

    const displayedXLabels = pickXTicks(xLabels, xTickCount);

    return (
        <View className="w-full bg-background">
            <ChartLegend items={legendItems} />

            <Svg width={width} height={height}>
                {/* Vertical grid lines */}
                {xLabels.map((_, i) => (
                    <SvgLine key={i} x1={xPos(i)} x2={xPos(i)} y1={margin.top} y2={margin.top + iH}
                        stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                ))}

                {/* Ribbons */}
                {n > 1 && Array.from({ length: n - 1 }, (_, ti) =>
                    chartData.map((s) => {
                        const left = allStacks[ti].find((d) => d.key === s.key);
                        const right = allStacks[ti + 1].find((d) => d.key === s.key);
                        if (!left || !right) return null;

                        const { fill, topEdge, bottomEdge } = ribbonPath(
                            xPos(ti), left.y0, left.y1,
                            xPos(ti + 1), right.y0, right.y1
                        );

                        return (
                            <AnimatedRibbon
                                key={`${s.key}-${ti}`}
                                d={fill}
                                topEdge={topEdge}
                                bottomEdge={bottomEdge}
                                fill={s.color}
                                delay={ti * 60}
                                chartWidth={width}
                            />
                        );
                    })
                )}

                {/* Inline series labels */}
                {chartData.map((s) => {
                    const midTi = Math.floor(n / 2);
                    const band = allStacks[midTi]?.find((d) => d.key === s.key);
                    if (!band || band.y1 - band.y0 < 16) return null;
                    return (
                        <SvgText key={`lbl-${s.key}`} x={xPos(midTi)} y={(band.y0 + band.y1) / 2 + 4}
                            textAnchor="middle" fontSize={10} fontWeight="800" fill={THEME_COLORS.background}>
                            {s.label}
                        </SvgText>
                    );
                })
                }
                {/* X-axis labels */}
                <G transform={`translate(0, ${margin.top + iH})`}>
                    <SvgLine x1={margin.left} x2={width - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                    {displayedXLabels.map((lbl, i) => {
                        const idx = xLabels.indexOf(lbl);
                        return (
                            <G key={i} transform={`translate(${xPos(idx)}, 0)`}>
                                <SvgLine y2={10} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={25} fontSize={10} fontWeight="900" fill={THEME_COLORS.dark} textAnchor="middle">
                                    {lbl.toUpperCase()}
                                </SvgText>
                            </G>
                        );
                    })}
                </G>

            </Svg>
        </View>
    );
}

export default SunSortedStreamChart;