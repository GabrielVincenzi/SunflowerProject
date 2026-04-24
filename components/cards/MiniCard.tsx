import { Text, TouchableOpacity, View } from "react-native";


export const MiniCard = ({ icon, title, description, onPress, isDark = false, onPressIn = undefined, onPressOut = undefined }: any) => (
    <View className="flex-1 relative aspect-square">
        {/* The Shadow Layer */}
        <View
            className="absolute inset-0 bg-dark rounded-[40px]"
            style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}
        />
        {/* The Content Layer */}
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            className={`flex-1 rounded-[40px] p-6 justify-between overflow-hidden border-2 border-dark ${isDark ? 'bg-dark' : 'bg-white'}`}
        >
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <Text className={`text-xs font-elms-bold  ${isDark ? 'text-white' : 'text-dark'} italic`}>{icon}</Text>
            </View>
            <View>
                <Text className={`text-2xl font-elms-bold tracking-tighter ${isDark ? 'text-white' : 'text-dark'} italic leading-tight`}>{title}</Text>
                <Text className={`text-[10px]  ${isDark ? 'text-white/40' : 'text-dark/40'}  mt-1 uppercase font-elms-regular tracking-widest leading-none`}>{description}</Text>
            </View>
        </TouchableOpacity>
    </View>
);