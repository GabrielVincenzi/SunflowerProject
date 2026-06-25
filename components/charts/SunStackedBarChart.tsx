import { animationDuration, CHART_COLORS, HEIGHT, margin, THEME_COLORS } from "@/constants/utilities";
import { detectScale } from "@/functions/formatHandlers";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Safer base defaults for imported constants to insulate against partial environments
const DEFAULT_MARGIN = { top: 40, right: 20, bottom: 65, left: 50 };
const DEFAULT_HEIGHT = 450;

interface StackedSegmentProps {
    x: number;
    width: number;
    color: string;
    yStart: number;
    yEnd: number;
    yScale: (value: number) => number;
    chartHeight: number;
}

function AnimatedSegment({ x, width, color, yStart, yEnd, yScale, chartHeight }: StackedSegmentProps) {
    const progress = useSharedValue(0);
    const xPos = useSharedValue(x);

    const startY = yScale(yStart) ?? 0;
    const endY = yScale(yEnd) ?? 0;
    const segmentHeight = Math.max(0, Math.abs(endY - startY));

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, {
            duration: animationDuration,
            easing: Easing.bezier(0.16, 1, 0.3, 1)
        });
    }, [yStart, yEnd]);

    useEffect(() => {
        xPos.value = withTiming(x, { duration: animationDuration });
    }, [x]);

    const animatedProps = useAnimatedProps(() => {
        const heightVal = segmentHeight * progress.value;
        const offsetVal = chartHeight - (chartHeight - startY) - heightVal;
        return {
            x: xPos.value,
            y: isNaN(offsetVal) ? 0 : offsetVal,
            height: isNaN(heightVal) ? 0 : heightVal,
        };
    });

    return (
        <AnimatedRect
            width={Math.max(0, width)}
            fill={color}
            stroke={THEME_COLORS?.dark || "#141414"}
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}


