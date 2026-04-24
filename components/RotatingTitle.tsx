import { useEffect, useState } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { LANGUAGE_TITLES } from '../constants/utilities';

const LanguageRotatingTitle = ({ classname }: { classname?: string }) => {
    const [index, setIndex] = useState(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const interval = setInterval(() => {
            opacity.value = withTiming(0, { duration: 250 });
            setIndex((prev) => (prev + 1) % LANGUAGE_TITLES.length);
            opacity.value = withTiming(1, { duration: 250 });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.Text
            style={animatedStyle}
            className={`text-dark text-2xl font-elms-bold text-center ${classname}`}
        >
            {LANGUAGE_TITLES[index]}
        </Animated.Text>
    );
};

export default LanguageRotatingTitle;
