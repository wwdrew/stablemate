import type { StarterId } from "@/store/game";

export type StarterOption = {
  id: StarterId;
  name: string;
  type: string;
  blurb: string;
};

export const STARTER_OPTIONS: StarterOption[] = [
  {
    id: "bulbasaur",
    name: "Bulbasaur",
    type: "Grass",
    blurb: "Steady growth. Marks up well after wins.",
  },
  {
    id: "charmander",
    name: "Charmander",
    type: "Fire",
    blurb: "High ceiling. Bigger purses, sharper drops.",
  },
  {
    id: "squirtle",
    name: "Squirtle",
    type: "Water",
    blurb: "Reliable fighter. Easier early cashflow.",
  },
];
