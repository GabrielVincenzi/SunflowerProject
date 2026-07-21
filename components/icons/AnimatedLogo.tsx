import React, { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Phase = "idle" | "closing" | "lineIn" | "drawing" | "filling" | "lineOut" | "revealing";

interface AnimatedLogoProps {
    phase: Phase;
    color?: string;
}

export const AnimatedLogo = ({ phase, color = '#FFFFFF' }: AnimatedLogoProps) => {
    const centerCircleScale = useSharedValue(0);
    // Creiamo un array di shared value per gli 11 petali
    const petalScales = Array.from({ length: 12 }, () => useSharedValue(0));

    useEffect(() => {
        // 1. Appare il cerchio centrale quando la linea tocca il centro
        if (phase === 'drawing') {
            centerCircleScale.value = withTiming(1, {
                duration: 600,
                easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Effetto overshoot/molla morbida
            });
        }

        // 2. I petali crescono in sequenza cumulativa (effetto istogramma radiale)
        else if (phase === 'filling') {
            petalScales.forEach((scale, index) => {
                scale.value = withDelay(
                    index * 45, // Ritardo progressivo ridotto per stare nei 600ms della fase
                    withTiming(1, {
                        duration: 350,
                        easing: Easing.out(Easing.back(1.5)),
                    })
                );
            });
        }

        // RESET quando la transizione ricomincia da capo
        else if (phase === 'closing') {
            centerCircleScale.value = 0;
            petalScales.forEach((scale) => { scale.value = 0; });
        }
    }, [phase]);

    // Poiché l'origine della trasformazione nativa di un SVG è in alto a sinistra (0,0),
    // usiamo una matrice di trasformazione standard per scalare rispetto al centro geometrico (1611, 1483).
    const centerAnimatedProps = useAnimatedProps(() => ({
        transform: [
            { translateX: 1611 },
            { translateY: 1483 },
            { scale: centerCircleScale.value },
            { translateX: -1611 },
            { translateY: -1483 }
        ]
    } as any));

    const getPetalAnimatedProps = (index: number) => {
        return useAnimatedProps(() => ({
            transform: [
                { translateX: 1611 },
                { translateY: 1483 },
                { scale: petalScales[index].value },
                { translateX: -1611 },
                { translateY: -1483 }
            ]
        } as any));
    };

    return (
        <Svg width="100%" height="100%" viewBox="0 0 3088 3140">
            {/* Petali esterni */}
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(0)} d="M3010.31 1994.55L2822.52 2347.73L2103.09 1885.94C2157.76 1819.25 2199.14 1741.26 2223.19 1655.99L3010.31 1994.55Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(1)} d="M2273.65 2099.02L2159.95 2201.4L1997.5 1988.13C2026.37 1966.01 2053.28 1941.47 2077.94 1914.81L2273.65 2099.02Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(2)} d="M2742.11 1472.67L2716.29 1718.31L2230.71 1626.64C2241.37 1580.48 2247 1532.4 2247 1483C2247 1475.84 2246.88 1468.71 2246.64 1461.61L2742.11 1472.67Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(3)} d="M3087.25 1262.5L2244.89 1430.88C2237.66 1341.68 2212.02 1257.68 2171.77 1182.68L2977 877.993L3087.25 1262.5Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(4)} d="M2573.12 883.316L2157.04 1156.72C2128.55 1109.15 2094.02 1065.61 2054.51 1027.16L2421.05 688.678L2573.12 883.316Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(5)} d="M1275.34 942.688C1201.39 988.727 1137.58 1049.52 1088.03 1120.96L441.633 553.607L729.369 275.744L1275.34 942.688Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(6)} d="M2216.2 800.973L2032.7 1006.9C2005.89 983.132 1977.05 961.593 1946.48 942.575L2094.01 708.895L2216.2 800.973Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(7)} d="M2146.92 482.109L1922.55 928.406C1874.97 901.621 1823.6 880.78 1769.44 866.894L1917.91 389.582L2146.92 482.109Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(8)} d="M1453.48 866.659C1399.28 880.469 1347.87 901.239 1300.24 927.962L1075.79 482.109L1304.81 389.581L1453.48 866.659Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(9)} d="M1811.86 0L1741.19 860.34C1699.16 851.598 1655.62 847 1611 847C1567.14 847 1524.31 851.44 1482.95 859.896L1411.86 0H1811.86Z" fill={color} />
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(10)} d="M990.601 1342.38C983.125 1375.5 978.234 1409.6 976.15 1444.46L648.545 1310.32L718.006 1174L990.601 1342.38Z" fill={color} />

            {/* Tracciato decorativo senza riempimento */}
            <AnimatedPath transform="scale(0)" animatedProps={getPetalAnimatedProps(11)} d="M959.559 1462.05L976.053 1446.09C975.354 1458.31 975 1470.61 975 1483C975 1834.25 1259.75 2119 1611 2119C1673.73 2119 1734.34 2109.91 1791.59 2092.99L1808.38 2108.94L2110.69 2598L1890.61 2710.14L1672.36 2178.24L1652.33 2192.63L1793.44 3112.03L1394.42 3139.93L1405.71 2209.88L1392.54 2200.15L1260.48 2759.73L1025.57 2683.4L1247.35 2152.98L1231.51 2153.08L694.352 2912.46L387.934 2655.35L1042.13 1994.17L1036.53 1969.37L744.609 2171.76L668.109 2039.26L989.245 1887.48L977.847 1868.77L436.619 2062.78L372.69 1824.2L938.336 1721.31L929.43 1707.43L0 1670.52L48.748 1273.51L959.559 1462.05Z" fill={color} />

            {/* Cerchio centrale principale */}
            <AnimatedPath
                transform="scale(0)" animatedProps={centerAnimatedProps}
                d="M2111 1483C2111 1759.14 1887.14 1983 1611 1983C1334.86 1983 1111 1759.14 1111 1483C1111 1206.86 1334.86 983 1611 983C1887.14 983 2111 1206.86 2111 1483Z"
                fill={color}
            />
        </Svg>
    );
};
