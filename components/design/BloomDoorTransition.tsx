import { THEME_COLORS } from '@/constants/utilities';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Path, Pattern, Rect } from 'react-native-svg';
import { AnimatedLogo } from '../icons/AnimatedLogo';

const BLOOM_SMALL_SIZE = 200;
const TEARDROP_D = "M0,-19 C9,-9 9,9 0,20 C-9,9 -9,-9 0,-19 Z";
const CRESCENT_D = "M-3,-19 Q11,0 -3,19 Q-8,0 -3,-19 Z";

type Phase = "idle" | "closing" | "drawing" | "filling" | "logoGrowing" | "revealing";

export type BloomTransitionRef = { play: () => void };

type Props = {
    onCovered?: () => void;
    onFinished?: () => void;
};

function WallPattern({ id }: { id: string }) {
    return (
        <Defs>
            <Pattern id={id} width={96} height={96} patternUnits="userSpaceOnUse">
                <Rect width={96} height={96} fill={THEME_COLORS.primary} />
                <Ellipse cx={16} cy={14} rx={7} ry={16} fill={THEME_COLORS.secondary} opacity={0.5} transform="rotate(18 16 14)" />
                <Path d={TEARDROP_D} fill={THEME_COLORS.dark} opacity={0.1} transform="translate(70,10) rotate(-30) scale(0.5)" />
                <Ellipse cx={46} cy={58} rx={8} ry={18} fill={THEME_COLORS.secondary} opacity={0.4} transform="rotate(64 46 58)" />
                <Path d={CRESCENT_D} fill={THEME_COLORS.marked} opacity={0.15} transform="translate(86,72) rotate(105) scale(0.55)" />
                <Ellipse cx={8} cy={84} rx={6} ry={14} fill={THEME_COLORS.secondary} opacity={0.45} transform="rotate(-42 8 84)" />
            </Pattern>
        </Defs>
    );
}

// 1. Definiamo il componente con una funzione nominata per evitare i bug di displayName su Fabric
const BloomDoorTransitionComponent = (
    { onCovered, onFinished }: Props,
    ref: React.Ref<BloomTransitionRef>
) => {
    const { width, height } = useWindowDimensions();
    const [phase, setPhase] = useState<Phase>("idle");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const leftPanel = useSharedValue(-1);
    const rightPanel = useSharedValue(1);
    const wallOpacity = useSharedValue(1);
    const flowerSize = useSharedValue(BLOOM_SMALL_SIZE);
    const flowerOpacity = useSharedValue(1);

    // Dimensione enorme per far espandere il logo oltre i confini dello schermo
    const bigSize = Math.max(width, height) * 5;

    useImperativeHandle(ref, () => ({
        play: () => setPhase("closing"),
    }));

    // Gestione delle animazioni dei Shared Values in base alle fasi
    useEffect(() => {
        if (phase === "closing") {
            leftPanel.value = -1;
            rightPanel.value = 1;
            wallOpacity.value = 1; // Muro visibile
            flowerSize.value = BLOOM_SMALL_SIZE;
            flowerOpacity.value = 1;

            leftPanel.value = withTiming(0, { duration: 1120, easing: Easing.bezier(0.65, 0, 0.35, 1) });
            rightPanel.value = withTiming(0, { duration: 1120, easing: Easing.bezier(0.65, 0, 0.35, 1) });
        }
        else if (phase === "logoGrowing") {
            // Il fiore fa un piccolo shrink (anticipazione) e poi esplode coprendo lo schermo
            flowerSize.value = withSequence(
                // Anticipazione: si rimpicciolisce leggermente nei primi 200ms
                withTiming(BLOOM_SMALL_SIZE * 0.82, {
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                }),
                // Esplosione: cresce esponenzialmente fino a bigSize nei restanti 650ms
                withTiming(bigSize, {
                    duration: 650,
                    easing: Easing.exp,
                })
            );
        }
        else if (phase === "revealing") {
            // Il muro scompare istantaneamente (coperto dal fiore gigante)
            wallOpacity.value = 0;

            // Il fiore gigante sfuma a zero per mostrare lo schermo sottostante
            flowerOpacity.value = withTiming(0, {
                duration: 1000,
                easing: Easing.bezier(0.25, 1, 0.5, 1)
            });
        }
    }, [phase, width, height, bigSize]);

    // Orchestrazione dei passaggi temporali
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);

        if (phase === "closing") {
            timer.current = setTimeout(() => setPhase("drawing"), 1120);
        } else if (phase === "drawing") {
            timer.current = setTimeout(() => setPhase("filling"), 600);
        } else if (phase === "filling") {
            timer.current = setTimeout(() => setPhase("logoGrowing"), 1200);
        } else if (phase === "logoGrowing") {
            // Appena il fiore ha coperto lo schermo, attiviamo il cambio di rotta
            timer.current = setTimeout(() => {
                onCovered?.(); // Esegui la navigazione o il cambio di schermo qui sotto
                setPhase("revealing");
            }, 800); // Sincronizzato con i 800ms del timing di crescita
        } else if (phase === "revealing") {
            timer.current = setTimeout(() => {
                setPhase("idle");
                onFinished?.();
            }, 1000); // Sincronizzato con i 1000ms della sfumatura
        }

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [phase]);

    // Stili per i pannelli del muro
    const leftStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftPanel.value * width }],
        opacity: wallOpacity.value,
    }));

    const rightStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightPanel.value * width }],
        opacity: wallOpacity.value,
    }));

    const flowerContainerStyle = useAnimatedStyle(() => ({
        width: flowerSize.value,
        height: flowerSize.value,
        marginLeft: -flowerSize.value / 2,
        marginTop: -flowerSize.value / 2,
        opacity: flowerOpacity.value,
    }));

    if (phase === "idle") return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Pannello Sinistro */}
            <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%" }, leftStyle]}>
                <Svg width="100%" height="100%">
                    <WallPattern id="bloomWallPatternLeft" />
                    <Rect width="100%" height="100%" fill="url(#bloomWallPatternLeft)" />
                </Svg>
            </Animated.View>

            {/* Pannello Destro */}
            <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "50%" }, rightStyle]}>
                <Svg width="100%" height="100%">
                    <WallPattern id="bloomWallPatternRight" />
                    <Rect width="100%" height="100%" fill="url(#bloomWallPatternRight)" />
                </Svg>
            </Animated.View>

            {/* Il fiore gigante che copre il cambio di schermo e poi sfuma */}
            <Animated.View style={[{ position: "absolute", left: "50%", top: "50%" }, flowerContainerStyle]}>
                <AnimatedLogo
                    phase={phase === "logoGrowing" || phase === "revealing" ? "filling" : phase as any}
                    color="#FFFFFF"
                />
            </Animated.View>
        </View>
    );
};

const BloomDoorTransitionForwarded = forwardRef(BloomDoorTransitionComponent);
BloomDoorTransitionForwarded.displayName = "BloomDoorTransition";

export default BloomDoorTransitionForwarded;
