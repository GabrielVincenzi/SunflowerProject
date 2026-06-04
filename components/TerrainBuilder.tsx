import { THEME_COLORS } from '@/constants/utilities';
import { contours } from 'd3-contour';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    Easing,
    SharedValue,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIZE = SCREEN_WIDTH * 0.8;
const GRID_RES = 80;

// --- Noise Utility ---
const createNoise2D = () => {
    const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const r = Math.floor(Math.random() * (i + 1)); const tmp = p[i]; p[i] = p[r]; p[r] = tmp; }
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; permMod12[i] = perm[i] % 12; }
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    return (xin: number, yin: number) => {
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else { t0 *= t0; const gi0 = permMod12[ii + perm[jj]] * 3; n0 = t0 * t0 * (grad3[gi0 / 3][0] * x0 + grad3[gi0 / 3][1] * y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else { t1 *= t1; const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3; n1 = t1 * t1 * (grad3[gi1 / 3][0] * x1 + grad3[gi1 / 3][1] * y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else { t2 *= t2; const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3; n2 = t2 * t2 * (grad3[gi2 / 3][0] * x2 + grad3[gi2 / 3][1] * y2); }
        return 70.0 * (n0 + n1 + n2);
    };
};

const getTerrainNoise = (noise2D: (x: number, y: number) => number, x: number, y: number, octaves: number = 4) => {
    let value = 0; let amplitude = 0.5; let frequency = 1; let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        value += amplitude * noise2D(x * frequency, y * frequency);
        maxValue += amplitude; amplitude *= 0.5; frequency *= 2.0;
    }
    return (value / maxValue + 1) / 2;
};

interface TerrainProps {
    population: number;
    isCoastal: boolean;
    elevationBias: number;
}

// ─── FIX: one shared value for the whole positions array ───────────────────
type AgentPosition = { x: number; y: number };

export default function TerrainBuilder({ population, isCoastal, elevationBias }: TerrainProps) {
    const [paths, setPaths] = useState<any[]>([]);
    const [isReady, setIsReady] = useState(false);

    // FIX: single SharedValue<AgentPosition[]> instead of per-entity hooks
    const positions = useSharedValue<AgentPosition[]>([]);
    const [entityCount, setEntityCount] = useState(0);

    const gridRef = useRef<number[]>([]);
    const waterThresholdRef = useRef(0.23);
    const mountainThresholdRef = useRef(0.7);

    // 1. Generate Terrain Data
    useEffect(() => {
        setIsReady(false);
        const noise2D = createNoise2D();
        const values = new Array(GRID_RES * GRID_RES);
        const scale = 2.2;
        const complexity = 6;
        const coastalBias = 0.3;
        const seed = Math.random() * 1000;

        for (let j = 0; j < GRID_RES; j++) {
            for (let i = 0; i < GRID_RES; i++) {
                const nx = (i / GRID_RES) * scale;
                const ny = (j / GRID_RES) * scale;
                let val = getTerrainNoise(noise2D, nx + seed, ny + seed, 4);

                if (isCoastal) {
                    const dx = i / GRID_RES;
                    const dy = 1 - (j / GRID_RES);
                    const distToCorner = Math.sqrt(dx * dx + dy * dy);
                    const normalizedDist = Math.min(distToCorner / 1.2, 1);
                    val = val * (1 - coastalBias) + (normalizedDist * val * coastalBias);
                    val -= (1 - normalizedDist) * coastalBias * 0.4;
                }
                values[j * GRID_RES + i] = Math.max(0, Math.min(1, val));
            }
        }

        gridRef.current = values;
        const shift = (elevationBias - 0.5) * 0.5;
        const p1 = Math.max(0.05, 0.23 - shift);
        const p2 = Math.max(p1 + 0.05, 0.45 - shift);
        const p3 = Math.max(p2 + 0.05, 0.70 - shift);

        waterThresholdRef.current = p1;
        mountainThresholdRef.current = p3;

        const levels = [
            { id: 'water', range: [0.0, p1], color: THEME_COLORS.accent, weight: 1.5 },
            { id: 'plains', range: [p1, p2], color: THEME_COLORS.background, weight: 1.0 },
            { id: 'hills', range: [p2, p3], color: THEME_COLORS.primary, weight: 1.8 },
            { id: 'mountains', range: [p3, 1.0], color: THEME_COLORS.secondary, weight: 2.8 },
        ];

        const contourGen = contours().size([GRID_RES, GRID_RES]);
        const computedPaths: any[] = [];

        levels.forEach((level, lvlIdx) => {
            if (level.id === 'water' && !isCoastal) return;
            const step = (level.range[1] - level.range[0]) / complexity;
            for (let i = 1; i <= complexity; i++) {
                const threshold = level.range[0] + (i * step);
                const result = contourGen.thresholds([threshold])(values);
                if (result[0] && result[0].coordinates.length > 0) {
                    const d = result[0].coordinates.map(poly =>
                        poly.map(ring => "M" + ring.map(pt => `${(pt[0] / GRID_RES) * SIZE},${(pt[1] / GRID_RES) * SIZE}`).join("L") + "Z").join("")
                    ).join("");
                    if (d) {
                        computedPaths.push({
                            d,
                            color: level.color,
                            weight: level.weight,
                            order: lvlIdx * complexity + i,
                            fill: level.id === 'mountains' ? '#94a3b833'
                                : level.id === 'hills' ? '#FCD34D33'
                                    : level.id === 'water' ? '#60a5fa33'
                                        : '#ffffff22'
                        });
                    }
                }
            }
        });

        setPaths(computedPaths);
        const timer = setTimeout(() => setIsReady(true), 4500);
        return () => clearTimeout(timer);
    }, [isCoastal, elevationBias]);

    // 2. Population Movement Logic
    useEffect(() => {
        if (!isReady) return;

        const targetCount = Math.min(40, Math.floor(Math.log10(population + 1) * 12));

        // FIX: build plain objects — no hooks called here
        const initialPositions: AgentPosition[] = [];
        for (let i = 0; i < targetCount; i++) {
            let rx: number, ry: number;
            do {
                rx = Math.floor(Math.random() * GRID_RES);
                ry = Math.floor(Math.random() * GRID_RES);
            } while (gridRef.current[ry * GRID_RES + rx] < waterThresholdRef.current);
            initialPositions.push({ x: rx, y: ry });
        }

        // Write initial positions into the shared value (no animation needed for spawn)
        positions.value = initialPositions;
        setEntityCount(targetCount);

        const interval = setInterval(() => {
            // Read current positions, compute next, write back with spring
            const current = positions.value;
            const next = current.map((pos) => {
                const cx = Math.round(pos.x);
                const cy = Math.round(pos.y);
                const h = gridRef.current[cy * GRID_RES + cx] ?? 0;
                const speed = h >= mountainThresholdRef.current ? 0.8 : 1.0;

                const dirs = [
                    { dx: speed, dy: 0 }, { dx: -speed, dy: 0 },
                    { dx: 0, dy: speed }, { dx: 0, dy: -speed },
                ];
                const valid = dirs.filter(d => {
                    const nx = Math.floor(pos.x + d.dx);
                    const ny = Math.floor(pos.y + d.dy);
                    if (nx < 0 || nx >= GRID_RES || ny < 0 || ny >= GRID_RES) return false;
                    return gridRef.current[ny * GRID_RES + nx] >= waterThresholdRef.current;
                });

                if (valid.length > 0) {
                    const move = valid[Math.floor(Math.random() * valid.length)];
                    return { x: pos.x + move.dx, y: pos.y + move.dy };
                }
                return pos;
            });

            // Assign the whole array — Reanimated will animate on the JS thread
            positions.value = next;
        }, 300);

        return () => {
            clearInterval(interval);
            setEntityCount(0);
        };
    }, [isReady, population]);

    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
        }}>
            <View style={{
                position: 'absolute',
                width: SIZE + 8,
                height: SIZE + 8,
                backgroundColor: THEME_COLORS.dark,
                borderRadius: SIZE / 2,
                transform: [{ translateX: 12 }, { translateY: 12 }],
            }} />
            <View style={{
                backgroundColor: THEME_COLORS.background,
                padding: 8,
                borderRadius: SIZE / 2,
                borderWidth: 3,
                borderColor: THEME_COLORS.dark,
                overflow: 'hidden',
            }}>
                <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    <Defs>
                        <ClipPath id="circleClip">
                            <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} />
                        </ClipPath>
                    </Defs>

                    <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#grid)" />

                    <G clipPath="url(#circleClip)">
                        {paths.map((p, i) => (
                            <TerrainPath key={i} path={p} total={paths.length} />
                        ))}

                        {/* FIX: render agents as SVG circles indexed into the shared array */}
                        {isReady && Array.from({ length: entityCount }, (_, i) => (
                            <AgentEntity key={i} index={i} positions={positions} />
                        ))}
                    </G>

                    <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="none" stroke={THEME_COLORS.dark} strokeWidth={2} />
                </Svg>
            </View>
        </View>
    );
}

