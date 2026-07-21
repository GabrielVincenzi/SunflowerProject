import {
    CredibilityMeter, INITIAL_MANIPULATION_STATE,
    RevealScreen, TechniqueControls,
    applyManipulation,
    buildCompletionEvent,
    getAxisOverride,
    getRandomScenario,
    scoreManipulation
} from '@/components/eductools/ManipulationStudioComp';
import { CHART_REGISTRY } from '@/constants/charts'; // adjust path to match your project
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48 - 32;

// Real registry component — identical to what ChartPage renders elsewhere.
const LineChart = CHART_REGISTRY.line.component;

type Phase = 'manipulate' | 'reveal';

interface ManipulatorsStudioProps {
    scenario?: ManipulatorScenario;
    onClose: () => void;
    onComplete?: (event: ReturnType<typeof buildCompletionEvent>) => void;
}

export default function ManipulatorsStudio({
    scenario: scenarioProp,
    onClose,
    onComplete,
}: ManipulatorsStudioProps) {
    const [scenario] = useState<ManipulatorScenario>(() => scenarioProp ?? getRandomScenario());
    const [phase, setPhase] = useState<Phase>('manipulate');
    const [state, setState] = useState<ManipulationState>(INITIAL_MANIPULATION_STATE);

    const result = useMemo(() => scoreManipulation(state), [state]);

    // The live manipulated apiData + axis override — recomputed on every
    // control change, always derived from the scenario's REAL apiData.
    // This is what gets handed straight to <LineChart apiData={...} />,
    // so the chart rendering during manipulation is the exact same
    // component used everywhere else in the app.
    const manipulatedApiData = useMemo(
        () => applyManipulation(scenario, state),
        [scenario, state]
    );
    const axisOverride = useMemo(
        () => getAxisOverride(scenario, state),
        [scenario, state]
    );

    const handleSubmit = () => {
        const event = buildCompletionEvent(scenario, state, result);
        onComplete?.(event);
        setPhase('reveal');
    };

    return (
        <Modal
            visible={true}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-14 pb-2">
                    <View className="flex-row items-center gap-2.5">
                        <View className="w-9 h-9 rounded-full items-center justify-center bg-dark">
                            <Feather name="edit-3" size={15} color="#F7CE46" />
                        </View>
                        <Text className="text-[11px] font-sf-bold uppercase tracking-[0.1em] text-dark/40">
                            {phase === 'manipulate' ? "Manipulator's Studio" : 'The reveal'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-white border border-dark/10 items-center justify-center">
                        <Feather name="x" size={16} color="#1A1A18" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
                    {phase === 'manipulate' ? (
                        <Animated.View entering={FadeInDown.delay(80)}>
                            {/* The assignment */}
                            <Text className="text-[20px] font-sf-bold italic text-dark mb-2 leading-snug">
                                You're a data journalist. Your editor wants a chart that proves:
                            </Text>
                            <View className="bg-dark rounded-2xl px-4 py-3.5 mb-6">
                                <Text className="text-[15px] font-sf-bold italic text-primary">
                                    "{scenario.targetClaim}"
                                </Text>
                            </View>

                            {/* Live, manipulable chart — real SunLineChart, fed
                            the transformed apiData + axis override */}
                            <View className="bg-white border border-dark/10 rounded-2xl p-4 mb-2 items-center">
                                <Text className="text-[12px] font-sf-bold text-dark/50 mb-2 self-start">
                                    {scenario.title}
                                </Text>
                                <LineChart
                                    screenWidth={CHART_WIDTH}
                                    apiData={manipulatedApiData}
                                    yDomainOverride={axisOverride}
                                />
                            </View>
                            <Text className="text-[10px] font-sf-regular text-dark/30 mb-6">
                                This is the same underlying data the whole time — only the framing changes below.
                            </Text>

                            {/* Live meter */}
                            <CredibilityMeter result={result} />

                            {/* Controls */}
                            <Text className="text-[13px] font-sf-bold text-dark mb-1">
                                Bend the chart
                            </Text>
                            <Text className="text-[11px] font-sf-regular text-dark/45 mb-4 leading-snug">
                                Stack as many tricks as you like — but each one costs credibility.
                            </Text>
                            <TechniqueControls state={state} onChange={setState} />

                            {/* Submit */}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={handleSubmit}
                                className="bg-dark rounded-[24px] py-4 items-center mt-2"
                            >
                                <Text className="text-primary font-sf-bold text-[13px] tracking-[0.03em]">
                                    Submit to my editor
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInDown.delay(80)}>
                            <RevealScreen
                                scenario={scenario}
                                manipulatedState={state}
                                result={result}
                                onContinue={onClose}
                            />
                        </Animated.View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}