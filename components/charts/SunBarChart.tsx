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
import Svg, { Rect, Line as SvgLine, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Scale label formatting (matches SunLineChart) ─────────────
function formatScaled(value: number, factor: number) {
    const n = value / factor;
    const absN = Math.abs(n);
    const maxFractionDigits = absN < 10 ? 2 : absN < 100 ? 1 : 0;
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 0,
    }).format(Number(n.toFixed(maxFractionDigits)));
}

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
        progress.value = withTiming(1, {
            duration: animationDuration,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
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
            animatedProps={animatedProps}
        />
    );
}

// ─── SunBarChart ────────────────────────────────────────────────
function SunBarChart({
    screenWidth,
    apiData,
    xTickCount,
    yTickCount = 5,
    height = 280,
    yDomainOverride,
}: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
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
        const data = geos.map((geo: string) => ({
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

    const rawMax = max(chartData.flatMap(d => d.values.map(v => v.value))) || 0;
    const domainMin = yDomainOverride?.yMin ?? 0;
    const domainMax = yDomainOverride?.yMax ?? rawMax;

    const y = scaleLinear().domain([domainMin, domainMax]).range([height - margin.bottom, margin.top]);
    // Skip .nice() when an explicit override is given — rounding would
    // silently undo a deliberate manipulation (Manipulator's Studio).
    if (!yDomainOverride) y.nice();

    const yTicks = y.ticks(yTickCount);
    const { factor: yFactor, label: yUnitLabel } = detectScale(rawMax);
    const baselineY = height - margin.bottom;

    return (
        // No card, no border, no radius, no background of its own —
        // bg-background is inherited from whatever screen holds this.
        <View className="w-full">
            <ChartLegend items={legendItems} yUnitLabel={yUnitLabel} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Svg width={svgWidth} height={height}>
                    {/* Horizontal gridlines only — recessive, dashed */}
                    {yTicks.map((tick) => (
                        <SvgLine
                            key={tick}
                            x1={margin.left}
                            x2={svgWidth - margin.right}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke={THEME_COLORS.subtle}
                            strokeWidth={1}
                            strokeDasharray="4,5"
                        />
                    ))}

                    {/* x-axis: single hairline, no tick marks */}
                    <SvgLine
                        x1={margin.left}
                        x2={svgWidth - margin.right}
                        y1={baselineY}
                        y2={baselineY}
                        stroke={`${THEME_COLORS.dark}24`}
                        strokeWidth={1}
                    />
                    {sortedGeos.map((geo) => (
                        <SvgText
                            key={geo}
                            x={(x0(geo) ?? 0) + x0.bandwidth() / 2}
                            y={baselineY + 22}
                            fontSize={11}
                            fill={THEME_COLORS.grey}
                            textAnchor="middle"
                            fontStyle="italic"
                        >
                            {geo}
                        </SvgText>
                    ))}

                    {/* y-axis: labels only, no rule, no tick marks */}
                    {yTicks.map((tick) => (
                        <SvgText
                            key={tick}
                            x={margin.left - 10}
                            y={y(tick)}
                            dy="0.35em"
                            fontSize={11}
                            fill={THEME_COLORS.grey}
                            textAnchor="end"
                            fontStyle="italic"
                        >
                            {formatScaled(tick, yFactor)}
                        </SvgText>
                    ))}

                    {/* Bars */}
                    {chartData.map((group) => (
                        <React.Fragment key={group.geo}>
                            {group.values.map((d) => (
                                <AnimatedBar
                                    key={`${group.geo}-${d.variable}`}
                                    x={(x0(group.geo) ?? 0) + (x1(d.variable) ?? 0)}
                                    width={x1.bandwidth() || minBarWidth}
                                    color={d.color}
                                    value={d.value}
                                    yScale={y}
                                    chartHeight={baselineY}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </Svg>
            </ScrollView>
        </View>
    );
}

export default SunBarChart;