import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STARTER_OPTIONS } from "@/constants/starters";
import { type StarterId, useGameStore } from "@/store/game";
import { makeStyles } from "@/theme/colors";

const { width: PAGE_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    key: "welcome",
    title: "StableMate",
    body: "Build a Pokémon stable. Battle for prize money. Buy low, mark up, sell high.",
  },
  {
    key: "loop",
    title: "How it works",
    body: "Each round you can buy and sell freely. Battle one fighter to close the round, cash a purse, and refresh the market lot.",
  },
  {
    key: "select",
    title: "Choose your starter",
    body: "You begin with one Pokémon and no cash. Wins fund the rest.",
  },
] as const;

export function WelcomeScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const createState = useGameStore((store) => store.createState);
  const [page, setPage] = useState(0);
  const [selectedStarter, setSelectedStarter] = useState<StarterId | null>(
    null,
  );
  const pagerRef = useRef<ScrollViewInstance>(null);

  const isLastSlide = page === SLIDES.length - 1;

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setPage(nextPage);
  };

  const goNext = () => {
    if (isLastSlide) {
      return;
    }

    const nextPage = page + 1;
    pagerRef.current?.scrollTo({ x: nextPage * PAGE_WIDTH, animated: true });
    setPage(nextPage);
  };

  const onConfirmStarter = () => {
    if (!selectedStarter) {
      return;
    }

    createState(selectedStarter);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width: PAGE_WIDTH }]}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>

            {slide.key === "select" ? (
              <View style={styles.starterList}>
                {STARTER_OPTIONS.map((starter) => {
                  const selected = selectedStarter === starter.id;

                  return (
                    <Pressable
                      key={starter.id}
                      onPress={() => setSelectedStarter(starter.id)}
                      style={[
                        styles.starterCard,
                        selected && styles.starterCardSelected,
                      ]}
                    >
                      <Text style={styles.starterName}>{starter.name}</Text>
                      <Text style={styles.starterType}>{starter.type}</Text>
                      <Text style={styles.starterBlurb}>{starter.blurb}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>

        {isLastSlide ? (
          <Pressable
            onPress={onConfirmStarter}
            disabled={!selectedStarter}
            style={[styles.button, !selectedStarter && styles.buttonDisabled]}
          >
            <Text style={styles.buttonLabel}>Start training</Text>
          </Pressable>
        ) : (
          <Pressable onPress={goNext} style={styles.button}>
            <Text style={styles.buttonLabel}>Next</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  starterList: {
    marginTop: 28,
    gap: 12,
  },
  starterCard: {
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    padding: 16,
  },
  starterCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.separator,
  },
  starterName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  starterType: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  starterBlurb: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fill,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonLabel: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: "600",
  },
}));
