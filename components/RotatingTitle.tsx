import { useEffect, useState } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const TITLES = [
    'Choose your language',
    'Scegli la tua lingua',
    'Choisissez votre langue',
    'Sprache auswählen',
    'Elige tu idioma',
    'Kies je taal',
];

const LanguageRotatingTitle = ({ classname }: { classname?: string }) => {
    const [index, setIndex] = useState(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const interval = setInterval(() => {
            opacity.value = withTiming(0, { duration: 250 });
            setIndex((prev) => (prev + 1) % TITLES.length);
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
            {TITLES[index]}
        </Animated.Text>
    );
};

export default LanguageRotatingTitle;
