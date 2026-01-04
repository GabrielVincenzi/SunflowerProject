import { animationDuration, colors, margin } from "@/constants/utilities";
import { detectGranularity, formatPeriod } from "@/functions/dateHandlers";
import { max } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { area as d3area, stack as d3stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, Path, Line as SvgLine, Text as SvgText } from "react-native-svg";

// Wrap Path in Animated
const AnimatedPath = Animated.createAnimatedComponent(Path);

// helpers (copied/adapted from your line chart)
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

// Animated area component (measures path length and animates stroke dash + opacity)
type AnimatedAreaProps = {
    d: string;
    fill: string;
    stroke: string;
    startDelay?: number;
};

function AnimatedArea({ d, fill, stroke, startDelay = 0 }: AnimatedAreaProps) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d) return;
        // measure after mount/update
        const timeout = setTimeout(() => {
            const length = pathRef.current?.getTotalLength?.() ?? 0;
            setPathLength(length);
            progress.value = 0;
            progress.value = withDelay(
                startDelay,
                withTiming(1, { duration: animationDuration, easing: Easing.inOut(Easing.ease) })
            );
        }, 0);

        return () => clearTimeout(timeout);
    }, [d]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
        opacity: progress.value,
    }));

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={2}
            animatedProps={animatedProps}
            opacity={pathLength > 0 ? 1 : 0}
        />
    );
}


function SunAreaChart({
    screenWidth,
    apiData,
    xTickCount = 6,
    yTickCount = 6,
    height = 260,
}: any) {
    const safeColors = colors || ["#000000"];

    const hasData =
        apiData &&
        Array.isArray(apiData.activeGeos) &&
        apiData.activeGeos.length > 0 &&
        apiData.series &&
        Object.keys(apiData.series).length > 0;

    // Build flat stacked data similar to what you had, but following the line chart logic for labels
    const flatData: Record<string, number | string>[] = [];

    const granularity = useMemo(() => {
        return hasData ? detectGranularity(apiData.activePeriods.map((p: any) => new Date(p))) : undefined;
    }, [hasData ? apiData.activePeriods.join(",") : ""]);

    if (hasData) {
        if (apiData.activeGeos.length > 1) {
            // multiple geos → each geo becomes a key (one stacked series per geo)
            apiData.activePeriods?.forEach((period: string, i: number) => {
                const date = new Date(period);
                const label = granularity ? formatPeriod(date, granularity) : String(period);
                const entry: Record<string, number | string> = { label };
                apiData.activeGeos.forEach((geo: string) => {
                    const key = Object.keys(apiData.series).find((k) => k.endsWith(`_${geo}`));
                    entry[geo] = key && apiData.series[key]?.[i]?.value != null ? apiData.series[key][i].value : 0;
                });
                flatData.push(entry);
            });
        } else {
            // single geo → each variable becomes a key
            const geo = apiData.activeGeos[0];
            const variableKeys = Object.keys(apiData.series).filter((k) => k.endsWith(`_${geo}`));
            apiData.activePeriods?.forEach((period: string, i: number) => {
                const date = new Date(period);
                const label = granularity ? formatPeriod(date, granularity) : date.getFullYear().toString();
                const entry: Record<string, number | string> = { label };
                variableKeys.forEach((key) => {
                    const variableName = key.replace(`_${geo}`, "");
                    entry[variableName] = apiData.series[key]?.[i]?.value ?? 0;
                });
                flatData.push(entry);
            });
        }
    }

    const keys = flatData.length > 0 ? Object.keys(flatData[0]).filter((k) => k !== "label") : [];

    // gather x labels, stacked sums and y max
    const xLabels = Array.from(new Set(flatData.map((d) => d.label as string)));
    // ensure stable ordering: try to sort by year/quarter if possible (similar to SunLineChart)
    const sortedXLabels = xLabels.slice().sort((a, b) => {
        const parse = (s: string) => {
            // attempt to parse "YYYYQn" or "YYYY"
            const qIdx = s.indexOf("Q");
            if (qIdx >= 0) {
                const y = Number(s.slice(0, qIdx));
                const q = Number(s.slice(qIdx + 1));
                return y * 10 + q;
            }
            // fallback: number parse or lexicographic
            const maybeYear = Number(s);
            if (!Number.isNaN(maybeYear)) return maybeYear * 10;
            return s.localeCompare("") === 0 ? 0 : s.length; // stable fallback
        };
        return parse(a) - parse(b);
    });

    const stackedSums = flatData.map((d) => keys.reduce((sum, k) => sum + ((d[k] as number) || 0), 0));
    const yMax = max(stackedSums) ?? 0;
    const width = screenWidth;

    // detect scale for Y axis labels (Thousands / Millions)
    const maxAbs = yMax;
    const { factor: yFactor, label: yUnitLabel } = detectScale(maxAbs);

    // memoized scales + stack + area generator
    const { xScale, yScale, stackedSeries, areaGenerator } = useMemo(() => {
        const x = scalePoint<string>()
            .domain(sortedXLabels)
            .range([margin.left, width - margin.right]);

        const y = scaleLinear()
            .domain([0, yMax])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const stackGen = d3stack<Record<string, number | string>>()
            .keys(keys)
            .order(stackOrderNone)
            .offset(stackOffsetNone);

        const stacks = stackGen(flatData as any);

        const areaGen = d3area<any>()
            .x((d: any) => x(d.data.label as string)!)
            .y0((d: any) => y(d[0]))
            .y1((d: any) => y(d[1]));

        return { xScale: x, yScale: y, stackedSeries: stacks, areaGenerator: areaGen };
    }, [width, height, sortedXLabels.join(","), yMax, keys.join(",")]);

    // compute Y ticks (raw values) and formatted labels
    const rawYTicks = yScale.ticks(yTickCount);
    const formattedYTicks = rawYTicks.map((t) => formatScaled(t, yFactor));

    // which x labels to show
    const displayedXLabels = pickXTicks(sortedXLabels, xTickCount);

    return (
        <View className="w-full bg-background">
            {/* Legend */}
            <View className="items-center">
                <View className="flex-row flex-wrap justify-center mt-1">
                    {keys.map((key, idx) => (
                        <View key={key} className="flex-row items-center m-2" style={{ gap: 6 }}>
                            <View
                                style={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: safeColors[idx % safeColors.length],
                                    borderRadius: 2,
                                    marginRight: 6,
                                }}
                            />
                            <Text style={{ fontSize: 12, color: "grey" }}>{key}</Text>
                        </View>
                    ))}
                </View>
                {yUnitLabel ? (
                    <Text style={{ fontSize: 12, color: "grey", marginTop: 4 }}>({yUnitLabel})</Text>
                ) : null}
            </View>

            {/* Chart area */}
            <View>
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

                    {/* Animated stacked areas */}
                    {stackedSeries.map((series: any, idx: number) => (
                        <AnimatedArea
                            key={series.key}
                            d={areaGenerator(series) ?? ""}
                            fill={safeColors[idx % safeColors.length]}
                            stroke={safeColors[idx % safeColors.length]}
                            startDelay={idx * 150}
                        />
                    ))}
                </Svg>
            </View>
        </View>
    );
}

export default SunAreaChart;