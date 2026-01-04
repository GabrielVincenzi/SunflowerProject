import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    ImageSourcePropType,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type HomeHeaderProps = {
    userName?: string;
    logo: ImageSourcePropType;
    avatar?: ImageSourcePropType;
    onLogoPress?: () => void;
    onAvatarPress?: () => void;
    onSearchPress?: () => void;
    onNotifPress?: () => void;
};

export default function HomeHeader({
    userName,
    logo,
    onLogoPress = () => { },
    onNotifPress = () => { },
}: HomeHeaderProps) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <View accessibilityRole="header" className="w-full px-4 pt-3 pb-3 bg-transparent">
            <View className="flex-row items-center justify-between">
                {/* Left: greetings */}
                <View className="flex-row items-center flex-1 gap-2">
                    <TouchableOpacity
                        onPress={onLogoPress}
                        accessibilityLabel="Open app info"
                        accessibilityHint="Opens the app/about or brand area"
                        activeOpacity={0.85}
                    >
                        <Image source={logo} className="w-14 h-14 rounded-lg" resizeMode="contain" accessible accessibilityLabel="App logo" />
                    </TouchableOpacity>
                    <View className="flex-shrink">
                        <Text className="text-xl font-elms-bold text-slate-900" numberOfLines={1} accessible>
                            {timeGreeting}
                            {userName ? `, ${userName}` : '!'}
                        </Text>
                        <Text className="text-sm font-medium text-slate-500" numberOfLines={1}>
                            Ready for today’s challenge?
                        </Text>
                    </View>
                </View>

                {/* Right: actions + logo */}
                <View className="flex-row items-center space-x-3">
                    <TouchableOpacity
                        onPress={onNotifPress}
                        accessibilityLabel="Notifications"
                        accessibilityHint="Open notifications"
                        activeOpacity={0.75}
                        className="p-2 rounded-md"
                    >
                        <Feather name="bell" size={18} />
                    </TouchableOpacity>


                </View>
            </View>
        </View>
    );
}

/*
Usage example (place in your screen file):

import HomeHeader from './components/HomeHeader';
import images from '../assets/images';

<HomeHeader
  userName={user.name}
  logo={images.logoMain}
  avatar={images.userAvatar}
  onLogoPress={() => console.log('logo pressed')}
  onAvatarPress={() => router.push('/profile')}
  onSearchPress={() => router.push('/search')}
  onNotifPress={() => router.push('/notifications')}
/>

Notes:
- This file uses NativeWind `className` for styling. Ensure NativeWind is configured in your project.
- Icons use `@expo/vector-icons` (Feather). Replace or remove if you don't use Expo.
- If you want strict React.FC typing or React.memo, I can add that.
*/