// ─── TerrainPath — fix: useAnimatedProps instead of useAnimatedStyle for SVG ──
const AnimatedPath = Animated.createAnimatedComponent(Path);

function TerrainPath({ path, total }: { path: any; total: number }) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(
            path.order * (3000 / total),
            withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
        );
    }, []);

    // FIX: SVG elements need useAnimatedProps, not useAnimatedStyle
    const animatedProps = useAnimatedProps(() => ({
        opacity: opacity.value,
    }));

    return (
        <AnimatedPath
            d={path.d}
            fill={path.fill}
            stroke={THEME_COLORS.dark}
            strokeWidth={path.weight}
            animatedProps={animatedProps}
        />
    );
}

// ─── AgentEntity — FIX: SVG Circle instead of Animated.View ──────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AgentEntity({
    index,
    positions,
}: {
    index: number;
    positions: SharedValue<AgentPosition[]>;
}) {
    // FIX: useAnimatedProps reads the shared array by index — valid hook usage
    const animatedProps = useAnimatedProps(() => {
        const pos = positions.value[index];
        if (!pos) return { cx: 0, cy: 0 };
        return {
            cx: (pos.x / GRID_RES) * SIZE,
            cy: (pos.y / GRID_RES) * SIZE,
        };
    });

    return (
        <AnimatedCircle
            animatedProps={animatedProps}
            r={4}
            fill={THEME_COLORS.background}
            stroke={THEME_COLORS.primary}
            strokeWidth={1.5}
        />
    );
}