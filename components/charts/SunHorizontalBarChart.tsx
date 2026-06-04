import { animationDuration, CHART_COLORS, HEIGHT, margin, THEME_COLORS } from "@/constants/utilities";
import { detectScale } from "@/functions/formatHandlers";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo, useState } from "react";
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

interface HorizontalBarProps {
    y: number;
    height: number;
    color: string;
    value: number;
    xScale: (value: number) => number;
    axisStart: number;
}

function AnimatedHorizontalBar({ y, height, color, value, xScale, axisStart }: HorizontalBarProps) {
    const progress = useSharedValue(0);
    const yPos = useSharedValue(y);
    const [barLength, setBarLength] = useState(0);

    useEffect(() => {
        if (value == null || !xScale) return;
        const fullLength = xScale(value) - axisStart;
        setBarLength(fullLength);
        progress.value = 0;
        progress.value = withTiming(1, {
            duration: animationDuration,
            easing: Easing.bezier(0.16, 1, 0.3, 1)
        });
    }, [value, xScale, axisStart]);

    useEffect(() => {
        yPos.value = withTiming(y, { duration: animationDuration });
    }, [y]);

    const animatedProps = useAnimatedProps(() => {
        const currentLength = barLength * progress.value;
        return {
            y: yPos.value,
            width: currentLength,
        };
    });

    return (
        <AnimatedRect
            x={axisStart}
            height={height}
            fill={color}
            stroke={THEME_COLORS.dark}
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

function SunHorizontalBarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;

    // Custom margin offsets to accommodate larger uppercase geo labels cleanly on the left
    const leftMargin = 72;
    const chartHeight = screenHeight ? screenHeight * 0.45 : HEIGHT;
    const geos = apiData.activeGeos || [];

    const [activeVariable, setActiveVariable] = useState<string | null>(null);

    const variables = useMemo(
        () => [...new Set(Object.keys(apiData.series || {}).map((k: string) => k.replace(/_[A-Z]{2,3}$/, "")))],
        [apiData]
    );

    useEffect(() => {
        if (variables.length && !activeVariable) setActiveVariable(variables[0]);
    }, [variables]);

    const activeVarIndex = variables.findIndex((v: string) => v === activeVariable);

    const chartData = useMemo(() => {
        const data = geos.map((geo: string) => ({
            geo,
            values: variables.map((variable: string, varIdx: number) => {
                const readable = apiData.variableLabels?.[variable] ?? variable;
                return {
                    variable,
                    label: readable,
                    value: apiData.series[`${variable}_${geo}`]?.[0]?.value ?? 0,
                    color: palette[varIdx % palette.length],
                };
            }),
        }));
        return data.sort((a: any, b: any) => (b.values[activeVarIndex]?.value ?? 0) - (a.values[activeVarIndex]?.value ?? 0));
    }, [variables, geos, apiData, palette, activeVarIndex]);

    const sortedGeos = chartData.map((d: any) => d.geo);

    const legendItems = useMemo(() => variables.map((v: string, i: number) => ({
        label: apiData.variableLabels?.[v] ?? v,
        color: palette[i % palette.length],
        variable: v,
    })), [variables, apiData, palette]);

    const minRowHeight = 36;
    const totalBarsCount = geos.length * variables.length;
    const dynamicSvgHeight = Math.max(chartHeight, totalBarsCount * minRowHeight + margin.top + margin.bottom);

    const y0 = scaleBand<string>().domain(sortedGeos).range([margin.top, dynamicSvgHeight - margin.bottom]).paddingInner(0.2);
    const y1 = scaleBand<string>().domain(variables).range([0, y0.bandwidth()]).padding(0.05);

    const xMax = max(chartData.flatMap((d: any) => d.values.map((v: any) => v.value))) || 0;
    const x = scaleLinear().domain([0, xMax]).nice().range([leftMargin, screenWidth - margin.right]);

    const xTicks = x.ticks(5);
    const { label: xUnitLabel } = detectScale(xMax);

    return (
        <View style={{ width: "100%", backgroundColor: THEME_COLORS.background }}>
            <ChartLegend items={legendItems} yUnitLabel={xUnitLabel} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Svg width={screenWidth} height={dynamicSvgHeight}>
                    {/* Grid Lines projecting from X coordinate ticks */}
                    {xTicks.map((tick: number) => (
                        <Line
                            key={tick}
                            x1={x(tick)}
                            x2={x(tick)}
                            y1={margin.top}
                            y2={dynamicSvgHeight - margin.bottom}
                            stroke={THEME_COLORS.dark}
                            strokeOpacity={0.08}
                            strokeDasharray="4,4"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Y Axis Baseline containing high-touch labels */}
                    <G transform={`translate(0, 0)`}>
                        <Line x1={leftMargin} x2={leftMargin} y1={margin.top} y2={dynamicSvgHeight - margin.bottom} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {sortedGeos.map((geo: string) => (
                            <G key={geo} transform={`translate(0, ${(y0(geo) ?? 0) + y0.bandwidth() / 2})`}>
                                <Line x1={leftMargin - 6} x2={leftMargin} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText x={leftMargin - 12} dy="0.32em" fontSize={10} fill={THEME_COLORS.dark} textAnchor="end" fontWeight="800" letterSpacing={0.5}>
                                    {geo.toUpperCase()}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Bottom X-Axis line */}
                    <G transform={`translate(0, ${dynamicSvgHeight - margin.bottom})`}>
                        <Line x1={leftMargin} x2={screenWidth - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {xTicks.map((tick: number) => (
                            <G key={tick} transform={`translate(${x(tick)}, 0)`}>
                                <Line y1={0} y2={8} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={22} fontSize={10} fill={THEME_COLORS.dark} opacity={0.4} textAnchor="middle" fontWeight="800">
                                    {tick}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Rendered Animated Horizontal Bars */}
                    {chartData.map((group: any) => (
                        <G key={group.geo}>
                            {group.values.map((d: any) => (
                                <AnimatedHorizontalBar
                                    key={`${group.geo}-${d.variable}`}
                                    y={(y0(group.geo) ?? 0) + (y1(d.variable) ?? 0)}
                                    height={y1.bandwidth() || 20}
                                    color={d.color}
                                    value={d.value}
                                    xScale={x}
                                    axisStart={leftMargin}
                                />
                            ))}
                        </G>
                    ))}
                </Svg>
            </ScrollView>
        </View>
    );
}

export default SunHorizontalBarChart;