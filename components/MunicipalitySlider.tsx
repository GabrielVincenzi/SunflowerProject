import { THEME_COLORS } from '@/constants/utilities';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, Share, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing, Extrapolation, FadeIn, FadeOut, interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import StatCard from './cards/StatCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Layout constants ─────────────────────────────────────────────────────────
const PEEK = 12;           // px of adjacent card visible on each side
const CARD_GAP = 10;       // gap between cards
const CARD_WIDTH = SCREEN_WIDTH - PEEK * 2;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const CARD_RADIUS = 28;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

// ─── ViewModeToggle ───────────────────────────────────────────────────────────
function ViewModeToggle({
    value,
    onChange,
}: {
    value: 'absolute' | 'perCapita';
    onChange: (v: 'absolute' | 'perCapita') => void;
}) {
    const isPerCapita = value === 'perCapita';

    return (
        <View className="flex-row p-1 rounded-2xl self-start bg-dark/8">
            <TouchableOpacity
                onPress={() => onChange(isPerCapita ? 'absolute' : 'perCapita')}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={isPerCapita ? 'Per capita mode' : 'Absolute mode'}
                className={`border-dark border-2 px-4 py-1.5 rounded-xl ${isPerCapita ? 'bg-background' : 'bg-dark/40'}`}
            >
                <MaterialCommunityIcons
                    name="account"
                    size={18}
                    color={isPerCapita ? THEME_COLORS.dark : THEME_COLORS.primary}
                />
            </TouchableOpacity>
        </View>
    );
}

// ─── AnimatedCard wrapper (handles per-card scale + opacity) ──────────────────
interface AnimatedCardProps {
    index: number;
    scrollX: SharedValue<number>;
    children: React.ReactNode;
}

function AnimatedCard({ index, scrollX, children }: AnimatedCardProps) {
    const animStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * CARD_STEP,
            index * CARD_STEP,
            (index + 1) * CARD_STEP,
        ];
        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.93, 1.0, 0.93],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.6, 1.0, 0.6],
            Extrapolation.CLAMP,
        );
        return { transform: [{ scale }], opacity };
    });

    return (
        <Animated.View
            style={[
                {
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    marginRight: CARD_GAP,
                    borderRadius: CARD_RADIUS,
                    overflow: 'hidden',
                    // Industrial shadow — mirrors ShadowCard offset pattern
                    shadowColor: THEME_COLORS.dark,
                    shadowOffset: { width: 5, height: 5 },
                    shadowOpacity: 0.12,
                    shadowRadius: 0,
                    elevation: 4,
                    borderWidth: 2,
                    borderColor: THEME_COLORS.dark,
                },
                animStyle,
            ]}
        >
            {children}
        </Animated.View>
    );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────
// ActiveDot is extracted as its own component so useAnimatedStyle is called
// at the top level of a component — not inside a .map() callback, which would
// violate the Rules of Hooks.
function ActiveDot() {
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

    return (
        <Animated.View
            style={[
                { height: 3, width: 28, borderRadius: 2, backgroundColor: THEME_COLORS.dark },
                animStyle,
            ]}
        />
    );
}

function InactiveDot() {
    return (
        <View
            style={{
                width: 20,
                height: 3,
                borderRadius: 2,
                backgroundColor: THEME_COLORS.dark,
                opacity: 0.15,
            }}
        />
    );
}

interface ProgressDotsProps {
    count: number;
    activeIndex: number;
}

function ProgressDots({ count, activeIndex }: ProgressDotsProps) {
    return (
        <View className="flex-row items-center justify-center gap-[6px] py-4">
            {Array.from({ length: count }).map((_, i) =>
                i === activeIndex
                    ? <ActiveDot key={i} />
                    : <InactiveDot key={i} />,
            )}
        </View>
    );
}

