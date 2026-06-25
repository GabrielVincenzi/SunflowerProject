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
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ==================== Animated Bar ====================
function AnimatedBar({ x, width, color, value, yScale, chartHeight }: AnimatedBarProps) {
    const progress = useSharedValue(0);
    const xPos = useSharedValue(x);
    const [barLength, setBarLength] = useState(0);

    useEffect(() => {
        if (value == null || chartHeight == 0 || !yScale) return;
        const fullLength = chartHeight - yScale(value);
        setBarLength(fullLength);
        progress.value = 0;
        // Mechanical "Pop" Easing
        progress.value = withTiming(1, {
            duration: animationDuration,
            easing: Easing.bezier(0.16, 1, 0.3, 1)
        });
    }, [value, chartHeight, yScale]);

    useEffect(() => {
        xPos.value = withTiming(x, { duration: animationDuration });
    }, [x]);

    const animatedProps = useAnimatedProps(() => {
        const currentLength = barLength * progress.value;
        return {
            x: xPos.value,
            y: chartHeight - currentLength,
            height: currentLength,
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

// ==================== Chart ====================
function SunBarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const height = screenHeight ? screenHeight * 0.45 : HEIGHT;
    const geos = apiData.activeGeos || [];

    const [activeVariable, setActiveVariable] = useState<string | null>(null);

    const variables = useMemo(
        () => [...new Set(Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))],
        [apiData]
    );

    useEffect(() => {
        if (variables.length && !activeVariable) setActiveVariable(variables[0]);
    }, [variables]);

    const activeVarIndex = variables.findIndex(v => v === activeVariable);

    const chartData = useMemo(() => {
        const data = geos.map((geo) => ({
            geo,
            values: variables.map((variable, varIdx) => {
                const readable = apiData.variableLabels?.[variable] ?? variable;
                return {
                    variable,
                    label: readable,
                    value: apiData.series[`${variable}_${geo}`]?.[0]?.value ?? 0,
                    color: palette[varIdx % palette.length],
                };
            }),
        }));
        return data.sort((a, b) => (b.values[activeVarIndex]?.value ?? 0) - (a.values[activeVarIndex]?.value ?? 0));
    }, [variables, geos, apiData, palette, activeVarIndex]);

    const sortedGeos = chartData.map(d => d.geo);
    const legendItems = useMemo(() => variables.map((v, i) => ({
        label: apiData.variableLabels?.[v] ?? v,
        color: palette[i % palette.length],
        variable: v,
    })), [variables, apiData, palette]);

    const minBarWidth = 20;
    const totalBars = geos.length * variables.length;
    const svgWidth = Math.max(screenWidth * 0.9, totalBars * minBarWidth);

    const x0 = scaleBand<string>().domain(sortedGeos).range([margin.left, svgWidth - margin.right]).paddingInner(0.2);
    const x1 = scaleBand<string>().domain(variables).range([0, x0.bandwidth()]).padding(0.05);

    const yMax = max(chartData.flatMap(d => d.values.map(v => v.value))) || 0;
    const y = scaleLinear().domain([0, yMax]).nice().range([HEIGHT - margin.bottom, margin.top]);

    const yTicks = y.ticks(5);
    const { label: yUnitLabel } = detectScale(yMax);

    return (
        <View className="w-full bg-background">
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Industrial Grid Lines: Dashed and Rigid */}
                <Svg width={svgWidth} height={height}>
                    {yTicks.map((tick) => (
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

                    {/* X Axis: Heavy Brutalist Baseline */}
                    <G transform={`translate(0, ${HEIGHT - margin.bottom})`}>
                        <Line x1={margin.left} x2={svgWidth - margin.right} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {sortedGeos.map((geo) => (
                            <G key={geo} transform={`translate(${(x0(geo) ?? 0) + x0.bandwidth() / 2}, 0)`}>
                                <Line y2={8} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText y={25} fontSize={10} fill={THEME_COLORS.dark} textAnchor="middle" fontWeight="800" letterSpacing={0.5}>
                                    {geo.toUpperCase()}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Y Axis: Technical Readout Labels */}
                    <G transform={`translate(${margin.left}, 0)`}>
                        <Line y1={margin.top} y2={HEIGHT - margin.bottom} stroke={THEME_COLORS.dark} strokeWidth={2.5} />
                        {yTicks.map((tick) => (
                            <G key={tick} transform={`translate(0, ${y(tick)})`}>
                                <Line x2={-8} stroke={THEME_COLORS.dark} strokeWidth={2} />
                                <SvgText x={-12} dy="0.32em" fontSize={10} fill={THEME_COLORS.dark} opacity={0.4} textAnchor="end" fontWeight="800">
                                    {tick}
                                </SvgText>
                            </G>
                        ))}
                    </G>

                    {/* Bars Content */}
                    {chartData.map((group) => (
                        <G key={group.geo}>
                            {group.values.map((d) => (
                                <AnimatedBar
                                    key={`${group.geo}-${d.variable}`}
                                    x={(x0(group.geo) ?? 0) + (x1(d.variable) ?? 0)}
                                    width={x1.bandwidth() || minBarWidth}
                                    color={d.color}
                                    value={d.value}
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

export default SunBarChart;