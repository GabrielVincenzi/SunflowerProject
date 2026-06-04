import { CHART_COLORS, THEME_COLORS } from "@/constants/utilities";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import Svg, { G, Rect, RectProps, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedTile({
    x,
    y,
    w,
    h,
    fill,
    delay,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    fill: string;
    delay: number;
}) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, { duration: 600 })
        );
    }, [delay, progress]);

    const animatedProps = useAnimatedProps<RectProps>(() => ({
        width: w * progress.value,
        height: h * progress.value,
        opacity: progress.value,
    }));

    return (
        <AnimatedRect
            x={x}
            y={y}
            fill={fill}
            stroke={THEME_COLORS.dark}
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

const SunTreemapChart = ({ screenWidth, apiData }: any) => {
    const palette = apiData?.palette ?? CHART_COLORS;
    const width = screenWidth * 0.85;
    const height = 300;
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

    const treeData = useMemo(
        () => ({
            name: "root",
            children: geos.map((geo: string) => ({
                name: geo,
                children: variables.map((v) => ({
                    name: v,
                    value: Math.abs(apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0),
                })),
            })),
        }),
        [geos, variables, apiData]
    );

    const leaves = useMemo(() => {
        const root = hierarchy(treeData)
            .sum((d: any) => d.value)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        treemap<any>()
            .size([width, height])
            .tile(treemapSquarify)
            .paddingInner(2)
            .paddingOuter(2)(root);

        return root.leaves();
    }, [treeData, width]);

    return (
        <View className="w-full bg-background">
            <View
                style={{
                    padding: 16,
                    backgroundColor: THEME_COLORS.background,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 12,
                    }}
                >
                    <View />
                </View>

                <Svg width={width} height={height}>
                    <G>
                        {leaves.map((node: any, i) => {
                            const rectW = node.x1 - node.x0;
                            const rectH = node.y1 - node.y0;
                            const fill = palette[i % palette.length];
                            const labelFits = rectW > 50 && rectH > 22;

                            return (
                                <G key={i}>
                                    <AnimatedTile
                                        x={node.x0}
                                        y={node.y0}
                                        w={rectW}
                                        h={rectH}
                                        fill={fill}
                                        delay={i * 40}
                                    />
                                    {labelFits && (
                                        <SvgText
                                            x={node.x0 + 6}
                                            y={node.y0 + 16}
                                            fontSize={9}
                                            fontWeight="800"
                                            fill={THEME_COLORS.dark}
                                            letterSpacing={0.4}
                                        >
                                            {node.data.name.toUpperCase()}
                                        </SvgText>
                                    )}
                                </G>
                            );
                        })}
                    </G>
                </Svg>
            </View>
        </View>
    );
};

export default SunTreemapChart;