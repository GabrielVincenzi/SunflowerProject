import { animationDuration, CHART_COLORS, HEIGHT, margin, THEME_COLORS } from "@/constants/utilities";
import { detectScale } from "@/functions/formatHandlers";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";


const AnimatedRect = Animated.createAnimatedComponent(Rect);

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

    const segmentHeight = Math.abs(yScale(yEnd) - yScale(yStart));
    const finalY = yScale(yEnd);

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
        const offsetVal = chartHeight - (chartHeight - yScale(yStart)) - heightVal;
        return {
            x: xPos.value,
            y: offsetVal,
            height: heightVal,
        };
    });

    return (
        <AnimatedRect
            width={width}
            fill={color}
            stroke={THEME_COLORS.dark}
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

function SunStackedBarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const height = screenHeight ? screenHeight * 0.7 : HEIGHT;
    const geos = apiData.activeGeos || [];

    const variables = useMemo(
        () => [...new Set(Object.keys(apiData.series || {}).map((k: string) => k.replace(/_[A-Z]{2,3}$/, "")))],
        [apiData]
    );

    const chartData = useMemo(() => {
        return geos.map((geo: string) => {
            let total = 0;
            const segments = variables.map((variable: string, varIdx: number) => {
                const value = Math.max(0, apiData.series[`${variable}_${geo}`]?.[0]?.value ?? 0);
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

    const sortedGeos = chartData.map((d: any) => d.geo);

    const legendItems = useMemo(() => variables.map((v: string, i: number) => ({
        label: apiData.variableLabels?.[v] ?? v,
        color: palette[i % palette.length],
        variable: v,
    })), [variables, apiData, palette]);

    const minBarWidth = 44; // Thick visual columns
    const svgWidth = Math.max(screenWidth * 0.9, geos.length * minBarWidth + margin.left + margin.right);

    const x = scaleBand<string>().domain(sortedGeos).range([margin.left, svgWidth - margin.right]).padding(0.35);

    const yMax = max(chartData.map((d: any) => d.total)) || 0;
    const y = scaleLinear().domain([0, yMax]).nice().range([HEIGHT - margin.bottom, margin.top]);

    const yTicks = y.ticks(5);
    const { label: yUnitLabel } = detectScale(yMax);

    return (
        <View style={{ width: "100%", backgroundColor: THEME_COLORS.background }}>
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Svg width={svgWidth} height={height}>
                    {/* Industrial Grit Grid Lines */}
                    {yTicks.map((tick: number) => (
                        <Line
                            key={tick}
                            x1={margin.left}
                            x2={svgWidth - margin.right}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke={THEME_COLORS.dark}
                            strokeOpacity={0.08}
                            strokeDasharray="4,4"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Baseline */}
                    <G transform={`translate(0, ${HEIGHT - margin.bottom})`}>
                        <Line x1={margin.left} x2={svgWidth - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {sortedGeos.map((geo: string) => (
                            <G key={geo} transform={`translate(${(x(geo) ?? 0) + x.bandwidth() / 2}, 0)`}>
                                <Line y2={8} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={25} fontSize={10} fill={THEME_COLORS.dark} textAnchor="middle" fontWeight="800" letterSpacing={0.5}>
                                    {geo.toUpperCase()}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Left Technical Axis readout */}
                    <G transform={`translate(${margin.left}, 0)`}>
                        <Line y1={margin.top} y2={HEIGHT - margin.bottom} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {yTicks.map((tick: number) => (
                            <G key={tick} transform={`translate(0, ${y(tick)})`}>
                                <Line x2={-8} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText x={-12} dy="0.32em" fontSize={10} fill={THEME_COLORS.dark} opacity={0.4} textAnchor="end" fontWeight="800">
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
                                    chartHeight={HEIGHT - margin.bottom}
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