import { animationDuration, CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
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
import Svg, { G, Rect, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const absN = Math.abs(n);
    const maxFractionDigits = absN < 10 ? 2 : absN < 100 ? 1 : 0;
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
    }).format(Number(n.toFixed(maxFractionDigits)));
}

interface HorizontalBarProps {
    y: number;
    height: number;
    color: string;
    value: number;
    xScale: (value: number) => number;
    axisStart: number;
}

// No border, no heavy stroke — matches AnimatedBar in SunBarChart,
// just growing rightward instead of upward.
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
            animatedProps={animatedProps}
        />
    );
}

// ─── SunHorizontalBarChart ──────────────────────────────────────
// Full-width, card-free, same SunChartProps contract as every other
// chart type. The value axis runs horizontally here, so yDomainOverride
// (yMin/yMax) maps onto that horizontal value scale — same shape,
// same .nice()-skip invariant, just rotated 90°.
function SunHorizontalBarChart({
    screenWidth,
    apiData,
    xTickCount,
    yTickCount = 5,
    height = 280,
    yDomainOverride,
}: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;

    // Extra left room for geo labels — analogous to margin.left, just wider
    // since row labels sit outside the plot rather than under it.
    const leftMargin = 72;
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
    const dynamicSvgHeight = Math.max(height, totalBarsCount * minRowHeight + margin.top + margin.bottom);

    const y0 = scaleBand<string>().domain(sortedGeos).range([margin.top, dynamicSvgHeight - margin.bottom]).paddingInner(0.2);
    const y1 = scaleBand<string>().domain(variables).range([0, y0.bandwidth()]).padding(0.05);

    const rawMax = max(chartData.flatMap((d: any) => d.values.map((v: any) => v.value))) || 0;
    const domainMin = yDomainOverride?.yMin ?? 0;
    const domainMax = yDomainOverride?.yMax ?? rawMax;

    const x = scaleLinear().domain([domainMin, domainMax]).range([leftMargin, screenWidth - margin.right]);
    // Skip .nice() when an explicit override is given — same invariant
    // as every other chart: rounding would undo a deliberate manipulation.
    if (!yDomainOverride) x.nice();

    const xTicks = x.ticks(yTickCount);
    const { factor: xFactor, label: xUnitLabel } = detectScale(rawMax);

    return (
        // No card, no border, no radius, no background of its own.
        <View className="w-full">
            <ChartLegend items={legendItems} yUnitLabel={xUnitLabel} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Svg width={screenWidth} height={dynamicSvgHeight}>
                    {/* Gridlines — value axis only, recessive, dashed */}
                    {xTicks.map((tick: number) => (
                        <SvgLine
                            key={tick}
                            x1={x(tick)}
                            x2={x(tick)}
                            y1={margin.top}
                            y2={dynamicSvgHeight - margin.bottom}
                            stroke={THEME_COLORS.subtle}
                            strokeWidth={1}
                            strokeDasharray="4,5"
                        />
                    ))}

                    {/* Category axis: labels only, no axis line, no tick marks */}
                    {sortedGeos.map((geo: string) => (
                        <SvgText
                            key={geo}
                            x={leftMargin - 12}
                            y={(y0(geo) ?? 0) + y0.bandwidth() / 2}
                            dy="0.32em"
                            fontSize={11}
                            fill={THEME_COLORS.grey}
                            textAnchor="end"
                            fontStyle="italic"
                        >
                            {geo}
                        </SvgText>
                    ))}

                    {/* Value axis: single hairline, italic muted labels, no tick marks */}
                    <G transform={`translate(0, ${dynamicSvgHeight - margin.bottom})`}>
                        <SvgLine x1={leftMargin} x2={screenWidth - margin.right} stroke={`${THEME_COLORS.dark}24`} strokeWidth={1} />
                        {xTicks.map((tick: number) => (
                            <SvgText
                                key={tick}
                                x={x(tick)}
                                y={22}
                                fontSize={11}
                                fill={THEME_COLORS.grey}
                                textAnchor="middle"
                                fontStyle="italic"
                            >
                                {formatScaled(tick, xFactor)}
                            </SvgText>
                        ))}
                    </G>

                    {/* Bars */}
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