// ─── Swipe Hint ───────────────────────────────────────────────────────────────
// Arrow bounce is driven by a SharedValue updated in useEffect.
// Never call withRepeat directly inside useAnimatedStyle — it recreates
// the animation on every render instead of running it once.
function SwipeHint({ visible }: { visible: boolean }) {
    const arrowX = useSharedValue(0);

    useEffect(() => {
        if (!visible) return;
        arrowX.value = withRepeat(
            withSequence(
                withTiming(6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );
        return () => { arrowX.value = 0; };
    }, [visible]);

    const arrowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: arrowX.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.delay(800).duration(600)}
            exiting={FadeOut.duration(500)}
            className="flex-row items-center justify-center gap-3 pb-1"
            pointerEvents="none"
        >
            <View className="flex-1 h-[1px] bg-dark/10" />
            <Text className="text-[9px] font-elms-bold text-dark/30 uppercase tracking-widest">
                Swipe to explore
            </Text>
            <Animated.Text className="text-dark/30 text-base" style={arrowStyle}>
                →
            </Animated.Text>
            <View className="flex-1 h-[1px] bg-dark/10" />
        </Animated.View>
    );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
interface BottomSheetProps {
    card: StatCardConfig | null;
    municipalityName: string;
    onClose: () => void;
    onShare: (card: StatCardConfig) => void;
    translateY: SharedValue<number>;
    backdropOpacity: SharedValue<number>;
}

function BottomSheet({
    card,
    municipalityName,
    onClose,
    onShare,
    translateY,
    backdropOpacity,
}: BottomSheetProps) {
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    if (!card) return null;

    return (
        <>
            {/* Backdrop */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(52,58,64,0.55)',
                        zIndex: 40,
                    },
                    backdropStyle,
                ]}
            >
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: SCREEN_HEIGHT * 0.62,
                        zIndex: 50,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        borderWidth: 2,
                        borderColor: THEME_COLORS.dark,
                        backgroundColor: THEME_COLORS.background,
                        overflow: 'hidden',
                    },
                    sheetStyle,
                ]}
            >
                {/* Left accent bar — mirrors SunCard pattern inside the sheet */}
                <View className="absolute left-0 top-[10%] bottom-[10%] w-[4px] bg-primary rounded-r-full z-10" />

                {/* Drag handle */}
                <View className="items-center pt-4 pb-2">
                    <View className="w-10 h-[3px] bg-dark/15 rounded-full" />
                </View>

                <View className="px-8 pt-2 flex-1">
                    {/* Category pill */}
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="bg-dark px-3 py-1.5 rounded-full border-2 border-dark">
                            <Text className="text-primary text-[9px] font-elms-bold uppercase tracking-widest">
                                {card.emoji}  {card.category}
                            </Text>
                        </View>
                        <Text className="text-dark/40 text-[9px] font-elms-bold uppercase tracking-widest">
                            {municipalityName} · {card.year}
                        </Text>
                    </View>

                    {/* Headline */}
                    <Text className="text-5xl font-elms-bold italic tracking-tighter text-dark leading-none mb-1">
                        {card.headline}
                        {card.headlineUnit ? (
                            <Text className="text-xl text-dark/40 font-elms-regular"> {card.headlineUnit}</Text>
                        ) : null}
                    </Text>

                    <Text className="text-sm font-elms-regular italic text-dark/60 leading-snug mb-5">
                        {card.interpretiveLine}
                    </Text>

                    {/* Divider */}
                    <View className="h-[1px] bg-dark/8 mb-5" />

                    {/* Expand rows — extended data table */}
                    {card.expandRows?.map((row, i) => (
                        <View
                            key={i}
                            className="flex-row items-center justify-between py-2.5 border-b border-dark/5"
                        >
                            <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-widest">
                                {row.label}
                            </Text>
                            <Text className="text-sm font-elms-bold italic text-dark tracking-tight">
                                {row.value}
                            </Text>
                        </View>
                    ))}

                    {/* Source */}
                    <View className="mt-4 mb-6">
                        <Text className="text-[8px] font-elms-regular text-dark/30 uppercase tracking-widest">
                            Source · {card.source}
                        </Text>
                    </View>

                    {/* Share button — civic engagement hook */}
                    <View className="relative">
                        <View
                            className="absolute inset-0 bg-dark rounded-[20px]"
                            style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                        />
                        <TouchableOpacity
                            onPress={() => onShare(card)}
                            activeOpacity={0.85}
                            className="bg-dark rounded-[20px] border-2 border-dark py-4 items-center"
                        >
                            <Text className="text-[10px] font-elms-bold text-primary uppercase tracking-[0.4em]">
                                ↗  Share this stat
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </>
    );
}

