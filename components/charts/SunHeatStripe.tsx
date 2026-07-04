import { animationDuration, CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
import { parsePeriod } from "@/functions/dateHandlers";
import { max, min } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    ClipPath,
    Defs,
    G,
    LinearGradient,
    Rect,
    Stop,
    Line as SvgLine,
    Text as SvgText,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function pickXTicks(labels: string[] = [], count = 6) {
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

// ─── Row reveal ─────────────────────────────────────────────────
// Each stripe row sweeps in left-to-right behind a clip mask, the
// same "signal drawing itself" idea as the line chart's path draw —
// just expressed as a wipe instead of a stroke. Rows cascade in with
// an 80ms stagger, matching the marker-stagger convention used on
// SunLineChart's end-of-line dots.
function RowReveal({
    rowIndex,
    width,
    height,
    children,
}: {
    rowIndex: number;
    width: number;
    height: number;
    children: React.ReactNode;
}) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            rowIndex * 80,
            withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) })
        );
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        width: Math.max(0, width * progress.value),
    }));

    const clipId = `heat-clip-${rowIndex}`;

    return (
        <>
            <Defs>
                <ClipPath id={clipId}>
                    <AnimatedRect x={0} y={0} height={height} animatedProps={animatedProps} />
                </ClipPath>
            </Defs>
            <G clipPath={`url(#${clipId})`}>{children}</G>
        </>
    );
}

