import {
    ChipRow,
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
import { ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const BUDGETS = [
    { label: "€100", sub: "Local" },
    { label: "€300", sub: "Regional" },
    { label: "€800", sub: "Global" },
];

// Steps: 0=event details 1=organiser+budget 2=review 3=success
export default function EventScreen() {
    const [step, setStep] = useState(0);

    // Step 0
    const [eventTitle, setEventTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [eventLink, setEventLink] = useState("");

    // Step 1
    const [organiserName, setOrganiserName] = useState("");
    const [bio, setBio] = useState("");
    const [contact, setContact] = useState("");
    const [selectedBudget, setSelectedBudget] = useState(1);

    const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

    if (step === 3) {
        return <SuccessScreen onReturn={() => router.replace("/(tabs)/home")} />;
    }

    if (step === 2) {
        return (
            <SponsorshipReview
                pathLabel="Event"
                onBack={() => setStep(1)}
                onSubmit={() => setStep(3)}
                rows={[
                    { key: "Type", val: "Event Sponsorship" },
                    { key: "Event", val: eventTitle },
                    { key: "Date", val: date },
                    { key: "Location", val: location },
                    { key: "Budget", val: BUDGETS[selectedBudget].label },
                    { key: "Organiser", val: organiserName },
                    { key: "Link", val: eventLink },
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
            <Animated.View key={`event-step-${step}`} className="mt-12"
                entering={FadeInDown.duration(400).springify()}>
                <FlowHeader onBack={goBack} pathLabel="Event" />
                <StepDots total={2} current={step} />

                {/* ── Step 0: Event details ─────────────────────────── */}
                {step === 0 && (
                    <>
                        <StepTitle
                            label="Event Details"
                            title={"Define your\nevent."}
                            subtitle="This will appear as a sponsored card in the Sunflower feed."
                        />

                        <FieldLabel>Event title</FieldLabel>
                        <TextInput
                            value={eventTitle}
                            onChangeText={setEventTitle}
                            placeholder="Signal Summit 2025"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Description</FieldLabel>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="A gathering for data-driven thinkers exploring cognitive models..."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            multiline
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                            style={{ minHeight: 88, textAlignVertical: "top" }}
                        />

                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <FieldLabel>Date</FieldLabel>
                                <TextInput
                                    value={date}
                                    onChangeText={setDate}
                                    placeholder="12 Oct 2025"
                                    placeholderTextColor="rgba(52,58,64,0.25)"
                                    className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm"
                                />
                            </View>
                            <View className="flex-1">
                                <FieldLabel>Location</FieldLabel>
                                <TextInput
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Bologna, IT"
                                    placeholderTextColor="rgba(52,58,64,0.25)"
                                    className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm"
                                />
                            </View>
                        </View>

                        <FieldLabel>Event link</FieldLabel>
                        <TextInput
                            value={eventLink}
                            onChangeText={setEventLink}
                            placeholder="signalsummit.io"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            autoCapitalize="none"
                            keyboardType="url"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-8"
                        />
                    </>
                )}

                {/* ── Step 1: Organiser + budget ───────────────────── */}
                {step === 1 && (
                    <>
                        <StepTitle
                            label="Organiser"
                            title={"Who's running\nthis event?"}
                            subtitle="Shown as the organiser on the event card in the feed."
                        />

                        <FieldLabel>Organiser name</FieldLabel>
                        <TextInput
                            value={organiserName}
                            onChangeText={setOrganiserName}
                            placeholder="Inquiry Labs"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                        />

                        <FieldLabel>Short bio</FieldLabel>
                        <TextInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Advancing human cognition through structured visualization."
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            multiline
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-5"
                            style={{ minHeight: 72, textAlignVertical: "top" }}
                        />

                        <FieldLabel>Contact / link</FieldLabel>
                        <TextInput
                            value={contact}
                            onChangeText={setContact}
                            placeholder="inquiry.labs/summit"
                            placeholderTextColor="rgba(52,58,64,0.25)"
                            autoCapitalize="none"
                            keyboardType="url"
                            className="bg-light/50 border border-dark/10 rounded-2xl px-4 py-4 font-elms-regular text-dark text-sm mb-6"
                        />

                        <FieldLabel>Promotion reach</FieldLabel>
                        <ChipRow
                            options={BUDGETS}
                            selected={selectedBudget}
                            onSelect={setSelectedBudget}
                        />
                    </>
                )}

                <View className="mt-2">
                    <SunButton
                        text={step === 1 ? "Review →" : "Continue →"}
                        onPress={() => setStep((s) => s + 1)} />
                </View>
            </Animated.View>
        </ScrollView>
    );
}
