import {
    ChipRow,
    FieldLabel,
    FlowHeader,
    PrimaryButton,
    StepDots,
    StepTitle,
    SuccessScreen,
    TagCloud,
} from "@/components/SponsorshipComponents";
import SponsorshipReview from "@/components/SponsorshipReview";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const BUDGETS = [
    { label: "€50", sub: "~2k views" },
    { label: "€150", sub: "~8k views" },
    { label: "€400", sub: "~25k views" },
];
const DURATIONS = [
    { label: "7 days" },
    { label: "14 days" },
    { label: "30 days" },
];
const TOPICS = ["Economics", "Climate", "Technology", "Health", "Politics", "Finance"];

// Steps: 0=budget 1=identity 2=review 3=success
export default function SignalScreen() {
    const [step, setStep] = useState(0);

    // Step 0 state
    const [selectedBudget, setSelectedBudget] = useState(1);
    const [selectedDuration, setSelectedDuration] = useState(1);
    const [selectedTopics, setSelectedTopics] = useState<string[]>(["Economics", "Technology"]);

    // Step 1 state
    const [sponsorName, setSponsorName] = useState("");
    const [tagline, setTagline] = useState("");
    const [link, setLink] = useState("");

    const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

    if (step === 3) {
        return <SuccessScreen onReturn={() => router.replace("/(tabs)/home")} />;
    }

    if (step === 2) {
        return (
            <SponsorshipReview
                pathLabel="Signal"
                onBack={() => setStep(1)}
                onSubmit={() => setStep(3)}
                rows={[
                    { key: "Type", val: "Signal Sponsorship" },
                    { key: "Budget", val: `${BUDGETS[selectedBudget].label} / ${DURATIONS[selectedDuration].label}` },
                    { key: "Topics", val: selectedTopics.join(", ") },
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
            <Animated.View key={`signal-step-${step}`} className="mt-12"
                entering={FadeInDown.duration(400).springify()}>
                <FlowHeader onBack={goBack} pathLabel="Signal" />
                <StepDots total={2} current={step} />

                {step === 0 && (
                    <>
                        <StepTitle
                            label="Reach & Budget"
                            title={"How wide is\nyour signal?"}
                            subtitle="Questions are matched by our algorithm based on topic affinity."
                        />

                        <FieldLabel>Estimated reach</FieldLabel>
                        <ChipRow
                            options={BUDGETS}
                            selected={selectedBudget}
                            onSelect={setSelectedBudget}
                        />

                        <FieldLabel>Topic affinity</FieldLabel>
                        <TagCloud
                            tags={TOPICS}
                            selected={selectedTopics}
                            onToggle={(t) =>
                                setSelectedTopics((prev) =>
                                    prev.includes(t)
                                        ? prev.filter((x) => x !== t)
                                        : [...prev, t]
                                )
                            }
                        />

                        <FieldLabel>Duration</FieldLabel>
                        <ChipRow
                            options={DURATIONS}
                            selected={selectedDuration}
                            onSelect={setSelectedDuration}
                        />
                    </>
                )}

                {step === 1 && (
                    <>
                        <StepTitle
                            label="Your Identity"
                            title={"Who's behind\nthe signal?"}
                            subtitle="This is shown below every sponsored question."
                        />

                        <FieldLabel>Sponsor name</FieldLabel>
                        <TextInput
                            value={sponsorName}
                            onChangeText={setSponsorName}
                            placeholder="Inquiry Labs"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Tagline</FieldLabel>
                        <TextInput
                            value={tagline}
                            onChangeText={setTagline}
                            placeholder="Advancing cognition through data."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            multiline
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                            style={{ minHeight: 88, textAlignVertical: "top" }}
                        />

                        <FieldLabel>Link</FieldLabel>
                        <TextInput
                            value={link}
                            onChangeText={setLink}
                            placeholder="yoursite.com"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            autoCapitalize="none"
                            keyboardType="url"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-8"
                        />
                    </>
                )}

                <View className="mt-2">
                    <PrimaryButton
                        label={step === 1 ? "Review →" : "Continue →"}
                        onPress={() => setStep((s) => s + 1)}
                        disabled={step === 0 && selectedTopics.length === 0}
                    />
                </View>
            </Animated.View>
        </ScrollView>
    );
}
