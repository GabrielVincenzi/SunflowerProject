import { CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
import { parsePeriod } from "@/functions/dateHandlers";
import { max, min } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, {
    Defs,
    G,
    LinearGradient,
    Rect,
    Stop,
    Line as SvgLine,
    Text as SvgText,
} from "react-native-svg";

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
                <Text style={{ color: "grey" }}>No data available</Text>
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

    // If domain is degenerate (vMin === vMax), use a constant color function to avoid scale issues
    const colorScaleFn = useMemo(() => {
        if (vMin === vMax) {
            // if there is no numeric data at all (both 0), still show same neutral color
            const constColor = "#efefef";
            return (v: number | null) => (v === null || v === undefined ? "#efefef" : constColor);
        }
        const s = scaleLinear<string>().domain([vMin, vMax]).range([lowColor, highColor]).clamp(true);
        return (v: number | null) => (v === null || v === undefined ? "#efefef" : s(v as number));
    }, [vMin, vMax, lowColor, highColor]);

    // layout
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
    const displayedXLabels = pickXTicks(xLabels, xTickCount);

    // helper: small number formatting
    const formatSmall = (n: number) => {
        if (!isFinite(n)) return "-";
        if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
        if (Math.abs(n - Math.round(n)) < 1e-6) return `${n}`;
        return `${n.toFixed(2)}`;
    };

    return (
        <View>
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
                    // compute y offset for this row (account for previous rows + gaps)
                    const yOffset =
                        margin.top +
                        rIdx * heightPerRow +
                        Math.max(0, rIdx) * rowGap; // each row after first adds rowGap

                    const stripeHeight = heightPerRow; // keep stripe height = heightPerRow
                    const labelX = 8; // left label x pos
                    const stripesXOffset = margin.left / 8;

                    return (
                        <G key={`row-${row.key}-${rIdx}`} transform={`translate(0, ${yOffset})`}>
                            {/* geo label (left) */}
                            <SvgText x={labelX} y={stripeHeight / 2} dy="0.35em" fontSize={12} fill={THEME_COLORS.dark} fontWeight="800">
                                {row.geo}
                            </SvgText>

                            {/* stripe tiles */}
                            <G transform={`translate(${stripesXOffset}, 0)`}>
                                {row.values.map((val, i) => {
                                    const x = xScale(xLabels[i]) ?? i * barWidth;
                                    const fill = colorScaleFn(val);
                                    return <Rect key={`rect-${rIdx}-${i}`} x={x} y={0} width={barWidth} height={stripeHeight} fill={fill} />;
                                })}
                            </G>
                        </G>
                    );
                })}

                {/* X axis ticks beneath rows */}
                <G transform={`translate(0, ${margin.top + stripesAreaHeight + 4})`}>
                    {displayedXLabels.map((lbl, i) => {
                        const xCenter = (xScale(lbl) ?? margin.left) + barWidth / 2;
                        return (
                            <G key={`xt-${i}`} transform={`translate(${xCenter}, 0)`}>
                                <SvgLine y2={10} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={30} fontSize={10} fill={THEME_COLORS.dark} textAnchor="middle" fontWeight="800">
                                    {lbl}
                                </SvgText>
                            </G>
                        );
                    })}
                    <SvgLine x1={margin.left} x2={width - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                </G>

                {/* small gradient colorbar */}
                <G transform={`translate(${margin.left}, ${margin.top + stripesAreaHeight + 60})`}>
                    <Rect
                        x={0}
                        y={0}
                        width={Math.max(120, Math.min(240, width - margin.left - margin.right - 40))}
                        height={8}
                        fill="url(#grad)"
                    />
                    <SvgText x={0} y={20} fontSize={10} fill={THEME_COLORS.dark} textAnchor="start" fontWeight="800">
                        {formatSmall(Math.floor(vMin))}
                    </SvgText>
                    <SvgText
                        x={Math.max(120, Math.min(240, width - margin.left - margin.right - 40))}
                        y={20}
                        fontSize={10}
                        fill={THEME_COLORS.dark}
                        textAnchor="end"
                        fontWeight="800"
                    >
                        {formatSmall(Math.ceil(vMax))}
                    </SvgText>
                </G>
            </Svg>
        </View>
    );
}

export default SunHeatStripe;

