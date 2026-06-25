import { THEME_COLORS } from "@/constants/utilities";
import React, { useEffect } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { EducIcon } from "../icons/EducIcon";
import { GridIcon } from "../icons/GridIcon";
import { HomeIcon } from "../icons/HomeIcon";
import { ProfileIcon } from "../icons/ProfileIcon";
import { SavedIcon } from "../icons/SavedIcon";
import { SearchIcon } from "../icons/SearchIcon";


const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48;
const SQUARE_SIZE = 44;


// Map route names to SVG components
const getIconComponent = (routeName: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
        'home': HomeIcon,
        'search': SearchIcon,
        'saved': SavedIcon,
        'profile': ProfileIcon,
        'search2': GridIcon,
        'greenhouse': EducIcon,
    };
    return iconMap[routeName] || GridIcon;
};

const SunTabBar = ({ state, navigation }: any) => {
    const translateX = useSharedValue(0);

    useEffect(() => {
        const tabWidth = TAB_BAR_WIDTH / state.routes.length;
        const centerOffset = (tabWidth - SQUARE_SIZE) / 2;

        translateX.value = withSpring(
            state.index * tabWidth + centerOffset,
            {
                stiffness: 400,
                damping: 28,
                mass: 0.6,
            }
        );
    }, [state.index, state.routes.length]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View className="absolute bottom-4 left-0 right-0 items-center px-4">
            <View
                className="bg-white border-2 border-dark rounded-[24px] flex-row items-center py-6"
                style={{ width: TAB_BAR_WIDTH }}
            >
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            position: 'absolute',
                            width: SQUARE_SIZE,
                            height: SQUARE_SIZE,
                            backgroundColor: THEME_COLORS.primary,
                            borderWidth: 2,
                            borderColor: THEME_COLORS.dark,
                            borderRadius: 12,
                        }
                    ]}
                />

                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const IconComponent = getIconComponent(route.name);

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

                    return (
                        <TouchableOpacity
                            key={route.key}
                            activeOpacity={0.7}
                            onPress={onPress}
                            className="flex-1 items-center justify-center h-full"
                        >
                            <IconComponent
                                size={22}
                                color={THEME_COLORS.dark}
                                style={{
                                    opacity: isFocused ? 1 : 0.35,
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