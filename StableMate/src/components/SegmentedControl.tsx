import { Pressable, Text, View } from "react-native";

import { useLargeText } from "@/lib/a11y";
import { makeStyles } from "@/theme/colors";

export type SegmentOption<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  // Side by side, long labels break mid-word at the accessibility text sizes.
  const stacked = useLargeText();
  return (
    <View style={[styles.segmented, stacked && styles.segmentedStacked]}>
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text
              style={[
                styles.segmentLabel,
                selected && styles.segmentLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
  segmentedStacked: {
    flexDirection: "column",
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.onAccent,
  },
}));
