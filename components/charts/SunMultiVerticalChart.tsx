import { animationDuration, CHART_COLORS, THEME_COLORS } from '@/constants/utilities';
import { detectScale } from '@/functions/formatHandlers';
import { scaleLinear } from 'd3-scale';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Polygon, Rect, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import ChartLegend from '../chartscomp/ChartLegend';

const AnimatedLine = Animated.createAnimatedComponent(SvgLine);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// Shape type decider for multi-dimensional indicators (matched to Eurostat reference)
const getShapeType = (index: number) => {
    const shapes = ['diamond', 'circle', 'square', 'triangle'];
    return shapes[index % shapes.length];
};

// Static shape renderer — no heavy stroke. Each mark sits on a cream
// punch-out halo, the same "pop against the surface" motif used for
// SunLineChart's end-of-line dots and the range chart's end points.
function renderRNShape(cx: number, cy: number, color: string, type: string, size = 6) {
    switch (type) {
        case 'diamond':
            return (
                <Polygon
                    points={`${cx},${cy - size - 2} ${cx + size + 2},${cy} ${cx},${cy + size + 2} ${cx - size - 2},${cy}`}
                    fill={color}
                />
            );
        case 'square':
            return <Rect x={cx - size} y={cy - size} width={2 * size} height={2 * size} fill={color} />;
        case 'triangle':
            return (
                <Polygon
                    points={`${cx},${cy - size - 1} ${cx + size + 1},${cy + size + 1} ${cx - size - 1},${cy + size + 1}`}
                    fill={color}
                />
            );
        case 'circle':
        default:
            return <Circle cx={cx} cy={cy} r={size + 1} fill={color} />;
    }
}

// ─── Connector — the lane's range, grown upward from its low point
// to its high point. Same line-draw idea as every other chart's
// data-reveal animation, just vertical here.
function AnimatedConnector({
    x, yLow, yHigh, delay,
}: { x: number; yLow: number; yHigh: number; delay: number }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) })
        );
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        y2: yLow + (yHigh - yLow) * progress.value,
    }));

    return (
        <AnimatedLine
            x1={x} x2={x}
            y1={yLow}
            stroke={THEME_COLORS.grey}
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

// ─── Indicator mark — pops in with a spring overshoot once the
// connector has drawn past its position, so multi-level markers
// appear to "settle onto" the lane in sequence.
function AnimatedMark({
    x, y, color, shape, delay,
}: { x: number; y: number; color: string; shape: string; delay: number }) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }));
        scale.value = withDelay(delay, withTiming(1, { duration: 340, easing: Easing.out(Easing.back(1.6)) }));
    }, []);

    const haloProps = useAnimatedProps(() => ({ opacity: opacity.value, r: 10 * scale.value }));
    const markProps = useAnimatedProps(() => ({ opacity: opacity.value }));

    return (
        <G>
            <AnimatedCircle cx={x} cy={y} fill={THEME_COLORS.background} animatedProps={haloProps} />
            <AnimatedG animatedProps={markProps}>
                {renderRNShape(x, y, color, shape, 5.5)}
            </AnimatedG>
        </G>
    );
}

