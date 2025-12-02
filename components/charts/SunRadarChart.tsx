import { animationDuration, colors, height } from "@/constants/utilities";
import { scaleLinear } from "d3-scale";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Line, Path, Text as SvgText } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedRadarPolygon({ d, stroke, fill }: {
    d: string;
    stroke: string;
    fill: string;
    strokeWidth?: number;
}) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    // Measure once d changes
    useEffect(() => {
        if (!d || !pathRef.current) return;
        const id = setTimeout(() => {
            const length = pathRef.current!.getTotalLength?.() ?? 0;
            if (length > 0) {
                setPathLength(length);
                progress.value = 0;
                progress.value = withTiming(1, { duration: animationDuration });
            }
        }, 50);

        return () => clearTimeout(id);
    }, [d]);


    const animatedProps = useAnimatedProps(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
        // Optional: fade in the fill together with stroke drawing
        opacity: pathLength ? progress.value : 0,
    }));

    const isReady = pathLength > 0;

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            stroke={stroke}
            strokeWidth={2}
            fill={fill}
            animatedProps={animatedProps}
            opacity={isReady ? 1 : 0}
        />
    );
}

function SunRadarChart({ screenWidth, apiData }: ChartProps) {
    const geos = apiData.activeGeos || [];
    const variables = useMemo(
        () =>
            Array.from(
                new Set(
                    Object.keys(apiData.series || {}).map((k) =>
                        k.substring(0, k.lastIndexOf("_"))
                    )
                )
            ),
        [apiData]
    );

    // Values per geo in variable order
    const dataSet: number[][] = useMemo(
        () =>
            geos.map((geo) =>
                variables.map(
                    (v) => apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0
                )
            ),
        [geos, variables, apiData]
    );

    const maxValue = useMemo(
        () => Math.max(1, ...dataSet.flat()),
        [dataSet]
    );

    // Layout
    const width = screenWidth;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const levels = 4;

    const angleSlice = variables.length > 0 ? (Math.PI * 2) / variables.length : 0;
    const rScale = useMemo(
        () => scaleLinear().domain([0, maxValue]).range([0, radius]),
        [maxValue, radius]
    );

    // Build grid (concentric polygons)
    const gridPaths = useMemo(() => {
        return Array.from({ length: levels }, (_, i) => {
            const r = ((i + 1) / levels) * radius;
            if (variables.length === 0) return "";
            const firstAngle = -Math.PI / 2;
            const cmds: string[] = [];
            for (let j = 0; j < variables.length; j++) {
                const angle = firstAngle + j * angleSlice;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                cmds.push(`${j === 0 ? "M" : "L"} ${x} ${y}`);
            }
            cmds.push("Z");
            return cmds.join(" ");
        });
    }, [variables.length, levels, radius, angleSlice, cx, cy]);

    // Helper to build a closed path for a value array
    const buildPolygonPath = (vals: number[]) => {
        if (variables.length === 0) return "";
        const firstAngle = -Math.PI / 2;
        const cmds: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            const angle = firstAngle + i * angleSlice;
            const r = rScale(vals[i]);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            cmds.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
        }
        cmds.push("Z");
        return cmds.join(" ");
    };

    return (
        <View className="w-full px-4">
            {/* Legend */}
            <View className="flex-row justify-center mt-4 flex-wrap">
                {geos.map((geo, i) => (
                    <View
                        key={geo}
                        className="flex-row items-center m-2"
                        style={{ gap: 6 }}
                    >
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: colors[i % colors.length],
                                borderRadius: 2,
                            }}
                        />
                        <Text style={{ fontSize: 12, color: "grey" }}>{geo}</Text>
                    </View>
                ))}
            </View>
            <Svg width={width} height={height}>
                <G>
                    {/* Grid rings */}
                    {gridPaths.map((d, i) => (
                        <Path key={`grid-${i}`} d={d} stroke="#ccc" strokeWidth={1} fill="none" />
                    ))}

                    {/* Axes */}
                    {variables.map((_, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        const x = cx + radius * Math.cos(angle);
                        const y = cy + radius * Math.sin(angle);
                        return (
                            <Line
                                key={`axis-${i}`}
                                x1={cx}
                                y1={cy}
                                x2={x}
                                y2={y}
                                stroke="#ccc"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Labels */}
                    {variables.map((v, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        const x = cx + (radius + 14) * Math.cos(angle);
                        const y = cy + (radius + 14) * Math.sin(angle);
                        return (
                            <SvgText
                                key={`label-${i}`}
                                x={x}
                                y={y}
                                fontSize={12}
                                fill="grey"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {v}
                            </SvgText>
                        );
                    })}

                    {/* Polygons per geo — animated like the working line chart */}
                    {dataSet.map((vals, i) => {
                        const d = buildPolygonPath(vals);
                        const stroke = colors[i % colors.length];
                        const fill = stroke + "33";
                        return (
                            <AnimatedRadarPolygon
                                key={`geo-${geos[i] ?? i}`}
                                d={d}
                                stroke={stroke}
                                fill={fill}
                            />
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}

export default SunRadarChart;
