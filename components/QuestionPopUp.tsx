import { popupEntering, popupExiting } from "@/functions/animations";
import { postUserQuestionState } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeInDown
} from "react-native-reanimated";

const DUMMY_QUESTION = {
    questionId: 999,
    title: "How does 'Signal Synthesis' improve mental models?",
    body: "Select the primary mechanism of cognitive evolution in the Sunflower framework.",
    explanation: "Synthesis is the process of combining fragmented data into a coherent whole, reducing cognitive load and increasing long-term retention.",
    consecutiveCorrect: 3,
    sponsor: "Inquiry Labs",
    sponsorBody: "Advancing human cognition through structured data visualization.",
    sponsorLink: "inquiry.labs/synthesis",
    choices: [
        { choiceId: 1, content: "Algorithmic Filtering", isCorrect: false },
        { choiceId: 2, content: "Structured Inquiry", isCorrect: true },
        { choiceId: 3, content: "Passive Consumption", isCorrect: false },
        { choiceId: 4, content: "Sensory Overload", isCorrect: false },
    ],
};

export default function QuestionPopup({ onClose, title = "Inquiry" }: any) {
    const { user } = useUser();
    const authFetch = useAuthFetch();

    const postMutation = useMutation({
        mutationFn: postUserQuestionState,
    });

    const [selectedId, setSelectedId] = useState<number | string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
    const [streak, setStreak] = useState<number>(0);

    const handleClose = () => onClose();

    const handleConfirm = () => {
        const question = DUMMY_QUESTION;
        const selectedChoice = question.choices.find((c: any) => c.choiceId === selectedId);
        const correct = !!selectedChoice?.isCorrect;

        setWasCorrect(correct);
        setConfirmed(true);
        setStreak(correct ? question.consecutiveCorrect + 1 : 0);

        postMutation.mutate({
            questionId: question.questionId,
            consecutiveCorrect: correct ? question.consecutiveCorrect + 1 : 0,
            authFetch,
        });
    };

    return (
        <Animated.View
            entering={popupEntering}
            exiting={popupExiting}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="bg-background" // Use the brand yellow for maximum impact
        >
            {/* Structural Background Accents: Re-styled as technical noise */}
            <View className="absolute inset-0 opacity-10">
                {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} className="absolute w-1 h-1 bg-dark"
                        style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                    />
                ))}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 80 }}
            >
                {/* 1. Header Navigation: Brutalist Mode */}
                <View className="flex-row justify-between items-center mb-12">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-2xl bg-dark items-center justify-center">
                            <Feather name="cpu" size={20} color="#F7CE46" />
                        </View>
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                            SYNTHESIS_MODE // ACTIVE
                        </Text>
                    </View>

                    {/* Shadowed Close Button */}
                    <View className="relative">
                        <View className="absolute inset-0 bg-dark rounded-full translate-x-1 translate-y-1" />
                        <TouchableOpacity
                            onPress={handleClose}
                            className="w-12 h-12 items-center justify-center rounded-full border-2 border-dark bg-white"
                        >
                            <Feather name="x" size={24} color="#141414" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. Question Typography: Bold Editorial Style */}
                <Animated.View entering={FadeInDown.delay(200)}>
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[2px] w-8 bg-dark" />
                        <Text className="text-[10px] uppercase font-elms-bold text-dark/40 tracking-[0.2em]">
                            INQUIRY NODE {DUMMY_QUESTION.questionId}
                        </Text>
                    </View>

                    <Text className="text-4xl font-elms-bold italic text-dark tracking-tighter leading-none mb-6">
                        {DUMMY_QUESTION.title}
                    </Text>

                    <Text className="text-xl font-elms-regular italic text-dark/60 leading-relaxed mb-12">
                        {DUMMY_QUESTION.body}
                    </Text>
                </Animated.View>

                {/* 3. Interaction Area: Choice Cards with Double-Layer Shadows */}
                {!confirmed ? (
                    <Animated.View entering={FadeInDown.delay(400)} className="gap-y-4">
                        {DUMMY_QUESTION.choices.map((choice) => {
                            const active = selectedId === choice.choiceId;
                            return (
                                <View key={choice.choiceId} className="relative w-full">
                                    {/* Constant Hard Shadow Layer */}
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

                        {/* Submit Action Block */}
                        <View className="relative w-full mt-6">
                            <TouchableOpacity
                                disabled={!selectedId || postMutation.isPending}
                                onPress={handleConfirm}
                                className={`py-4 rounded-[32px] border-2 border-dark items-center ${selectedId ? "bg-dark" : "bg-dark/10"}`}
                            >
                                <Text className={`text-md font-elms-bold italic uppercase tracking-[0.2em] ${selectedId ? "text-primary" : "text-dark/30"}`}>
                                    {postMutation.isPending ? "Analysing..." : "Verify Synthesis"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        {/* 4. Result Banner: High Impact Split View */}
                        <View className="relative w-full mb-12">
                            <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-2 translate-y-2" />
                            <View className={`p-8 rounded-[40px] border-2 border-dark ${wasCorrect ? "bg-white" : "bg-white"}`}>
                                <View className="flex-row items-center gap-4 mb-6">
                                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${wasCorrect ? "bg-green-500" : "bg-red-500"}`}>
                                        <Feather name={wasCorrect ? "check" : "x"} size={28} color="white" />
                                    </View>
                                    <Text className="text-4xl font-elms-bold italic text-dark tracking-tighter leading-none">
                                        {wasCorrect ? "VERIFIED" : "NOISE"}
                                    </Text>
                                </View>
                                <Text className="text-dark/70 font-elms-regular italic text-lg leading-relaxed">
                                    {DUMMY_QUESTION.explanation}
                                </Text>
                            </View>
                        </View>

                        {/* 5. Streak & Terminal Stats */}
                        <View className="mb-16 px-2">
                            <View className="flex-row justify-between items-baseline mb-6">
                                <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/30">
                                    NEURAL_STREAK
                                </Text>
                                <Text className="text-5xl font-elms-bold italic text-dark leading-none">{streak}</Text>
                            </View>
                            <View className="flex-row gap-2 h-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <View
                                        key={i}
                                        className={`flex-1 rounded-[4px] border border-dark/10 ${i < streak ? "bg-dark shadow-sm" : "bg-dark/5"}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* 6. Sponsor Section: Editorial Layout */}
                        <View className="pt-12 border-t-2 border-dark/5">
                            <View className="relative w-full">
                                <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-1.5 translate-y-1.5 opacity-5" />
                                <View className="bg-white/40 p-10 rounded-[40px] border-2 border-dark/5">
                                    <Text className="text-[10px] uppercase font-elms-bold tracking-[0.3em] text-dark/30 mb-6">
                                        POWERED BY THE ARCHIVE
                                    </Text>
                                    <Text className="text-4xl font-elms-bold italic text-dark tracking-tighter leading-none mb-6">
                                        {DUMMY_QUESTION.sponsor}
                                    </Text>
                                    <Text className="text-xl font-elms-regular italic text-dark/60 leading-relaxed mb-8">
                                        {DUMMY_QUESTION.sponsorBody}
                                    </Text>

                                    <TouchableOpacity className="flex-row items-center gap-3">
                                        <Text className="text-xl font-elms-bold italic text-dark border-b-4 border-primary leading-none">
                                            EXPLORE NODE
                                        </Text>
                                        <Feather name="external-link" size={18} color="#141414" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Exit Action */}
                        <View className="relative w-full mt-16">
                            <TouchableOpacity
                                onPress={handleClose}
                                className="py-4 rounded-[32px] bg-dark items-center"
                            >
                                <Text className="text-primary font-elms-bold italic text-md uppercase tracking-widest">
                                    RETURN TO FEED
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </Animated.View>
    );
}