// ─── Chart Tooltip (long-press) ───────────────────────────────────────────────
interface ChartTooltipProps {
    text: string;
    onDismiss: () => void;
}

function ChartTooltip({ text, onDismiss }: ChartTooltipProps) {
    return (
        <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(300)}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 60,
                marginHorizontal: 16,
                marginTop: 60,
            }}
        >
            <TouchableOpacity onPress={onDismiss} activeOpacity={1}>
                <View
                    style={{
                        backgroundColor: THEME_COLORS.dark,
                        borderRadius: 20,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: THEME_COLORS.dark,
                    }}
                >
                    {/* Tooltip accent + heading */}
                    <View className="flex-row items-center gap-2 mb-3">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                        <Text className="text-[9px] font-elms-bold text-primary/60 uppercase tracking-widest">
                            How to read this chart
                        </Text>
                    </View>
                    <Text className="text-sm font-elms-regular italic text-primary/85 leading-relaxed">
                        {text}
                    </Text>
                    <Text className="text-[8px] font-elms-bold text-primary/30 uppercase tracking-widest mt-4 text-right">
                        Tap to dismiss
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── MunicipalitySlider ───────────────────────────────────────────────────────
function MunicipalitySlider({
    municipalityName,
    provinceCode,
    population,
    year,
    cards,
    onBack,
    viewMode,
    onViewModeChange,
    onShareStat,
}: MunicipalitySliderProps) {
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const [expandedCard, setExpandedCard] = useState<StatCardConfig | null>(null);
    const [tooltipCard, setTooltipCard] = useState<StatCardConfig | null>(null);

    // Bottom sheet animation values
    const sheetTranslateY = useSharedValue(SCREEN_HEIGHT * 0.62);
    const backdropOpacity = useSharedValue(0);

    // ── Scroll handler: drives scale + opacity interpolation ────────────────────
    // Drives smooth scale + opacity animation only — stays on UI thread, no runOnJS.
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: event => {
            scrollX.value = event.contentOffset.x;
        },
    });

    // Drives activeIndex (progress dots, isActive prop) — plain JS callbacks.
    const handleMomentumScrollEnd = useCallback(
        (e: { nativeEvent: { contentOffset: { x: number } } }) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / CARD_STEP);
            setActiveIndex(Math.max(0, Math.min(index, cards.length - 1)));
        },
        [cards.length],
    );

    const handleScrollBeginDrag = useCallback(() => {
        setShowSwipeHint(false);
    }, []);

    // ── Swipe hint: auto-hide after 2 s ─────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setShowSwipeHint(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    // ── Tooltip: auto-dismiss after 3 s ─────────────────────────────────────────
    useEffect(() => {
        if (!tooltipCard) return;
        const timer = setTimeout(() => setTooltipCard(null), 10000);
        return () => clearTimeout(timer);
    }, [tooltipCard]);

    // ── Bottom sheet open / close ────────────────────────────────────────────────
    const openSheet = useCallback((card: StatCardConfig) => {
        setExpandedCard(card);
        sheetTranslateY.value = withSpring(0, {
            damping: 20,
            stiffness: 180,
            mass: 0.8,
        });
        backdropOpacity.value = withTiming(1, { duration: 280 });
    }, []);

    const closeSheet = useCallback(() => {
        sheetTranslateY.value = withSpring(SCREEN_HEIGHT * 0.62, {
            damping: 22,
            stiffness: 200,
        });
        backdropOpacity.value = withTiming(0, { duration: 220 });
        setTimeout(() => setExpandedCard(null), 380);
    }, []);

    // ── Share handler — civic engagement hook ────────────────────────────────────
    const handleShare = useCallback(async (card: StatCardConfig) => {
        const message = `${card.emoji} ${card.headline}${card.headlineUnit ? ' ' + card.headlineUnit : ''} — ${municipalityName} (${card.year})\n\n${card.interpretiveLine}\n\nSource: ${card.source}\n\nExplored via Sunflower · Open Data for Citizens`;
        try {
            await Share.share({ message });
        } catch (_) { }
        onShareStat?.(card);
    }, [municipalityName, onShareStat]);

    // ── Render each card item ────────────────────────────────────────────────────
    const renderItem = useCallback(
        ({ item, index }: { item: StatCardConfig; index: number }) => (
            <AnimatedCard index={index} scrollX={scrollX}>
                <StatCard
                    card={item}
                    cardWidth={CARD_WIDTH}
                    isActive={activeIndex === index}
                    onExpand={() => openSheet(item)}
                    onChartLongPress={() => setTooltipCard(item)}
                />
            </AnimatedCard>
        ),
        [activeIndex, municipalityName, openSheet, scrollX],
    );

    const keyExtractor = (item: StatCardConfig) => item.id;

    // ── Content container style: PEEK inset on both ends ────────────────────────
    const contentContainerStyle = {
        paddingLeft: PEEK,
        paddingRight: PEEK - CARD_GAP, // compensate for the last card's right margin
    };

    return (
        <View style={{ flex: 1 }} className="bg-primary">

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <View className="px-8 pt-6 pb-2">
                {/* Horizontal rule — mirrors welcome slide opener */}
                <View className='flex-row justify-between'>
                    {/* Municipality identity */}
                    <View className='flex-col'>
                        <View className="h-[2px] w-10 bg-dark mb-4" />
                        <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.4em] mb-1">
                            {provinceCode} · {population.toLocaleString()} citizens
                        </Text>
                        <Text
                            className="font-elms-bold italic tracking-tighter text-dark leading-none mb-4"
                            style={{ fontSize: 42 }}
                        >
                            {municipalityName}
                        </Text>
                    </View>

                    {/* Back button (left) + card counter (right) */}
                    <View className='flex-col items-end'>
                        <View className="flex-row items-center justify-between mb-4">
                            {onBack ? (
                                <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                                    <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.4em]">
                                        ← Back
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View />
                            )}
                        </View>

                        {/* ViewMode toggle — only rendered when parent passes props */}
                        {viewMode !== undefined && onViewModeChange ? (
                            <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
                        ) : null}
                    </View>
                </View>
            </View>

            {/* ── Carousel ────────────────────────────────────────────────────────── */}
            <View style={{ height: CARD_HEIGHT, position: 'relative' }}>
                <Animated.FlatList
                    style={{ height: CARD_HEIGHT }}
                    ref={flatListRef}
                    data={cards}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                    snapToInterval={CARD_STEP}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    initialNumToRender={3}
                    windowSize={5}
                    getItemLayout={(_, index) => ({
                        length: CARD_STEP,
                        offset: PEEK + CARD_STEP * index,
                        index,
                    })}
                    contentInset={Platform.OS === 'ios' ? { left: 0, right: 0 } : undefined}
                />

                {/* ── Chart tooltip — overlays the carousel ────────────────────────── */}
                {tooltipCard && (
                    <ChartTooltip
                        text={tooltipCard.tooltipText}
                        onDismiss={() => setTooltipCard(null)}
                    />
                )}
            </View>

            {/* ── Progress dots + swipe hint ──────────────────────────────────────── */}
            <View className="absolute bottom-4 left-0 right-0 z-20">
                <ProgressDots count={cards.length} activeIndex={activeIndex} />
                <SwipeHint visible={showSwipeHint} />
            </View>

            {/* ── Bottom sheet + backdrop ─────────────────────────────────────────── */}
            <BottomSheet
                card={expandedCard}
                municipalityName={municipalityName}
                onClose={closeSheet}
                onShare={handleShare}
                translateY={sheetTranslateY}
                backdropOpacity={backdropOpacity}
            />
        </View>
    );
}

export default MunicipalitySlider;