// ─── SunMultiVerticalChart ──────────────────────────────────────
// Full-width, card-free — matches the shared SunChartProps contract.
// yDomainOverride skips .nice() exactly like every other chart, since
// an explicit override is a deliberate manipulation and shouldn't be
// silently rounded.
export default function SunMultiVerticalChart({
    apiData,
    screenWidth: customWidth,
    height = 280,
    xTickCount,
    yTickCount = 5,
    yDomainOverride,
}: ChartProps) {
    const screenWidth = customWidth ?? (Dimensions.get('window').width - 32);

    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 60;

    const chartWidth = screenWidth - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const variables = useMemo(() => {
        if (!apiData || !apiData.series) return [];
        return Array.from(
            new Set(Object.keys(apiData.series).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
        );
    }, [apiData]);

    const activeGeos = apiData?.activeGeos ?? [];

    const parsedChartData = useMemo(() => {
        if (!apiData || !apiData.series) return [];

        return activeGeos.map((geo) => {
            const values = variables.map((v) => {
                const key = `${v}_${geo}`;
                const dataPoints = apiData.series[key] || [];
                const val = dataPoints[0]?.value ?? 0;
                return {
                    name: apiData.variableLabels?.[v] ?? v,
                    value: val
                };
            });
            return { label: geo, values };
        });
    }, [apiData, variables, activeGeos]);

    const allValues = useMemo(() => {
        return parsedChartData.flatMap((d) => d.values.map((v) => v.value));
    }, [parsedChartData]);

    const domainMin = useMemo(() => {
        if (yDomainOverride?.yMin !== undefined) return yDomainOverride.yMin;
        return allValues.length ? Math.max(0, Math.min(...allValues) - 5) : 0;
    }, [allValues, yDomainOverride]);

    const domainMax = useMemo(() => {
        if (yDomainOverride?.yMax !== undefined) return yDomainOverride.yMax;
        return allValues.length ? Math.max(20, Math.max(...allValues) + 5) : 40;
    }, [allValues, yDomainOverride]);

    const yScale = useMemo(() => {
        const s = scaleLinear().domain([domainMin, domainMax]).range([paddingTop + chartHeight, paddingTop]);
        if (!yDomainOverride) s.nice();
        return s;
    }, [domainMin, domainMax, paddingTop, chartHeight, yDomainOverride]);

    const yTicks = yScale.ticks(yTickCount);
    const maxAbs = allValues.length ? Math.max(...allValues.map(v => Math.abs(v))) : 0;
    const { factor: yFactor } = detectScale(maxAbs);

    const getX = (index: number) => {
        const totalItems = parsedChartData.length;
        return paddingLeft + (index / Math.max(totalItems - 1, 1)) * chartWidth;
    };

    const palette = apiData?.palette ?? CHART_COLORS;

    const legendItems = useMemo(() => variables.map((v, i) => ({
        label: apiData.variableLabels?.[v] ?? v,
        color: palette[i % palette.length],
    })), [variables, apiData, palette]);

    if (parsedChartData.length === 0) {
        return <View className="h-[150px] items-center justify-center" />;
    }

    return (
        // No card, no border, no radius, no background of its own.
        <View className="w-full">
            <ChartLegend items={legendItems} />

            <Svg width={screenWidth} height={height}>
                {/* Horizontal gridlines — recessive, dashed; zero line as a hairline */}
                {yTicks.map((tick) => {
                    const y = yScale(tick);
                    const isBaseline = tick === 0;
                    return (
                        <G key={tick}>
                            <SvgLine
                                x1={paddingLeft - 5}
                                x2={paddingLeft + chartWidth + 5}
                                y1={y}
                                y2={y}
                                stroke={isBaseline ? `${THEME_COLORS.dark}24` : THEME_COLORS.subtle}
                                strokeWidth={1}
                                strokeDasharray={isBaseline ? undefined : "4,5"}
                            />
                            <SvgText
                                x={paddingLeft - 10}
                                y={y + 3}
                                fontSize={11}
                                fontStyle="italic"
                                textAnchor="end"
                                fill={THEME_COLORS.grey}
                            >
                                {tick === 0 ? "0" : `${(tick / yFactor).toFixed(0)}`}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Lanes & stacked indicators */}
                {parsedChartData.map((row, index) => {
                    const x = getX(index);
                    const values = row.values.map(v => v.value);
                    if (values.length === 0) return null;

                    const yLow = yScale(Math.min(...values));
                    const yHigh = yScale(Math.max(...values));
                    const laneDelay = index * 80;

                    return (
                        <G key={index}>
                            <AnimatedConnector x={x} yLow={yLow} yHigh={yHigh} delay={laneDelay} />

                            {row.values.map((v, valIdx) => (
                                <AnimatedMark
                                    key={valIdx}
                                    x={x}
                                    y={yScale(v.value)}
                                    color={palette[valIdx % palette.length]}
                                    shape={getShapeType(valIdx)}
                                    delay={laneDelay + animationDuration + valIdx * 80}
                                />
                            ))}

                            {/* Category label — muted supporting text, sentence case */}
                            <SvgText
                                x={x}
                                y={paddingTop + chartHeight + 15}
                                fontSize={11}
                                fontStyle="italic"
                                textAnchor="middle"
                                fill={THEME_COLORS.grey}
                                transform={`rotate(-25 ${x} ${paddingTop + chartHeight + 15})`}
                            >
                                {row.label.length > 10 ? `${row.label.slice(0, 10)}..` : row.label}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}