import { useMemo } from "react";
import {
  Easing,
  type SharedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const INTRO = 800;
const HIT = 240;
const RECOVER = 240;
const SHAKE_STEP = 70;
const SHAKE_TOTAL = SHAKE_STEP * 3;
const PAUSE = 900;
const KO_UP = 560;
const KO_DOWN = 700;

/** Everything that moves on one fighter. */
export type FighterMotion = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** The knockout toss, added on top of `y`. */
  flyY: SharedValue<number>;
  rotate: SharedValue<number>;
  nameOpacity: SharedValue<number>;
};

export function useFighterMotion(): FighterMotion {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const flyY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const nameOpacity = useSharedValue(1);
  return useMemo(
    () => ({ x, y, flyY, rotate, nameOpacity }),
    [x, y, flyY, rotate, nameOpacity],
  );
}

function easeOut(to: number, duration: number) {
  return withTiming(to, { duration, easing: Easing.out(Easing.quad) });
}

function easeInOut(to: number, duration: number) {
  return withTiming(to, { duration, easing: Easing.inOut(Easing.quad) });
}

/** Stays put; keeps a skipped step in a sequence the same length. */
function hold() {
  return withTiming(0, { duration: 1 });
}

function shake(amplitude: number) {
  return withSequence(
    withTiming(amplitude, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(-amplitude, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(0, { duration: SHAKE_STEP, easing: Easing.linear }),
  );
}

/** Gravity toss (rise decelerates, fall accelerates) with a spin. */
function knockOut(fighter: FighterMotion, at: number) {
  fighter.nameOpacity.value = withDelay(at, withTiming(0, { duration: 140 }));
  fighter.flyY.value = withDelay(
    at,
    withSequence(
      withTiming(-230, { duration: KO_UP, easing: Easing.out(Easing.cubic) }),
      withTiming(560, { duration: KO_DOWN, easing: Easing.in(Easing.cubic) }),
    ),
  );
  fighter.rotate.value = withDelay(
    at,
    withTiming(720, { duration: KO_UP + KO_DOWN, easing: Easing.inOut(Easing.quad) }),
  );
}

/**
 * Three exchanges: the player lunges, the challenger lunges, then the winner
 * lands a final hit and the loser is knocked out. Returns when (in ms) the
 * result should appear.
 */
export function playBattle(
  player: FighterMotion,
  challenger: FighterMotion,
  playerWins: boolean,
): number {
  const hit1Done = INTRO + HIT + RECOVER;
  const hit2Done = hit1Done + PAUSE + HIT + RECOVER;
  const hit3Done = hit2Done + PAUSE + HIT + RECOVER;
  const koAt = hit3Done + 220;

  // Player: lunge, pause, get shaken, pause, final lunge if winning.
  player.x.value = withSequence(
    withDelay(INTRO, easeOut(56, HIT)),
    easeInOut(0, RECOVER),
    withDelay(PAUSE + HIT, shake(12)),
    withDelay(RECOVER + PAUSE - SHAKE_TOTAL, playerWins ? easeOut(72, HIT) : hold()),
    playerWins ? easeInOut(0, RECOVER) : hold(),
  );
  player.y.value = withSequence(
    withDelay(INTRO, easeOut(-40, HIT)),
    easeInOut(0, RECOVER),
    withDelay(PAUSE + HIT, shake(-8)),
    withDelay(RECOVER + PAUSE - SHAKE_TOTAL, playerWins ? easeOut(-52, HIT) : hold()),
    playerWins ? easeInOut(0, RECOVER) : hold(),
  );

  // Challenger: get shaken, pause, lunge, pause, final lunge if winning.
  challenger.x.value = withSequence(
    withDelay(INTRO + HIT, shake(12)),
    withDelay(PAUSE + RECOVER - SHAKE_TOTAL, easeOut(-56, HIT)),
    easeInOut(0, RECOVER),
    withDelay(PAUSE, playerWins ? hold() : easeOut(-72, HIT)),
    playerWins ? hold() : easeInOut(0, RECOVER),
  );
  challenger.y.value = withSequence(
    withDelay(INTRO + HIT, shake(-8)),
    withDelay(PAUSE + RECOVER - SHAKE_TOTAL, easeOut(40, HIT)),
    easeInOut(0, RECOVER),
    withDelay(PAUSE, playerWins ? hold() : easeOut(52, HIT)),
    playerWins ? hold() : easeInOut(0, RECOVER),
  );

  knockOut(playerWins ? challenger : player, koAt);

  return koAt + KO_UP + KO_DOWN + 250;
}
