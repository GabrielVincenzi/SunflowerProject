import { animationDuration, CHART_COLORS, HEIGHT, margin } from "@/constants/utilities";
import { detectGranularity, formatPeriod } from "@/functions/dateHandlers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, Path, PathProps, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Animated ribbon — identical to AnimatedLine with delay ───
function AnimatedRibbon({ d, fill, delay = 0 }: { d: string; fill: string; delay?: number }) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d) return;
        const timeout = setTimeout(() => {
            if (pathRef.current) {
                const length = pathRef.current.getTotalLength?.() ?? 0;
                if (length > 0) {
                    setPathLength(length);
                    progress.value = 0;
                    progress.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
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
        <AnimatedPath ref={pathRef} d={d} fill={fill} stroke="none"
            opacity={pathLength > 0 ? 0.88 : 0} animatedProps={animatedProps} />
    );
}

// ─── Helpers ──────────────────────────────────────────────────
function pickXTicks(labels: string[], count: number): string[] {
    if (!labels.length) return [];
    if (count >= labels.length) return labels;
    const result: string[] = [];
    const step = (labels.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) result.push(labels[Math.round(i * step)]);
    return Array.from(new Set(result));
}

// Cubic bezier ribbon between two time-adjacent bands
function ribbonPath(lx: number, ly0: number, ly1: number, rx: number, ry0: number, ry1: number): string {
    const mx = (lx + rx) / 2;
    return [`M ${lx} ${ly0}`, `C ${mx} ${ly0}, ${mx} ${ry0}, ${rx} ${ry0}`, `L ${rx} ${ry1}`, `C ${mx} ${ry1}, ${mx} ${ly1}, ${lx} ${ly1}`, "Z"].join(" ");
}

// ─── Component ────────────────────────────────────────────────
// At each time step, series are sorted descending by value → stacked top→bottom.
// Adjacent steps connected with bezier ribbons that cross when rankings change.
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

    // For each time point: sort descending by value, compute stacked y positions
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
            {/* Legend */}
            <ChartLegend items={legendItems} />

            {/* Chart Section */}
            <Svg width={width} height={height}>
                {/* Vertical grid lines */}
                {xLabels.map((_, i) => (
                    <SvgLine key={i} x1={xPos(i)} x2={xPos(i)} y1={margin.top} y2={margin.top + iH}
                        stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                ))}

                {/* Ribbons between consecutive time steps — staggered left to right */}
                {n > 1 && Array.from({ length: n - 1 }, (_, ti) =>
                    chartData.map((s) => {
                        const left = allStacks[ti].find((d) => d.key === s.key);
                        const right = allStacks[ti + 1].find((d) => d.key === s.key);
                        if (!left || !right) return null;
                        const d = ribbonPath(xPos(ti), left.y0, left.y1, xPos(ti + 1), right.y0, right.y1);
                        return <AnimatedRibbon key={`${s.key}-${ti}`} d={d} fill={s.color} delay={ti * 60} />;
                    })
                )}

                {/* End-cap rectangles */}
                {[0, n - 1].map((ti) =>
                    allStacks[ti]?.map((band, bi) => {
                        const s = chartData.find((s) => s.key === band.key);
                        if (!s) return null;
                        const x = ti === 0 ? xPos(0) - 6 : xPos(n - 1);
                        return (
                            <Path key={`cap-${ti}-${bi}`}
                                d={`M ${x} ${band.y0} L ${x + 6} ${band.y0} L ${x + 6} ${band.y1} L ${x} ${band.y1} Z`}
                                fill={s.color} opacity={0.88} />
                        );
                    })
                )}

                {/* White gap lines between streams at each time step */}
                {allStacks.map((stack, ti) =>
                    stack.slice(1).map((band, bi) => (
                        <SvgLine key={`gap-${ti}-${bi}`}
                            x1={xPos(ti) - 5} x2={xPos(ti) + 5}
                            y1={band.y0} y2={band.y0}
                            stroke="white" strokeWidth={2} />
                    ))
                )}

                {/* Inline series labels at mid time point */}
                {chartData.map((s) => {
                    const midTi = Math.floor(n / 2);
                    const band = allStacks[midTi]?.find((d) => d.key === s.key);
                    if (!band || band.y1 - band.y0 < 16) return null;
                    return (
                        <SvgText key={`lbl-${s.key}`} x={xPos(midTi)} y={(band.y0 + band.y1) / 2 + 4}
                            textAnchor="middle" fontSize={10} fontWeight="600" fill="white">
                            {s.label}
                        </SvgText>
                    );
                })}

                {/* X-axis labels */}
                <G transform={`translate(0, ${margin.top + iH + 4})`}>
                    {displayedXLabels.map((label, i) => {
                        const idx = xLabels.indexOf(label);
                        return (
                            <SvgText key={i} x={xPos(idx)} y={16} textAnchor="middle" fontSize={11} fill="grey">
                                {label}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}

export default SunSortedStreamChart;