function SunStackedBarChart({ screenWidth, screenHeight, apiData, }: ChartProps) {
    const palette = apiData?.palette || CHART_COLORS;

    // Safety constants resolution
    const safeMargin = typeof margin !== 'undefined' ? margin : DEFAULT_MARGIN;
    const safeHeight = screenHeight ? screenHeight * 0.7 : (typeof HEIGHT !== 'undefined' ? HEIGHT : DEFAULT_HEIGHT);
    const deviceWidth = screenWidth ?? Dimensions.get('window').width;

    const geos = apiData?.activeGeos || [];

    // Safely extract variables. Even if there is only 1 variable per geo, this functions correctly.
    const variables = useMemo(() => {
        if (!apiData || !apiData.series) return [];
        const keys = Object.keys(apiData.series);
        if (keys.length === 0) return [];

        const patterns = keys.map((k: string) => {
            const parts = k.split("_");
            if (parts.length > 1) {
                return parts.slice(0, -1).join("_");
            }
            return k;
        });
        const uniq = [...new Set(patterns)];
        return uniq.length > 0 ? uniq : ["Value"];
    }, [apiData]);

    const chartData = useMemo(() => {
        if (geos.length === 0) return [];
        return geos.map((geo: string) => {
            let total = 0;
            const segments = variables.map((variable: string, varIdx: number) => {
                let rawVal = 0;
                if (apiData.series[`${variable}_${geo}`]) {
                    rawVal = apiData.series[`${variable}_${geo}`]?.[0]?.value ?? 0;
                } else if (apiData.series[`${geo}`]) {
                    rawVal = apiData.series[`${geo}`]?.[0]?.value ?? 0;
                } else if (apiData.series[`${variable}`]) {
                    rawVal = apiData.series[`${variable}`]?.[0]?.value ?? 0;
                }

                const value = Math.max(0, rawVal);
                const y0 = total;
                total += value;
                const y1 = total;
                return {
                    variable,
                    value,
                    y0,
                    y1,
                    color: palette[varIdx % palette.length],
                };
            });
            return { geo, segments, total };
        }).sort((a: any, b: any) => b.total - a.total);
    }, [variables, geos, apiData, palette]);

    const sortedGeos = useMemo(() => chartData.map((d: any) => d.geo), [chartData]);

    const legendItems = useMemo(() => variables.map((v: string, i: number) => ({
        label: apiData?.variableLabels?.[v] ?? v,
        color: palette[i % palette.length],
        variable: v,
    })), [variables, apiData, palette]);

    const minBarWidth = 44;
    const svgWidth = Math.max(deviceWidth * 0.9, geos.length * minBarWidth + safeMargin.left + safeMargin.right);

    const x = useMemo(() => {
        return scaleBand<string>()
            .domain(sortedGeos)
            .range([safeMargin.left, svgWidth - safeMargin.right])
            .padding(0.35);
    }, [sortedGeos, svgWidth, safeMargin]);

    const yMax = useMemo(() => {
        if (chartData.length === 0) return 100;
        return max(chartData.map((d: any) => d.total)) || 100;
    }, [chartData]);

    const y = useMemo(() => {
        return scaleLinear()
            .domain([0, yMax || 1])
            .nice()
            .range([safeHeight - safeMargin.bottom, safeMargin.top]);
    }, [yMax, safeHeight, safeMargin]);

    const yTicks = useMemo(() => {
        return y.ticks ? y.ticks(5) : [0, 20, 40, 60, 80, 100];
    }, [y]);

    const yUnitLabel = useMemo(() => {
        if (typeof detectScale === 'function') {
            return detectScale(yMax)?.label || "";
        }
        return "";
    }, [yMax]);

    if (geos.length === 0 || variables.length === 0) {
        return <View style={{ width: "100%", height: 100 }} />;
    }

    return (
        <View style={{ width: "100%", backgroundColor: THEME_COLORS?.background || "#FFF" }}>
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Svg width={svgWidth} height={safeHeight}>
                    {/* Industrial Grit Grid Lines */}
                    {yTicks.map((tick: number) => (
                        <Line
                            key={tick}
                            x1={safeMargin.left}
                            x2={svgWidth - safeMargin.right}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke={THEME_COLORS?.dark || "#141414"}
                            strokeOpacity={0.08}
                            strokeDasharray="4,4"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Baseline */}
                    <G transform={`translate(0, ${safeHeight - safeMargin.bottom})`}>
                        <Line x1={safeMargin.left} x2={svgWidth - safeMargin.right} stroke={THEME_COLORS?.dark || "#141414"} strokeWidth={2.5} />
                        {sortedGeos.map((geo: string) => (
                            <G key={geo} transform={`translate(${(x(geo) ?? 0) + x.bandwidth() / 2}, 0)`}>
                                <Line y2={8} stroke={THEME_COLORS?.dark || "#141414"} strokeWidth={2} />
                                <SvgText y={25} fontSize={10} fill={THEME_COLORS?.dark || "#141414"} textAnchor="middle" fontWeight="800" letterSpacing={0.5}>
                                    {geo.toUpperCase()}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Left Technical Axis readout */}
                    <G transform={`translate(${safeMargin.left}, 0)`}>
                        <Line y1={safeMargin.top} y2={safeHeight - safeMargin.bottom} stroke={THEME_COLORS?.dark || "#141414"} strokeWidth={2.5} />
                        {yTicks.map((tick: number) => (
                            <G key={tick} transform={`translate(0, ${y(tick)})`}>
                                <Line x2={-8} stroke={THEME_COLORS?.dark || "#141414"} strokeWidth={2} />
                                <SvgText x={-12} dy="0.32em" fontSize={10} fill={THEME_COLORS?.dark || "#141414"} opacity={0.4} textAnchor="end" fontWeight="800">
                                    {tick}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Segment render stacks */}
                    {chartData.map((group: any) => (
                        <G key={group.geo}>
                            {group.segments.map((s: any) => (
                                <AnimatedSegment
                                    key={`${group.geo}-${s.variable}`}
                                    x={x(group.geo) ?? 0}
                                    width={x.bandwidth() || minBarWidth}
                                    color={s.color}
                                    yStart={s.y0}
                                    yEnd={s.y1}
                                    yScale={y}
                                    chartHeight={safeHeight - safeMargin.bottom}
                                />
                            ))}
                        </G>
                    ))}
                </Svg>
            </ScrollView>
        </View>
    );
}

export default SunStackedBarChart;