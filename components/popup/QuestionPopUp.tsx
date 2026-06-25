import { popupEntering, popupExiting } from "@/functions/animations";
import { postNewEvent, postUserQuestionState } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
    Animated,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated2, { FadeInDown } from "react-native-reanimated";

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_QUESTION = {
    questionId: 999,
    title: "What percentage of global CO₂ emissions comes from transport?",
    body: "Based on what you know, give your best answer.",
    explanation:
        "Transport accounts for roughly 16% of global CO₂ emissions (Our World in Data, 2022). Road transport alone is ~12%, with aviation and shipping making up the rest.",
    consecutiveCorrect: 1, // 0 = first encounter, >0 = spaced repetition
    unit: "%",
    sponsor: "Open Climate Data",
    sponsorBody: "Free access to verified emissions datasets from 195 countries.",
    sponsorLink: "openclimate.org",
    choices: [
        { choiceId: 1, content: "Around 8%", isCorrect: false },
        { choiceId: 2, content: "Around 16%", isCorrect: true },
        { choiceId: 3, content: "Around 30%", isCorrect: false },
        { choiceId: 4, content: "Over 40%", isCorrect: false },
    ],
    // pct here must match choice order so the bar inside each button is meaningful
    peerData: [
        { choiceId: 1, label: "< 5%", pct: 8, isUserCohort: false },
        { choiceId: 2, label: "5–15%", pct: 31, isUserCohort: true },
        { choiceId: 3, label: "16–25%", pct: 28, isUserCohort: false },
        { choiceId: 4, label: "> 40%", pct: 11, isUserCohort: false },
    ],
    peerMedianLabel: "5–15%",
    cohortLabel: "Students",
};

type Phase = "input" | "social" | "result_first" | "choose" | "result_return";

const isNumeric = (s: string) => /^\d+(\.\d+)?$/.test(s.trim());
const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

// ─── Social screen ────────────────────────────────────────────────────────────

