import { fireEvent, screen } from "@testing-library/react-native";

import { useGameStore } from "@/store/game";

import { renderApp, resetStores, withinTab } from "../test/renderApp";

beforeEach(resetStores);

async function goToStarterSlide() {
  await renderApp();
  await fireEvent.press(screen.getByText("Next"));
  await fireEvent.press(screen.getByText("Next"));
}

test("O1 · slides advance with Next", async () => {
  await renderApp();

  expect(screen.getByText("StableMate")).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("Next"));
  expect(screen.getByText("How it works")).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("Next"));
  expect(screen.getByText("Choose your starter")).toBeOnTheScreen();

  expect(screen.queryByText("Next")).not.toBeOnTheScreen();
  expect(screen.getByText("Start training")).toBeOnTheScreen();
  for (const name of ["Bulbasaur", "Charmander", "Squirtle"]) {
    expect(screen.getByText(name)).toBeOnTheScreen();
  }
});

test("O3 · Start training does nothing until a starter is picked", async () => {
  await goToStarterSlide();

  await fireEvent.press(screen.getByText("Start training"));

  expect(screen.getByText("Choose your starter")).toBeOnTheScreen();
  expect(useGameStore.getState().state).toBeNull();
});

test.each([
  ["Bulbasaur", "Grass", "$438"],
  ["Charmander", "Fire", "$426"],
  ["Squirtle", "Water", "$433"],
])(
  "O4 · picking %s starts the game with it",
  async (name, type, listPrice) => {
    await goToStarterSlide();

    await fireEvent.press(screen.getByText(name));
    await fireEvent.press(screen.getByText("Start training"));

    expect(await screen.findByText("Starter")).toBeOnTheScreen();
    const overview = withinTab("index");
    expect(overview.getByText(name)).toBeOnTheScreen();
    expect(overview.getByText(type)).toBeOnTheScreen();
    expect(overview.getByText("$0")).toBeOnTheScreen();
    // Net worth = cash $0 + the starter at its list price.
    expect(overview.getByText(listPrice)).toBeOnTheScreen();
    expect(
      overview.getByText("Win a prize or trade to start the chart."),
    ).toBeOnTheScreen();

    const stable = withinTab("stable");
    expect(stable.getByText("1 Pokémon owned")).toBeOnTheScreen();
    expect(stable.getByText(name)).toBeOnTheScreen();
    expect(stable.getByText(listPrice)).toBeOnTheScreen();

    const history = withinTab("history");
    expect(history.getByText("No transactions yet")).toBeOnTheScreen();
    expect(history.getByText("0 transactions")).toBeOnTheScreen();
  },
);

test("O5 · changing the selection before confirming uses the last pick", async () => {
  await goToStarterSlide();

  await fireEvent.press(screen.getByText("Bulbasaur"));
  await fireEvent.press(screen.getByText("Charmander"));
  await fireEvent.press(screen.getByText("Start training"));

  expect(await screen.findByText("Starter")).toBeOnTheScreen();
  expect(withinTab("index").getByText("Charmander")).toBeOnTheScreen();
  expect(screen.queryByText("Bulbasaur")).not.toBeOnTheScreen();
});