function SunHeatStripe({
    screenWidth,
    apiData,
    rowGap = 6,
    xTickCount = 6,
    maxHeight = 260,
    maxRowHeigth = 100,
    colorRange,
}: {
    screenWidth: number;
    apiData: ApiResponse;
    maxRowHeigth?: number;
    maxHeight?: number;
    rowGap?: number;
    xTickCount?: number;
    colorRange?: [string, string];
}) {
    const hasData =
        apiData &&
        Array.isArray(apiData.activeGeos) &&
        apiData.activeGeos.length > 0 &&
        apiData.series &&
        Object.keys(apiData.series).length > 0;

    if (!hasData) {
        return (
            <View style={{ padding: 12 }}>
                <Text style={{ color: THEME_COLORS.grey, fontStyle: "italic", fontSize: 11 }}>No data available</Text>
            </View>
        );
    }

    const chartData = useMemo(() => {
        const seriesKeys = Object.keys(apiData.series || {});
        const geos = apiData.activeGeos || [];

        if (geos.length > 1) {
            return geos.map((geo) => {
                const key = seriesKeys.find((k) => k.endsWith(`_${geo}`));
                const values = key && apiData.series?.[key] ? apiData.series[key].map((pt) => (pt?.value ?? null)) : [];
                return { geo, key: key ?? `${geo}`, values };
            });
        } else {
            const geo = geos[0];
            const variableKeys = seriesKeys.filter((k) => k.endsWith(`_${geo}`));
            if (variableKeys.length <= 1) {
                const key = variableKeys[0] ?? seriesKeys[0];
                const values = apiData.series?.[key]?.map((pt) => (pt?.value ?? null)) ?? [];
                return [{ geo, key, values }];
            } else {
                // Legacy: multiple variables for same geo -> create a row per key (not expected, but safe)
                return variableKeys.map((key) => {
                    const idx = key.lastIndexOf("_");
                    const geoLabel = idx > 0 ? key.slice(idx + 1) : geo;
                    const values = apiData.series?.[key]?.map((pt) => (pt?.value ?? null)) ?? [];
                    return { geo: geoLabel, key, values };
                });
            }
        }
    }, [apiData]);

    // Align with activePeriods -> x labels
    const periods = apiData.activePeriods || [];
    const xLabels = periods.map((p) => {
        const date = p ? parsePeriod(p) : null;
        return date && !isNaN(date.getTime()) ? date.getFullYear().toString() : String(p ?? "");
    });

    // Normalize rows so each has values aligned to periods length
    const normalizedchartData = chartData.map((r) => {
        const values = periods.map((_, i) => (r.values?.[i] !== undefined ? r.values[i] : null));
        return { ...r, values };
    });

    // compute global min/max across all rows (excluding nulls) and ensure numbers
    const allNumeric = normalizedchartData.flatMap((r) =>
        r.values.filter((v) => v !== null && v !== undefined)
    ) as number[];

    const vMin = (min(allNumeric) ?? 0) as number;
    const vMax = (max(allNumeric) ?? 0) as number;

    // sequential color scale strictly from vMin -> vMax
    const palette = apiData?.palette ?? CHART_COLORS;
    const lowColor = colorRange?.[0] ?? palette[0];
    const highColor = colorRange?.[1] ?? palette[palette.length - 1];

    // If domain is degenerate (vMin === vMax), fall back to a neutral
    // constant fill rather than a hardcoded hex.
    const colorScaleFn = useMemo(() => {
        if (vMin === vMax) {
            return (v: number | null) => (v === null || v === undefined ? THEME_COLORS.light : THEME_COLORS.subtle);
        }
        const s = scaleLinear<string>().domain([vMin, vMax]).range([lowColor, highColor]).clamp(true);
        return (v: number | null) => (v === null || v === undefined ? THEME_COLORS.light : s(v as number));
    }, [vMin, vMax, lowColor, highColor]);

    // layout — unchanged from original, positions must stay put
    const width = screenWidth;
    const rowsCount = normalizedchartData.length;
    const totalGaps = Math.max(0, rowsCount - 1) * rowGap;
    const heightPerRow = Math.min(maxRowHeigth, (maxHeight - totalGaps - margin.top - margin.bottom) / rowsCount);

    const stripesAreaHeight = rowsCount * heightPerRow + totalGaps;
    const chartHeight = margin.top + stripesAreaHeight + margin.bottom + 48;

    const xScale = scaleBand<string>()
        .domain(xLabels)
        .range([margin.left, width - margin.right])
        .paddingInner(0)
        .paddingOuter(0);

    const barWidth = xScale.bandwidth() || Math.max(1, (width - margin.left - margin.right) / Math.max(1, xLabels.length));
    const tileWidth = Math.max(barWidth - 1, barWidth * 0.85); // hairline gutter between tiles
    const displayedXLabels = pickXTicks(xLabels, xTickCount);
    const stripesWidth = width - margin.right - margin.left;

    // helper: small number formatting
    const formatSmall = (n: number) => {
        if (!isFinite(n)) return "-";
        if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
        if (Math.abs(n - Math.round(n)) < 1e-6) return `${n}`;
        return `${n.toFixed(2)}`;
    };

    return (
        <View className="w-full">
            <Svg width={width} height={chartHeight}>
                {/* gradient for colorbar (decorative) */}
                <Defs>
                    <LinearGradient id="grad" x1="0%" x2="100%" y1="0%" y2="0%">
                        <Stop offset="0%" stopColor={lowColor} />
                        <Stop offset="100%" stopColor={highColor} />
                    </LinearGradient>
                </Defs>

                {/* Rows */}
                {normalizedchartData.map((row, rIdx) => {
                    const yOffset = margin.top + rIdx * heightPerRow + Math.max(0, rIdx) * rowGap;
                    const stripeHeight = heightPerRow;
                    const labelX = 8;
                    const stripesXOffset = margin.left / 8;

                    return (
                        <G key={`row-${row.key}-${rIdx}`} transform={`translate(0, ${yOffset})`}>
                            {/* geo label — muted supporting text, same voice as every other in-chart label */}
                            <SvgText
                                x={labelX}
                                y={stripeHeight / 2}
                                dy="0.35em"
                                fontSize={11}
                                fill={THEME_COLORS.grey}
                                fontStyle="italic"
                            >
                                {row.geo}
                            </SvgText>

                            {/* stripe tiles — sweep in left-to-right behind a clip mask */}
                            <G transform={`translate(${stripesXOffset}, 0)`}>
                                <RowReveal rowIndex={rIdx} width={stripesWidth} height={stripeHeight}>
                                    {row.values.map((val, i) => {
                                        const x = xScale(xLabels[i]) ?? i * barWidth;
                                        const fill = colorScaleFn(val);
                                        return (
                                            <Rect
                                                key={`rect-${rIdx}-${i}`}
                                                x={x}
                                                y={0}
                                                width={tileWidth}
                                                height={stripeHeight}
                                                fill={fill}
                                            />
                                        );
                                    })}
                                </RowReveal>
                            </G>
                        </G>
                    );
                })}

                {/* x-axis: single hairline, no tick marks, italic muted labels */}
                <G transform={`translate(0, ${margin.top + stripesAreaHeight + 4})`}>
                    <SvgLine
                        x1={margin.left}
                        x2={width - margin.right}
                        y1={0}
                        y2={0}
                        stroke={`${THEME_COLORS.dark}24`}
                        strokeWidth={1}
                    />
                    {displayedXLabels.map((lbl, i) => {
                        const xCenter = (xScale(lbl) ?? margin.left) + barWidth / 2;
                        return (
                            <SvgText
                                key={`xt-${i}`}
                                x={xCenter}
                                y={22}
                                fontSize={11}
                                fill={THEME_COLORS.grey}
                                textAnchor="middle"
                                fontStyle="italic"
                            >
                                {lbl}
                            </SvgText>
                        );
                    })}
                </G>

                {/* color scale — thin gradient bar with min/max readout */}
                <G transform={`translate(${margin.left}, ${margin.top + stripesAreaHeight + 60})`}>
                    <Rect
                        x={0}
                        y={0}
                        width={Math.max(120, Math.min(240, width - margin.left - margin.right - 40))}
                        height={6}
                        rx={3}
                        fill="url(#grad)"
                    />
                    <SvgText x={0} y={22} fontSize={11} fill={THEME_COLORS.grey} textAnchor="start" fontStyle="italic">
                        {formatSmall(Math.floor(vMin))}
                    </SvgText>
                    <SvgText
                        x={Math.max(120, Math.min(240, width - margin.left - margin.right - 40))}
                        y={22}
                        fontSize={11}
                        fill={THEME_COLORS.grey}
                        textAnchor="end"
                        fontStyle="italic"
                    >
                        {formatSmall(Math.ceil(vMax))}
                    </SvgText>
                </G>
            </Svg>
        </View>
    );
}

export default SunHeatStripe;