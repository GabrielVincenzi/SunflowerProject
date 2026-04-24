import { Feather } from "@expo/vector-icons";
import React, { useEffect } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48; // Tightened width
const TAB_WIDTH = TAB_BAR_WIDTH / 4;
const SQUARE_SIZE = 44; // Distinct square size
const CENTER_OFFSET = (TAB_WIDTH - SQUARE_SIZE) / 2;

const SunTabBar = ({ state, navigation }: any) => {
    const translateX = useSharedValue(CENTER_OFFSET);

    // Update the position of the sliding square with precise centering
    useEffect(() => {
        translateX.value = withSpring(state.index * TAB_WIDTH + CENTER_OFFSET, {
            stiffness: 400,
            damping: 28,
            mass: 0.6,
        });
    }, [state.index]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View className="absolute bottom-4 left-0 right-0 items-center px-4">
            {/* 2. Main Navigation Container */}
            <View
                className="bg-white border-2 border-[#141414] rounded-[24px] flex-row items-center py-6"
                style={{ width: TAB_BAR_WIDTH }}
            >
                {/* 3. The Floating Brutalist Indicator */}
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            position: 'absolute',
                            width: SQUARE_SIZE,
                            height: SQUARE_SIZE,
                            backgroundColor: '#F7CE46',
                            borderWidth: 2,
                            borderColor: '#141414',
                            borderRadius: 12,
                        }
                    ]}
                />

                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Map Feather icons to routes
                    let iconName: any;
                    switch (route.name) {
                        case 'home': iconName = "home"; break;
                        case 'search': iconName = "search"; break;
                        case 'saved': iconName = "bookmark"; break;
                        case 'profile': iconName = "user"; break;
                        default: iconName = "grid";
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.7}
                            onPress={onPress}
                            className="flex-1 items-center justify-center h-full"
                        >
                            <Feather
                                name={iconName}
                                size={22} // Scaled down for high-impact precision
                                color="#141414"
                                style={{
                                    opacity: isFocused ? 1 : 0.35,
                                    transform: [{ translateY: 0 }]
                                }}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default SunTabBar;