function SocialScreen({
    question,
    userAnswer,
    isFirstEncounter,
    onKeep,
    onRevise,
}: {
    question: typeof DUMMY_QUESTION;
    userAnswer: string;
    isFirstEncounter: boolean;
    onKeep: () => void;
    onRevise: (newAnswer: string) => void;
}) {
    const [revisedId, setRevisedId] = useState<number | null>(null);
    const maxPct = Math.max(...question.peerData.map((b) => b.pct));

    return (
        <Animated2.View entering={FadeInDown.delay(100)}>
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-3">
                <View className="h-[2px] w-8 bg-dark" />
                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.3em]">
                    WHAT OTHERS THINK
                </Text>
            </View>
            <Text className="text-sm font-elms-regular italic text-dark/50 mb-6 leading-relaxed">
                Anonymised responses from {question.cohortLabel.toLowerCase()} like you (n≥50).
                No individual data is stored or shown.
            </Text>

            {/* Cohort callout */}
            <View className="bg-primary/10 border border-dark/10 rounded-[20px] px-5 py-4 mb-6">
                <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.2em] mb-1">
                    YOUR COHORT · {question.cohortLabel.toUpperCase()}
                </Text>
                <Text className="font-elms-regular italic text-dark/70 text-sm leading-relaxed">
                    Most {question.cohortLabel.toLowerCase()} answered{" "}
                    <Text className="font-elms-bold text-dark">{question.peerMedianLabel}</Text>
                    {". You answered "}
                    <Text className="font-elms-bold text-dark">{userAnswer}</Text>.
                </Text>
            </View>

            {/* Choice buttons with embedded peer bars — return visits only */}
            {!isFirstEncounter && (
                <>
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[1px] w-6 bg-dark/20" />
                        <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.3em]">
                            WANT TO REVISE?
                        </Text>
                    </View>

                    <View className="gap-y-3 mb-6">
                        {question.choices.map((choice) => {
                            const active = revisedId === choice.choiceId;
                            const peer = question.peerData.find((p) => p.choiceId === choice.choiceId);
                            const barPct = peer ? clamp((peer.pct / maxPct) * 100) : 0;
                            const isCohort = peer?.isUserCohort ?? false;

                            return (
                                <View key={choice.choiceId} className="relative w-full">
                                    {/* Hard shadow */}
                                    <View
                                        className="absolute inset-0 bg-dark rounded-[32px]"
                                        style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                                    />

                                    <TouchableOpacity
                                        onPress={() => setRevisedId(active ? null : choice.choiceId)}
                                        activeOpacity={0.85}
                                        className={`rounded-[32px] border-2 overflow-hidden ${active ? "border-dark bg-dark" : "border-dark/15 bg-white"
                                            }`}
                                    >
                                        {/* Peer fill bar — sits behind content */}
                                        {!active && (
                                            <View
                                                className={`absolute top-0 left-0 bottom-0 rounded-[32px] ${isCohort ? "bg-primary/20" : "bg-dark/5"
                                                    }`}
                                                style={{ width: `${barPct}%` }}
                                            />
                                        )}

                                        {/* Content row */}
                                        <View className="flex-row items-center justify-between px-6 py-5">
                                            <Text
                                                className={`text-xl font-elms-bold italic tracking-tight flex-1 mr-4 ${active ? "text-primary" : "text-dark"
                                                    }`}
                                            >
                                                {choice.content}
                                            </Text>

                                            {/* Right badge: pct when idle, check when selected */}
                                            <View
                                                className={`w-9 h-9 rounded-full border-2 items-center justify-center ${active
                                                    ? "border-primary bg-primary"
                                                    : isCohort
                                                        ? "border-primary/40 bg-primary/10"
                                                        : "border-dark/10 bg-dark/5"
                                                    }`}
                                            >
                                                {active ? (
                                                    <Feather name="check" size={16} color="#141414" />
                                                ) : (
                                                    <Text
                                                        className={`text-[9px] font-elms-bold ${isCohort ? "text-dark" : "text-dark/40"
                                                            }`}
                                                    >
                                                        {peer?.pct ?? 0}%
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </>
            )}

            {/* CTAs */}
            <View className="gap-y-3">
                <View className="relative w-full">
                    <View
                        className="absolute inset-0 bg-dark rounded-[32px]"
                        style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
                    />
                    <TouchableOpacity
                        onPress={() =>
                            !isFirstEncounter && revisedId !== null
                                ? onRevise(question.choices.find((c) => c.choiceId === revisedId)?.content ?? userAnswer)
                                : onKeep()
                        }
                        className="py-4 rounded-[32px] bg-dark items-center border-2 border-dark"
                    >
                        <Text className="text-primary font-elms-bold italic text-md uppercase tracking-[0.2em]">
                            {!isFirstEncounter && revisedId !== null ? "SUBMIT REVISION" : "KEEP MY ANSWER"}
                        </Text>
                    </TouchableOpacity>
                </View>
                {!isFirstEncounter && revisedId !== null && (
                    <TouchableOpacity onPress={onKeep} className="py-3 items-center">
                        <Text className="text-dark/30 font-elms-regular italic text-sm uppercase tracking-[0.2em]">
                            Keep original answer
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated2.View>
    );
}

// ─── Numeric gap bar ──────────────────────────────────────────────────────────

function NumericGapBar({ userValue, correctValue, unit }: {
    userValue: number;
    correctValue: number;
    unit: string;
}) {
    const lo = Math.min(userValue, correctValue);
    const hi = Math.max(userValue, correctValue);
    const axisMax = Math.max(hi * 1.4, correctValue * 1.5, 10);
    const pct = (v: number) => clamp((v / axisMax) * 100);
    const correctPct = pct(correctValue);
    const userPct = pct(userValue);
    const gapLeft = pct(lo);
    const gapWidth = pct(hi) - gapLeft;
    const fillAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fillAnim, {
            toValue: correctPct,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, []);

    const gap = Math.abs(userValue - correctValue);
    const direction = userValue > correctValue ? "above" : userValue < correctValue ? "below" : null;

    return (
        <View className="mt-4">
            <Text className="text-sm font-elms-regular italic text-dark/50 mb-4">
                {gap === 0 ? "Exact match — remarkable." : `Your estimate was ${gap}${unit} ${direction} the real value.`}
            </Text>
            <View className="h-8 bg-dark/5 rounded-full relative overflow-hidden mb-2">
                <View className="absolute h-full bg-primary/25 rounded-full" style={{ left: `${gapLeft}%`, width: `${gapWidth}%` }} />
                <Animated.View
                    className="absolute left-0 h-full bg-dark/10 rounded-full"
                    style={{ width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }}
                />
                <View className="absolute top-0 bottom-0 w-[3px] bg-primary" style={{ left: `${userPct}%` }} />
                <Animated.View
                    className="absolute top-0 bottom-0 w-[3px] bg-dark"
                    style={{ left: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }}
                />
            </View>
            <View className="flex-row gap-5 px-1">
                <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.15em]">You · {userValue}{unit}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-dark" />
                    <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.15em]">Reality · {correctValue}{unit}</Text>
                </View>
            </View>
        </View>
    );
}

// ─── Near / far selector ──────────────────────────────────────────────────────

const NEAR_FAR = [
    { value: 1, label: "Very far", icon: "arrow-down-left" },
    { value: 2, label: "Far", icon: "minus" },
    { value: 3, label: "Close", icon: "arrow-up" },
    { value: 4, label: "Very close", icon: "arrow-up-right" },
    { value: 5, label: "Nailed it", icon: "zap" },
] as const;

function NearFarSelector({ onRate }: { onRate: (v: number) => void }) {
    const [selected, setSelected] = useState<number | null>(null);
    return (
        <View className="mt-5">
            <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.3em] mb-3">
                HOW CLOSE WERE YOU?
            </Text>
            <View className="flex-row gap-2 mb-5">
                {NEAR_FAR.map((opt) => {
                    const active = selected === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => setSelected(opt.value)}
                            className={`flex-1 py-3 rounded-[18px] border-2 items-center gap-1.5 ${active ? "bg-dark border-dark" : "bg-white border-dark/10"}`}
                        >
                            <Feather name={opt.icon} size={16} color={active ? "#F7CE46" : "rgba(20,20,20,0.3)"} />
                            <Text className={`text-[9px] font-elms-bold text-center leading-tight ${active ? "text-primary" : "text-dark/35"}`}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View className="relative w-full">
                <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5 opacity-10" />
                <TouchableOpacity
                    disabled={selected === null}
                    onPress={() => selected !== null && onRate(selected)}
                    className={`py-4 rounded-[32px] border-2 border-dark items-center ${selected !== null ? "bg-dark" : "bg-dark/10"}`}
                >
                    <Text className={`text-md font-elms-bold italic uppercase tracking-[0.2em] ${selected !== null ? "text-primary" : "text-dark/30"}`}>
                        LOG SELF-RATING
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Sponsor block ────────────────────────────────────────────────────────────

function SponsorBlock({ question }: { question: typeof DUMMY_QUESTION }) {
    return (
        <View className="pt-8 border-t-2 border-dark/5 mb-6">
            <View className="relative w-full">
                <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-1.5 translate-y-1.5 opacity-5" />
                <View className="bg-white/40 p-8 rounded-[40px] border-2 border-dark/5">
                    <Text className="text-[10px] uppercase font-elms-bold tracking-[0.3em] text-dark/30 mb-5">
                        POWERED BY THE ARCHIVE
                    </Text>
                    <Text className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-none mb-4">
                        {question.sponsor}
                    </Text>
                    <Text className="text-lg font-elms-regular italic text-dark/60 leading-relaxed mb-6">
                        {question.sponsorBody}
                    </Text>
                    <TouchableOpacity className="flex-row items-center gap-3">
                        <Text className="text-lg font-elms-bold italic text-dark border-b-4 border-primary leading-none">
                            EXPLORE NODE
                        </Text>
                        <Feather name="external-link" size={16} color="#141414" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuestionPopup({ onClose }: { onClose: () => void }) {
    const authFetch = useAuthFetch();
    const postMutation = useMutation({ mutationFn: postUserQuestionState });
    const postMutationEvent = useMutation({ mutationFn: postNewEvent });

    const question = DUMMY_QUESTION;
    const isFirstEncounter = question.consecutiveCorrect === 0;

    const [phase, setPhase] = useState<Phase>(isFirstEncounter ? "input" : "choose");
    const [userAnswer, setUserAnswer] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [nearFarDone, setNearFarDone] = useState(false);
    const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
    const [streak, setStreak] = useState(0);
    const [revised, setRevised] = useState(false);

    const handleInputSubmit = () => {
        Keyboard.dismiss();
        const val = inputValue.trim();
        if (!val) return;
        setUserAnswer(val);
        postMutationEvent.mutate({ objectId: question.questionId.toString(), action: "belief_recorded", authFetch });
        setPhase("social");
    };

    const handleChoiceSubmit = () => {
        if (!selectedId) return;
        const choice = question.choices.find((c) => c.choiceId === selectedId);
        setUserAnswer(choice?.content ?? "");
        setPhase("social");
    };

    const resolveResult = (answer: string) => {
        if (isFirstEncounter) {
            setPhase("result_first");
            postMutationEvent.mutate({ objectId: question.questionId.toString(), action: "first_encounter_complete", authFetch });
        } else {
            const correct = question.choices.find((c) => c.content === answer)?.isCorrect ?? false;
            const newStreak = correct ? question.consecutiveCorrect + 1 : 0;
            setWasCorrect(correct);
            setStreak(newStreak);
            setPhase("result_return");
            postMutation.mutate({ questionId: question.questionId, consecutiveCorrect: newStreak, authFetch });
            postMutationEvent.mutate({ objectId: question.questionId.toString(), action: correct ? "correct" : "incorrect", authFetch });
        }
    };

    const correctAnswer = question.choices.find((c) => c.isCorrect)?.content ?? "";
    const answerIsNumeric = isNumeric(userAnswer);
    const correctIsNumeric = isNumeric(correctAnswer);
    const showGapBar = answerIsNumeric && correctIsNumeric;

    return (
        <Modal visible={true} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
            <Animated2.View
                entering={popupEntering}
                exiting={popupExiting}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                className="bg-background"
            >
                {/* Background noise */}
                <View className="absolute inset-0 opacity-10 pointer-events-none">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <View key={i} className="absolute w-1 h-1 bg-dark"
                            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
                    ))}
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 80 }}
                    >

                        {/* ── Header ──────────────────────────────────────── */}
                        <View className="flex-row justify-between items-center mb-12">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-2xl bg-dark items-center justify-center">
                                    <Feather name="cpu" size={20} color="#F7CE46" />
                                </View>
                                <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                                    {phase === "input" ? "BELIEF_NODE // OPEN"
                                        : phase === "social" ? "SIGNAL // SOCIAL"
                                            : "SYNTHESIS"}
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

                        {/* ── Question title — input + choose phases ───────── */}
                        {(phase === "input" || phase === "choose") && (
                            <Animated2.View entering={FadeInDown.delay(200)} className="mb-8">
                                <View className="flex-row items-center gap-3 mb-4">
                                    <View className="h-[2px] w-8 bg-dark" />
                                    <Text className="text-[10px] uppercase font-elms-bold text-dark/40 tracking-[0.2em]">
                                        INQUIRY NODE {question.questionId}
                                    </Text>
                                </View>
                                <Text className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-none mb-4">
                                    {question.title}
                                </Text>
                                <Text className="text-xl font-elms-regular italic text-dark/60 leading-relaxed">
                                    {question.body}
                                </Text>
                            </Animated2.View>
                        )}

                        {/* ════════════════ PHASE: input ═══════════════════ */}
                        {phase === "input" && (
                            <Animated2.View entering={FadeInDown.delay(350)}>
                                <View className="relative w-full mb-8">
                                    <View className="absolute inset-0 bg-dark/10 rounded-[28px] translate-x-1 translate-y-1" />
                                    <View className="flex-row items-center bg-background border-2 border-dark/10 rounded-[28px] px-6 py-5 gap-3">
                                        <TextInput
                                            value={inputValue}
                                            onChangeText={setInputValue}
                                            placeholder=""
                                            placeholderTextColor="rgba(20,20,20,0.2)"
                                            keyboardType="default"
                                            className="flex-1 text-3xl font-elms-bold italic text-dark"
                                            style={{ fontStyle: "italic" }}
                                            returnKeyType="done"
                                            onSubmitEditing={handleInputSubmit}
                                            autoFocus
                                        />
                                        {isNumeric(inputValue) && question.unit
                                            ? <Text className="text-2xl font-elms-regular italic text-dark/25">{question.unit}</Text>
                                            : null}
                                    </View>
                                </View>
                                <View className="flex-row gap-2 mb-8">
                                    <Feather name="lock" size={12} color="rgba(20,20,20,0.25)" style={{ marginTop: 2 }} />
                                    <Text className="text-xs font-elms-regular italic text-dark/30 flex-1 leading-relaxed">
                                        Your answer is stored anonymously.
                                    </Text>
                                </View>
                                <View className="relative w-full">
                                    <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5 opacity-10" />
                                    <TouchableOpacity
                                        disabled={!inputValue.trim()}
                                        onPress={handleInputSubmit}
                                        className={`py-4 rounded-[32px] border-2 border-dark items-center ${inputValue.trim() ? "bg-dark" : "bg-dark/10"}`}
                                    >
                                        <Text className={`text-md font-elms-bold italic uppercase tracking-[0.2em] ${inputValue.trim() ? "text-primary" : "text-dark/30"}`}>
                                            COMMIT ANSWER
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated2.View>
                        )}

                        {/* ════════════════ PHASE: choose ══════════════════ */}
                        {phase === "choose" && (
                            <Animated2.View entering={FadeInDown.delay(350)} className="gap-y-4">
                                {question.choices.map((choice) => {
                                    const active = selectedId === choice.choiceId;
                                    return (
                                        <View key={choice.choiceId} className="relative w-full">
                                            <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5" />
                                            <TouchableOpacity
                                                onPress={() => setSelectedId(choice.choiceId)}
                                                activeOpacity={0.9}
                                                className={`p-6 rounded-[32px] border-2 border-dark flex-row items-center justify-between ${active ? "bg-dark" : "bg-white"}`}
                                            >
                                                <Text className={`text-xl font-elms-bold italic tracking-tight flex-1 mr-4 ${active ? "text-primary" : "text-dark"}`}>
                                                    {choice.content}
                                                </Text>
                                                <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${active ? "border-primary bg-primary" : "border-dark/10"}`}>
                                                    {active && <Feather name="check" size={16} color="#141414" />}
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                                <View className="relative w-full mt-4">
                                    <View className="absolute inset-0 bg-dark rounded-[32px] translate-x-1.5 translate-y-1.5 opacity-20" />
                                    <TouchableOpacity
                                        disabled={!selectedId || postMutation.isPending}
                                        onPress={handleChoiceSubmit}
                                        className={`py-4 rounded-[32px] border-2 border-dark items-center ${selectedId ? "bg-dark" : "bg-dark/10"}`}
                                    >
                                        <Text className={`text-md font-elms-bold italic uppercase tracking-[0.2em] ${selectedId ? "text-primary" : "text-dark/30"}`}>
                                            {postMutation.isPending ? "Analysing..." : "Verify Synthesis"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated2.View>
                        )}

                        {/* ════════════════ PHASE: social ══════════════════ */}
                        {phase === "social" && (
                            <SocialScreen
                                question={question}
                                userAnswer={userAnswer}
                                isFirstEncounter={isFirstEncounter}
                                onKeep={() => resolveResult(userAnswer)}
                                onRevise={(newAnswer) => { setUserAnswer(newAnswer); setRevised(true); resolveResult(newAnswer); }}
                            />
                        )}

                        {/* ════════════════ PHASE: result_first ════════════ */}
                        {phase === "result_first" && (
                            <Animated2.View entering={FadeInDown.delay(150)}>
                                <View className="relative w-full mb-8">
                                    <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-2 translate-y-2" />
                                    <View className="p-8 rounded-[40px] border-2 border-dark bg-white">
                                        <View className="flex-row items-center gap-4 mb-5">
                                            <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
                                                <Feather name="map" size={22} color="#141414" />
                                            </View>
                                            <Text className="text-3xl font-elms-bold italic text-dark tracking-tighter leading-none">
                                                BELIEF LOGGED
                                            </Text>
                                        </View>
                                        <View className="mb-4">
                                            <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.3em] mb-1">YOUR ANSWER</Text>
                                            <Text className="text-2xl font-elms-bold italic text-dark/80">
                                                {userAnswer}{showGapBar ? question.unit : ""}
                                            </Text>
                                        </View>
                                        <View className="mb-2">
                                            <Text className="text-[10px] uppercase font-elms-bold text-dark/30 tracking-[0.3em] mb-1">REALITY</Text>
                                            <Text className="text-2xl font-elms-bold italic text-dark">
                                                {correctAnswer}{correctIsNumeric ? question.unit : ""}
                                            </Text>
                                        </View>
                                        {showGapBar && (
                                            <NumericGapBar
                                                userValue={parseFloat(userAnswer)}
                                                correctValue={parseFloat(correctAnswer)}
                                                unit={question.unit}
                                            />
                                        )}
                                        {!showGapBar && !nearFarDone && (
                                            <NearFarSelector onRate={() => setNearFarDone(true)} />
                                        )}
                                        {!showGapBar && nearFarDone && (
                                            <View className="flex-row items-center gap-2 mt-4">
                                                <Feather name="check-circle" size={14} color="rgba(20,20,20,0.3)" />
                                                <Text className="text-xs font-elms-regular italic text-dark/35">Self-rating logged.</Text>
                                            </View>
                                        )}
                                        <View className="pt-5 mt-5 border-t border-dark/10">
                                            <Text className="text-dark/60 font-elms-regular italic text-base leading-relaxed">
                                                {question.explanation}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <SponsorBlock question={question} />
                                <TouchableOpacity onPress={onClose} className="py-4 rounded-[32px] bg-dark items-center mt-8">
                                    <Text className="text-primary font-elms-bold italic text-md uppercase tracking-widest">RETURN TO FEED</Text>
                                </TouchableOpacity>
                            </Animated2.View>
                        )}

                        {/* ════════════════ PHASE: result_return ═══════════ */}
                        {phase === "result_return" && (
                            <Animated2.View entering={FadeInDown.delay(150)}>
                                <View className="relative w-full mb-10">
                                    <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-2 translate-y-2" />
                                    <View className="p-8 rounded-[40px] border-2 border-dark bg-white">
                                        <View className="flex-row items-center gap-4 mb-6">
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${wasCorrect ? "bg-green-500" : "bg-red-500"}`}>
                                                <Feather name={wasCorrect ? "check" : "x"} size={28} color="white" />
                                            </View>
                                            <Text className="text-4xl font-elms-bold italic text-dark tracking-tighter leading-none">
                                                {wasCorrect ? "VERIFIED" : "NOISE"}
                                            </Text>
                                        </View>
                                        {revised && (
                                            <View className="flex-row items-center gap-2 mb-4">
                                                <Feather name="refresh-cw" size={12} color="rgba(20,20,20,0.35)" />
                                                <Text className="text-xs font-elms-regular italic text-dark/35">
                                                    You revised your answer after seeing peer data.
                                                </Text>
                                            </View>
                                        )}
                                        <Text className="text-dark/70 font-elms-regular italic text-lg leading-relaxed">
                                            {question.explanation}
                                        </Text>
                                    </View>
                                </View>
                                <View className="mb-14 px-2">
                                    <View className="flex-row justify-between items-baseline mb-5">
                                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/30">NEURAL_STREAK</Text>
                                        <Text className="text-5xl font-elms-bold italic text-dark leading-none">{streak}</Text>
                                    </View>
                                    <View className="flex-row gap-2 h-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <View key={i} className={`flex-1 rounded-[4px] border border-dark/10 ${i < streak ? "bg-dark" : "bg-dark/5"}`} />
                                        ))}
                                    </View>
                                </View>
                                <SponsorBlock question={question} />
                                <TouchableOpacity onPress={onClose} className="py-4 rounded-[32px] bg-dark items-center mt-8">
                                    <Text className="text-primary font-elms-bold italic text-md uppercase tracking-widest">RETURN TO FEED</Text>
                                </TouchableOpacity>
                            </Animated2.View>
                        )}

                    </ScrollView>
                </KeyboardAvoidingView>
            </Animated2.View>
        </Modal>
    );
}