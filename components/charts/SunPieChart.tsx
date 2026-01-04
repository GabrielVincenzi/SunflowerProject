import { animationDuration, colors } from "@/constants/utilities";
import { arc, pie, PieArcDatum } from "d3-shape";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedArc({ d, color }: { d: string; color: string }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration });
    }, [d]);

    const animatedProps = useAnimatedProps(() => ({
        opacity: progress.value,
    }));

    return (
        <AnimatedPath
            d={d}
            fill={color}
            animatedProps={animatedProps}
        />
    );
}

function SunPieChart({ screenWidth, apiData }: ChartProps) {
    const size = Math.min(screenWidth, 280);
    const radius = size / 2;
    const innerRadius = radius * 0.6;

    const geos = apiData.activeGeos || [];
    const safeColors = colors || ["#000"];

    const variables = useMemo(
        () =>
            Array.from(
                new Set(
                    Object.keys(apiData.series || {}).map(k =>
                        k.substring(0, k.lastIndexOf("_"))
                    )
                )
            ),
        [apiData]
    );

    const chartData = useMemo(() => {
        if (geos.length === 1) {
            const geo = geos[0];
            return variables.map((v, i) => ({
                label: v,
                value: apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0,
                color: safeColors[i % safeColors.length],
            }));
        }

        if (variables.length === 1) {
            const variable = variables[0];
            return geos.map((geo, i) => ({
                label: geo,
                value: apiData.series?.[`${variable}_${geo}`]?.[0]?.value ?? 0,
                color: safeColors[i % safeColors.length],
            }));
        }

        return [];
    }, [apiData, geos, variables]);

    const pieGenerator = useMemo(
        () =>
            pie<typeof chartData[number]>()
                .value(d => d.value)
                .sort(null),
        []
    );

    const arcs = useMemo(
        () => pieGenerator(chartData),
        [pieGenerator, chartData]
    );

    const arcGenerator = useMemo(
        () =>
            arc<PieArcDatum<typeof chartData[number]>>()
                .innerRadius(innerRadius)
                .outerRadius(radius),
        [innerRadius, radius]
    );

    console.log(chartData)

    const centerLabel =
        geos.length === 1 ? geos[0] : variables[0];

    return (
        <View className="w-full px-4 items-center">

            {/* Legend */}
            <View className="flex-row flex-wrap justify-center mb-4">
                {chartData.map(d => (
                    <View
                        key={d.label}
                        className="flex-row items-center m-2"
                        style={{ gap: 6 }}
                    >
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: d.color,
                                borderRadius: 2,
                            }}
                        />
                        <Text style={{ fontSize: 12, color: "grey" }}>
                            {d.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Donut */}
            <View
                style={{
                    width: size,
                    height: size,
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Svg width={size} height={size}>
                    <G transform={`translate(${radius}, ${radius})`}>
                        {arcs.map(a => {
                            const d = arcGenerator(a);
                            if (!d) return null;

                            return (
                                <AnimatedArc
                                    key={a.data.label}
                                    d={d}
                                    color={a.data.color}
                                />
                            );
                        })}
                    </G>
                </Svg>

                {/* Center label */}
                <View
                    style={{
                        position: "absolute",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    pointerEvents="none"
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "grey",
                            textAlign: "center",
                        }}
                    >
                        {centerLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default SunPieChart;
