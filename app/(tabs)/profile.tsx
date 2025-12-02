import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect } from "react";
import {
    Button,
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const ROTATION_DURATION = 30000; // slower rotation for a planet-like feel (ms)

const { width: WINDOW_WIDTH } = Dimensions.get("window");

const BigPlanet: React.FC<{
    color?: string;
    size?: number;
    visible_height?: number;
    onPress?: () => void;
}> = ({ color = "#F7DA8A", size = 480, visible_height = 120, onPress }) => {
    const rotate = useSharedValue(0);

    useEffect(() => {
        rotate.value = withRepeat(
            withTiming(360, {
                duration: ROTATION_DURATION,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        return () => cancelAnimation(rotate);
    }, [rotate]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }],
    }));

    const handleFloatingButtonPress = () => {
        // TODO: trigger the transition to floating profile circular modal
        // e.g. set state to open floating view; animate scale/position
        console.log("Floating circle tapped");
    };

    // horizontal centering offset (planet is centered horizontally)
    const planetStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        position: "absolute" as const,
        bottom: -(size / 1.5) + visible_height,
        left: (WINDOW_WIDTH - size) / 2, // center the big circle
    };

    // touch area matching the visible arc — tap here to trigger action
    const touchAreaStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        position: "absolute" as const,
        bottom: -(size / 1.5) + visible_height,
        left: (WINDOW_WIDTH - size) / 2,
    };

    return (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
            <Animated.View style={[planetStyle, animatedStyle]} />

            {/* Pressable area sits over the visible arc */}
            <Pressable
                onPress={handleFloatingButtonPress}
                style={touchAreaStyle}
                android_ripple={{ color: "#00000010", radius: 40 }}
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            />
        </View>
    );
};

const Profile = () => {
    const { isSignedIn, signOut } = useAuth();
    const { user } = useUser();

    const handlePlanetTap = () => {
        // TODO: animate to floating profile + show stats
        console.log("Planet tapped — open floating stats");
    };

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
                className="flex-1 px-10 pt-20"
            >
                {/* Avatar Section */}
                <View className="items-center mb-10">
                    <View className="w-24 h-24 bg-black rounded-full mb-2 relative">
                        {/* Optional: Notification Dot */}
                        <View className="w-4 h-4 bg-black border-2 border-white rounded-full absolute bottom-1 right-1" />
                    </View>
                    <Text className="text-xl font-bold text-black mt-2">UserName</Text>
                    <Text className="text-sm text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</Text>
                </View>

                {/* Options */}
                <TouchableOpacity className="flex-row items-center mb-6" activeOpacity={0.7}>
                    <Feather name="settings" size={20} color="black" />
                    <Text className="text-base text-black ml-4">Preferences</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center mb-6" activeOpacity={0.7}>
                    <Feather name="help-circle" size={20} color="black" />
                    <Text className="text-base text-black ml-4">Customer Support</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center mb-6" activeOpacity={0.7}>
                    <Feather name="log-out" size={20} color="black" />
                    {isSignedIn && <Button title="Sign out" onPress={() => signOut()} />}
                    {!isSignedIn && (
                        <Link href="/" replace asChild>
                            <TouchableOpacity>
                                <Text>Sign up or sign in</Text>
                            </TouchableOpacity>
                        </Link>
                    )}
                </TouchableOpacity>

                {/* spacer so content isn't hidden by the planet arc */}
                <View style={{ height: 220 }} />
            </ScrollView>

            {/* Big rotating planet at the bottom */}
            <BigPlanet
                size={500} // tune this for how round the arc looks
                visible_height={10} // how much of the top is visible
                color="#F7DA8A"
                onPress={handlePlanetTap}
            />
        </View>
    );
};

export default Profile;
