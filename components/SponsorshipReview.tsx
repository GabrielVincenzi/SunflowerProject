import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FlowHeader, ReviewRow, StepTitle } from "./SponsorshipComponents";
import SunButton from "./SunButton";

type ReviewRow_ = { key: string; val: string };

type Props = {
    pathLabel: string;
    rows: ReviewRow_[];
    onBack: () => void;
    onSubmit: () => void;
};

export default function SponsorshipReview({ pathLabel, rows, onBack, onSubmit }: Props) {
    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
        >
            <Animated.View entering={FadeIn.duration(300)}>
                <FlowHeader onBack={onBack} pathLabel={pathLabel} />

                <StepTitle
                    label="Final Check"
                    title={"Review your\nsynthesis."}
                    subtitle="Submitted sponsorships are reviewed within 24 hours."
                />

                <View className="bg-light/50 rounded-3xl border border-dark/5 px-6 py-2 mb-6">
                    {rows.map((row, i) => (
                        <ReviewRow
                            key={row.key}
                            label={row.key}
                            value={row.val || "—"}
                            last={i === rows.length - 1}
                        />
                    ))}
                </View>

                <Text className="text-center text-[10px] text-grey/30 font-elms-regular leading-relaxed mb-8">
                    {"By submitting you agree to Sunflower's\nSponsorship Guidelines."}
                </Text>

                <SunButton text="Submit Sponsorship" onPress={onSubmit} />

                <TouchableOpacity onPress={onBack} className="mt-4 py-3 items-center">
                    <Text className="text-[11px] font-elms-bold uppercase tracking-widest text-grey/40">
                        Edit details
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
}
