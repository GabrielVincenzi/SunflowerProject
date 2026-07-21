import {
    FieldLabel,
    FlowHeader,
    StepDots,
    StepTitle,
    SuccessScreen
} from "@/components/SponsorshipComponents";
import SponsorshipReview from "@/components/SponsorshipReview";
import SunButton from "@/components/SunButton";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Choice = { id: number; text: string; correct: boolean };

const DUMMY_CHARTS = [
    { id: "1", name: "EU GDP Growth 2000–2024", category: "Economics · Line" },
    { id: "2", name: "Capital Investment by Sector", category: "Economics · Bar" },
    { id: "3", name: "R&D Spending per Capita", category: "Technology · Heatmap" },
    { id: "4", name: "Global Trade Balance Index", category: "Economics · Area" },
];

// Steps: 0=question 1=choices 2=chart 3=identity 4=review 5=success
export default function InquiryScreen() {
    const [step, setStep] = useState(0);

    // Step 0
    const [questionTitle, setQuestionTitle] = useState("");
    const [questionBody, setQuestionBody] = useState("");
    const [explanation, setExplanation] = useState("");

    // Step 1
    const [choices, setChoices] = useState<Choice[]>([
        { id: 1, text: "", correct: true },
        { id: 2, text: "", correct: false },
        { id: 3, text: "", correct: false },
        { id: 4, text: "", correct: false },
    ]);

    // Step 2
    const [selectedChart, setSelectedChart] = useState<string | null>(null);

    // Step 3
    const [sponsorName, setSponsorName] = useState("");
    const [tagline, setTagline] = useState("");
    const [link, setLink] = useState("");

    const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

    const markCorrect = (id: number) => {
        setChoices((prev) =>
            prev.map((c) => ({ ...c, correct: c.id === id }))
        );
    };

    const updateChoice = (id: number, text: string) => {
        setChoices((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
    };

    if (step === 5) {
        return <SuccessScreen onReturn={() => router.replace("/(tabs)/home")} />;
    }

    if (step === 4) {
        const attachedChart = DUMMY_CHARTS.find((c) => c.id === selectedChart);
        return (
            <SponsorshipReview
                pathLabel="Inquiry"
                onBack={() => setStep(3)}
                onSubmit={() => setStep(5)}
                rows={[
                    { key: "Type", val: "Inquiry Creation" },
                    { key: "Question", val: questionTitle },
                    { key: "Choices", val: `${choices.filter((c) => c.text).length} defined` },
                    { key: "Chart", val: attachedChart?.name ?? "None" },
                    { key: "Sponsor", val: sponsorName },
                    { key: "Link", val: link },
                ]}
            />
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <Animated.View key={`inquiry-step-${step}`} className="mt-12"
                entering={FadeInDown.duration(400).springify()}>
                <FlowHeader onBack={goBack} pathLabel="Inquiry" />
                <StepDots total={4} current={step} />

                {/* ── Step 0: Question ─────────────────────────────── */}
                {step === 0 && (
                    <>
                        <StepTitle
                            label="The Question"
                            title={"Frame your\ninquiry."}
                            subtitle="Write the question users will see in the feed."
                        />

                        <FieldLabel>Question title</FieldLabel>
                        <TextInput
                            value={questionTitle}
                            onChangeText={setQuestionTitle}
                            placeholder="What drives long-term GDP growth?"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Body / context</FieldLabel>
                        <TextInput
                            value={questionBody}
                            onChangeText={setQuestionBody}
                            placeholder="Select the primary mechanism studied in structural economic models."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            multiline
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-5"
                            style={{ minHeight: 88, textAlignVertical: "top" }}
                        />

                        <FieldLabel>Explanation (shown after answer)</FieldLabel>
                        <TextInput
                            value={explanation}
                            onChangeText={setExplanation}
                            placeholder="Capital accumulation and technology diffusion are the two consensus drivers..."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            multiline
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-8"
                            style={{ minHeight: 88, textAlignVertical: "top" }}
                        />
                    </>
                )}

                {/* ── Step 1: Choices ──────────────────────────────── */}
                {step === 1 && (
                    <>
                        <StepTitle
                            label="Answer Choices"
                            title={"Define the\nsignal space."}
                            subtitle="Tap a choice to mark it as correct. Add up to 4 options."
                        />

                        <View className="gap-3 mb-8">
                            {choices.map((choice, idx) => (
                                <View
                                    key={choice.id}
                                    className={`rounded-2xl border overflow-hidden ${choice.correct
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-dark/8 bg-light/40"
                                        }`}
                                >
                                    <TextInput
                                        value={choice.text}
                                        onChangeText={(t) => updateChoice(choice.id, t)}
                                        placeholder={`Choice ${idx + 1}`}
                                        placeholderTextColor="rgba(52,58,64,0.2)"
                                        className="px-4 py-3.5 font-sf-regular text-dark text-sm flex-1"
                                    />
                                    <TouchableOpacity
                                        onPress={() => markCorrect(choice.id)}
                                        className={`flex-row items-center gap-2 px-4 py-2.5 border-t ${choice.correct
                                            ? "border-primary/20 bg-primary/10"
                                            : "border-dark/5 bg-transparent"
                                            }`}
                                    >
                                        <View
                                            className={`w-4 h-4 rounded-full border-[1.5px] items-center justify-center ${choice.correct
                                                ? "border-dark bg-dark"
                                                : "border-dark/20"
                                                }`}
                                        >
                                            {choice.correct && (
                                                <View className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                        </View>
                                        <Text
                                            className={`text-[10px] font-sf-bold uppercase tracking-widest ${choice.correct ? "text-dark" : "text-grey/40"
                                                }`}
                                        >
                                            {choice.correct ? "Correct" : "Mark as correct"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── Step 2: Chart attach ─────────────────────────── */}
                {step === 2 && (
                    <>
                        <StepTitle
                            label="Attach a Chart"
                            title={"Ground it\nin data."}
                            subtitle="The question will appear contextually alongside this chart."
                        />

                        <TextInput
                            placeholder="Search charts..."
                            placeholderTextColor="rgba(52,58,64,0.3)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-3.5 font-sf-regular text-dark text-sm mb-4"
                        />

                        <View className="gap-2.5 mb-8">
                            {DUMMY_CHARTS.map((chart) => {
                                const active = selectedChart === chart.id;
                                return (
                                    <TouchableOpacity
                                        key={chart.id}
                                        onPress={() =>
                                            setSelectedChart(active ? null : chart.id)
                                        }
                                        activeOpacity={0.8}
                                        className={`flex-row items-center gap-4 p-4 rounded-2xl border ${active
                                            ? "bg-dark border-dark"
                                            : "bg-light/40 border-dark/8"
                                            }`}
                                    >
                                        {/* Placeholder chart icon */}
                                        <View
                                            className={`w-11 h-11 rounded-xl items-center justify-center ${active
                                                ? "bg-primary/20"
                                                : "bg-dark/5"
                                                }`}
                                        />
                                        <View className="flex-1">
                                            <Text
                                                className={`text-sm font-sf-bold mb-0.5 ${active ? "text-light" : "text-dark"
                                                    }`}
                                                numberOfLines={1}
                                            >
                                                {chart.name}
                                            </Text>
                                            <Text
                                                className={`text-[10px] font-sf-bold uppercase tracking-wide ${active ? "text-light/40" : "text-grey/40"
                                                    }`}
                                            >
                                                {chart.category}
                                            </Text>
                                        </View>
                                        {active && (
                                            <View className="w-5 h-5 rounded-full bg-primary/30 items-center justify-center">
                                                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* ── Step 3: Sponsor identity ─────────────────────── */}
                {step === 3 && (
                    <>
                        <StepTitle
                            label="Your Identity"
                            title={"Who's behind\nthis inquiry?"}
                            subtitle="Shown to users after they answer."
                        />

                        <FieldLabel>Sponsor name</FieldLabel>
                        <TextInput
                            value={sponsorName}
                            onChangeText={setSponsorName}
                            placeholder="Inquiry Labs"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Tagline</FieldLabel>
                        <TextInput
                            value={tagline}
                            onChangeText={setTagline}
                            placeholder="Advancing cognition through data."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Link</FieldLabel>
                        <TextInput
                            value={link}
                            onChangeText={setLink}
                            placeholder="yoursite.com"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            autoCapitalize="none"
                            keyboardType="url"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-sf-regular text-dark text-sm mb-8"
                        />
                    </>
                )}
                <View className="mt-2">
                    <SunButton
                        text={step === 3 ? "Review →" : "Continue →"}
                        onPress={() => setStep((s) => s + 1)}
                        disabled={step === 2 && !selectedChart} />
                </View>
            </Animated.View>
        </ScrollView>
    );
}
