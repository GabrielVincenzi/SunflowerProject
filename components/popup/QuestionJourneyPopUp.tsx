import { popupEntering, popupExiting } from "@/functions/animations";
import { postNewEvent, postUserQuestionState } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Choice {
    choiceId: number;
    content: string;
    isCorrect: boolean;
}

interface Question {
    questionId: number;
    title: string;
    body: string;
    explanation: string;
    consecutiveCorrect: number;
    sponsor: string;
    sponsorBody: string;
    sponsorLink: string;
    choices: Choice[];
    /**
     * Whether the user has encountered this question before.
     * On first visit: belief elicitation mode (free-text).
     * On return visits: multiple choice mode.
     */
    isFirstEncounter: boolean;
    /**
     * The belief the user recorded on their first encounter,
     * stored and passed back so it can be shown as context.
     */
    priorBelief?: string;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_QUESTION: Question = {
    questionId: 999,
    title: "How does 'Signal Synthesis' improve mental models?",
    body: "Select the primary mechanism of cognitive evolution in the Sunflower framework.",
    explanation:
        "Synthesis is the process of combining fragmented data into a coherent whole, reducing cognitive load and increasing long-term retention.",
    consecutiveCorrect: 3,
    sponsor: "Inquiry Labs",
    sponsorBody: "Advancing human cognition through structured data visualization.",
    sponsorLink: "inquiry.labs/synthesis",
    // Toggle this to test both modes:
    isFirstEncounter: true,
    priorBelief: "I think it has something to do with pattern recognition.",
    choices: [
        { choiceId: 1, content: "Algorithmic Filtering", isCorrect: false },
        { choiceId: 2, content: "Structured Inquiry", isCorrect: true },
        { choiceId: 3, content: "Passive Consumption", isCorrect: false },
        { choiceId: 4, content: "Sensory Overload", isCorrect: false },
    ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Shown on a user's very first encounter with a question. */
function BeliefElicitationView({
    question,
    onSubmit,
}: {
    question: Question;
    onSubmit: (belief: string) => void;
}) {
    const [belief, setBelief] = useState("");
    const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);

    const canSubmit = belief.trim().length > 4 && confidence !== null;

    const confidenceOptions: { label: string; value: "low" | "medium" | "high" }[] = [
        { label: "Just guessing", value: "low" },
        { label: "Somewhat sure", value: "medium" },
        { label: "Confident", value: "high" },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(400)}>
            {/* Belief prompt label */}
            <View className="flex-row items-center gap-3 mb-5">
                <View className="h-[2px] w-6 bg-dark/30" />
                <Text className="text-[10px] uppercase font-sf-bold text-dark/40 tracking-[0.3em]">
                    FIRST ENCOUNTER — RECORD YOUR BELIEF
                </Text>
            </View>

            {/* Instruction */}
            <Text className="text-base font-sf-regular italic text-dark/50 mb-6 leading-relaxed">
                Before seeing any data, write what you genuinely think. There are no wrong answers —
                only honest starting points.
            </Text>

            {/* Free-text input */}
            <View className="relative w-full mb-6">
                <View className="absolute inset-0 bg-dark rounded-[28px] translate-x-1.5 translate-y-1.5 opacity-10" />
                <TextInput
                    value={belief}
                    onChangeText={setBelief}
                    placeholder="Write your belief here..."
                    placeholderTextColor="rgba(20,20,20,0.25)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-white border-2 border-dark/10 rounded-[28px] p-6 text-dark font-sf-regular italic text-lg leading-relaxed min-h-[130px]"
                    style={{ fontStyle: "italic" }}
                />
            </View>

            {/* Confidence selector */}
            <Text className="text-[10px] uppercase font-sf-bold text-dark/30 tracking-[0.3em] mb-3">
                HOW CONFIDENT ARE YOU?
            </Text>
            <View className="flex-row gap-3 mb-10">
                {confidenceOptions.map((opt) => {
                    const active = confidence === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => setConfidence(opt.value)}
                            className={`flex-1 py-3 rounded-[20px] border-2 items-center ${active ? "bg-dark border-dark" : "bg-white border-dark/10"
                                }`}
                        >
                            <Text
                                className={`text-xs font-sf-bold italic ${active ? "text-primary" : "text-dark/40"
                                    }`}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Anonymity note */}
            <View className="flex-row items-center gap-2 mb-8 px-1">
                <Feather name="lock" size={12} color="rgba(20,20,20,0.3)" />
                <Text className="text-xs font-sf-regular italic text-dark/30 flex-1 leading-relaxed">
                    Your belief is stored anonymously. It will only be shown back to you — never shared individually.
                </Text>
            </View>

            {/* Submit */}
            <View className="relative w-full">
                <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5 opacity-20" />
                <TouchableOpacity
                    disabled={!canSubmit}
                    onPress={() => onSubmit(`${belief.trim()} [confidence: ${confidence}]`)}
                    className={`py-4 rounded-[32px] border-2 border-dark items-center ${canSubmit ? "bg-dark" : "bg-dark/10"
                        }`}
                >
                    <Text
                        className={`text-md font-sf-bold italic uppercase tracking-[0.2em] ${canSubmit ? "text-primary" : "text-dark/30"
                            }`}
                    >
                        RECORD BELIEF
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

/** Shown after the user records their first-encounter belief. */
function BeliefRecordedView({
    onClose,
}: {
    onClose: () => void;
}) {
    return (
        <Animated.View entering={FadeInDown.delay(200)}>
            <View className="relative w-full mb-10">
                <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-2 translate-y-2" />
                <View className="bg-white p-8 rounded-[40px] border-2 border-dark">
                    <View className="flex-row items-center gap-4 mb-5">
                        <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
                            <Feather name="bookmark" size={22} color="#141414" />
                        </View>
                        <Text className="text-4xl font-sf-bold italic text-dark tracking-tighter leading-none">
                            BELIEF LOGGED
                        </Text>
                    </View>
                    <Text className="text-dark/60 font-sf-regular italic text-lg leading-relaxed">
                        Come back tomorrow. When this question returns, you will face the data —
                        and see where your thinking stands.
                    </Text>
                </View>
            </View>

            {/* What happens next */}
            <View className="mb-10 px-2 gap-y-5">
                {[
                    { icon: "bar-chart-2", label: "You will see real data visualisations related to this question." },
                    { icon: "users", label: "You will discover how your peers answered — anonymised." },
                    { icon: "map", label: "A personal map will track how your thinking evolves over time." },
                ].map((item, i) => (
                    <View key={i} className="flex-row items-start gap-4">
                        <View className="w-8 h-8 rounded-xl bg-dark/5 items-center justify-center mt-0.5">
                            <Feather name={item.icon as any} size={16} color="#141414" />
                        </View>
                        <Text className="flex-1 font-sf-regular italic text-dark/60 text-base leading-relaxed">
                            {item.label}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="relative w-full mt-4">
                <TouchableOpacity
                    onPress={onClose}
                    className="py-4 rounded-[32px] bg-dark items-center"
                >
                    <Text className="text-primary font-sf-bold italic text-md uppercase tracking-widest">
                        RETURN TO FEED
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

/** Shown on return visits: prior belief context + multiple choice. */
function ReturnEncounterHeader({ priorBelief }: { priorBelief?: string }) {
    if (!priorBelief) return null;
    return (
        <Animated.View entering={FadeInDown.delay(300)} className="mb-8">
            <View className="flex-row items-center gap-3 mb-3">
                <View className="h-[1px] w-6 bg-dark/20" />
                <Text className="text-[10px] uppercase font-sf-bold text-dark/30 tracking-[0.3em]">
                    YOUR RECORDED BELIEF
                </Text>
            </View>
            <View className="bg-primary/10 border border-dark/10 rounded-[20px] px-5 py-4">
                <Text className="font-sf-regular italic text-dark/70 text-base leading-relaxed">
                    "{priorBelief.replace(/ \[confidence: \w+\]/, "")}"
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuestionJourneyPopup({ onClose, title = "Inquiry" }: any) {
    const { user } = useUser();
    const authFetch = useAuthFetch();

    const postMutation = useMutation({ mutationFn: postUserQuestionState });
    const postMutationEvent = useMutation({ mutationFn: postNewEvent });

    const question = DUMMY_QUESTION;
    const isFirst = question.isFirstEncounter;

    // Shared state
    const [phase, setPhase] = useState<
        "elicit" | "belief_recorded" | "choose" | "result"
    >(isFirst ? "elicit" : "choose");

    // Multiple-choice state (return visits)
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
    const [streak, setStreak] = useState(0);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleBeliefSubmit = (belief: string) => {
        // In production: persist the belief to your backend here.
        // postMutation.mutate({ questionId: question.questionId, belief, authFetch });
        postMutationEvent.mutate({
            objectId: question.questionId.toString(),
            action: "belief_recorded",
            authFetch,
        });
        setPhase("belief_recorded");
    };

    const handleConfirm = () => {
        const selectedChoice = question.choices.find((c) => c.choiceId === selectedId);
        const correct = !!selectedChoice?.isCorrect;

        setWasCorrect(correct);
        setStreak(correct ? question.consecutiveCorrect + 1 : 0);
        setPhase("result");

        postMutation.mutate({
            questionId: question.questionId,
            consecutiveCorrect: correct ? question.consecutiveCorrect + 1 : 0,
            authFetch,
        });
        postMutationEvent.mutate({
            objectId: question.questionId.toString(),
            action: correct ? "correct" : "incorrect",
            authFetch,
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Animated.View
            entering={popupEntering}
            exiting={popupExiting}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="bg-background"
        >
            {/* Structural background noise */}
            <View className="absolute inset-0 opacity-10">
                {Array.from({ length: 40 }).map((_, i) => (
                    <View
                        key={i}
                        className="absolute w-1 h-1 bg-dark"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 32,
                        paddingTop: 40,
                        paddingBottom: 80,
                    }}
                >
                    {/* ── Header ───────────────────────────────────────────── */}
                    <View className="flex-row justify-between items-center mb-12">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-2xl bg-dark items-center justify-center">
                                <Feather name="cpu" size={20} color="#F7CE46" />
                            </View>
                            <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-dark/40">
                                {isFirst ? "BELIEF_NODE // OPEN" : "SYNTHESIS_MODE // ACTIVE"}
                            </Text>
                        </View>

                        <View className="relative">
                            <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-12 h-12 items-center justify-center rounded-full border-2 border-dark bg-white"
                            >
                                <Feather name="x" size={24} color="#141414" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Question header (shown in elicit + choose phases) ── */}
                    {(phase === "elicit" || phase === "choose") && (
                        <Animated.View entering={FadeInDown.delay(200)}>
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="h-[2px] w-8 bg-dark" />
                                <Text className="text-[10px] uppercase font-sf-bold text-dark/40 tracking-[0.2em]">
                                    INQUIRY NODE {question.questionId}
                                </Text>
                            </View>

                            <Text className="text-4xl font-sf-bold italic text-dark tracking-tighter leading-none mb-4">
                                {question.title}
                            </Text>

                            {/* On return visits, show their prior belief before the choices */}
                            {phase === "choose" && (
                                <ReturnEncounterHeader priorBelief={question.priorBelief} />
                            )}

                            {phase === "elicit" && (
                                <Text className="text-xl font-sf-regular italic text-dark/60 leading-relaxed mb-10">
                                    {question.body}
                                </Text>
                            )}

                            {phase === "choose" && (
                                <Text className="text-xl font-sf-regular italic text-dark/60 leading-relaxed mb-8">
                                    {question.body}
                                </Text>
                            )}
                        </Animated.View>
                    )}

                    {/* ── Phase: first encounter — belief elicitation ───────── */}
                    {phase === "elicit" && (
                        <BeliefElicitationView
                            question={question}
                            onSubmit={handleBeliefSubmit}
                        />
                    )}

                    {/* ── Phase: belief recorded confirmation ───────────────── */}
                    {phase === "belief_recorded" && (
                        <BeliefRecordedView onClose={onClose} />
                    )}

                    {/* ── Phase: return visit — multiple choice ─────────────── */}
                    {phase === "choose" && (
                        <Animated.View entering={FadeInDown.delay(400)} className="gap-y-4">
                            {question.choices.map((choice) => {
                                const active = selectedId === choice.choiceId;
                                return (
                                    <View key={choice.choiceId} className="relative w-full">
                                        <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5" />
                                        <TouchableOpacity
                                            onPress={() => setSelectedId(choice.choiceId)}
                                            activeOpacity={0.9}
                                            className={`p-6 rounded-[32px] border-2 border-dark flex-row items-center justify-between ${active ? "bg-dark" : "bg-white"
                                                }`}
                                        >
                                            <Text
                                                className={`text-xl font-sf-bold italic tracking-tight flex-1 mr-4 ${active ? "text-primary" : "text-dark"
                                                    }`}
                                            >
                                                {choice.content}
                                            </Text>
                                            <View
                                                className={`w-8 h-8 rounded-full border-2 items-center justify-center ${active ? "border-primary bg-primary" : "border-dark/10"
                                                    }`}
                                            >
                                                {active && (
                                                    <Feather name="check" size={16} color="#141414" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            <View className="relative w-full mt-6">
                                <TouchableOpacity
                                    disabled={!selectedId || postMutation.isPending}
                                    onPress={handleConfirm}
                                    className={`py-4 rounded-[32px] border-2 border-dark items-center ${selectedId ? "bg-dark" : "bg-dark/10"
                                        }`}
                                >
                                    <Text
                                        className={`text-md font-sf-bold italic uppercase tracking-[0.2em] ${selectedId ? "text-primary" : "text-dark/30"
                                            }`}
                                    >
                                        {postMutation.isPending ? "Analysing..." : "Verify Synthesis"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* ── Phase: result ─────────────────────────────────────── */}
                    {phase === "result" && (
                        <Animated.View entering={FadeInDown.delay(200)}>
                            {/* Result banner */}
                            <View className="relative w-full mb-10">
                                <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-2 translate-y-2" />
                                <View className="p-8 rounded-[40px] border-2 border-dark bg-white">
                                    <View className="flex-row items-center gap-4 mb-6">
                                        <View
                                            className={`w-12 h-12 rounded-2xl items-center justify-center ${wasCorrect ? "bg-green-500" : "bg-red-500"
                                                }`}
                                        >
                                            <Feather
                                                name={wasCorrect ? "check" : "x"}
                                                size={28}
                                                color="white"
                                            />
                                        </View>
                                        <Text className="text-4xl font-sf-bold italic text-dark tracking-tighter leading-none">
                                            {wasCorrect ? "VERIFIED" : "NOISE"}
                                        </Text>
                                    </View>
                                    <Text className="text-dark/70 font-sf-regular italic text-lg leading-relaxed mb-6">
                                        {question.explanation}
                                    </Text>

                                    {/* Prior belief echo */}
                                    {question.priorBelief && (
                                        <View className="pt-5 border-t border-dark/10">
                                            <Text className="text-[10px] uppercase font-sf-bold text-dark/30 tracking-[0.3em] mb-2">
                                                WHERE YOU STARTED
                                            </Text>
                                            <Text className="font-sf-regular italic text-dark/50 text-base leading-relaxed">
                                                "{question.priorBelief.replace(/ \[confidence: \w+\]/, "")}"
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Streak */}
                            <View className="mb-14 px-2">
                                <View className="flex-row justify-between items-baseline mb-5">
                                    <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-dark/30">
                                        NEURAL_STREAK
                                    </Text>
                                    <Text className="text-5xl font-sf-bold italic text-dark leading-none">
                                        {streak}
                                    </Text>
                                </View>
                                <View className="flex-row gap-2 h-3">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <View
                                            key={i}
                                            className={`flex-1 rounded-[4px] border border-dark/10 ${i < streak ? "bg-dark" : "bg-dark/5"
                                                }`}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Sponsor */}
                            <View className="pt-10 border-t-2 border-dark/5">
                                <View className="relative w-full">
                                    <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-1.5 translate-y-1.5 opacity-5" />
                                    <View className="bg-white/40 p-10 rounded-[40px] border-2 border-dark/5">
                                        <Text className="text-[10px] uppercase font-sf-bold tracking-[0.3em] text-dark/30 mb-6">
                                            POWERED BY THE ARCHIVE
                                        </Text>
                                        <Text className="text-4xl font-sf-bold italic text-dark tracking-tighter leading-none mb-6">
                                            {question.sponsor}
                                        </Text>
                                        <Text className="text-xl font-sf-regular italic text-dark/60 leading-relaxed mb-8">
                                            {question.sponsorBody}
                                        </Text>
                                        <TouchableOpacity className="flex-row items-center gap-3">
                                            <Text className="text-xl font-sf-bold italic text-dark border-b-4 border-primary leading-none">
                                                EXPLORE NODE
                                            </Text>
                                            <Feather name="external-link" size={18} color="#141414" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Exit */}
                            <View className="relative w-full mt-14">
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="py-4 rounded-[32px] bg-dark items-center"
                                >
                                    <Text className="text-primary font-sf-bold italic text-md uppercase tracking-widest">
                                        RETURN TO FEED
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}