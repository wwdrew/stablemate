# StableMate test scenarios

Feature coverage for integration (RNTL) and E2E (Maestro). Each scenario is tagged:

- **[Both]** — same steps/assertions work in RNTL and Maestro
- **[RNTL]** — needs mocking, store seeding, fake timers, or invariant checks Maestro can't do
- **[E2E]** — needs a real device/process (relaunch, Android back, native alerts)

## 0. Conventions

### Determinism levers

| Randomness | RNTL | Maestro |
|---|---|---|
| Battle result | Options → Battle outcome, or `jest.spyOn(battle, "rollPlayerWins")` | Options → `Always win` / `Always lose` |
| Challenger (→ prize amount) | `jest.spyOn(battle, "pickChallenger")` → fixed species (e.g. Onix) | ✗ — assert prize via pattern or copied text |
| Settlement result | Options → Settlement outcome, or mock `decideSettlement` | Options → `Always settle` / `Always fail` |
| Settlement latency (1500ms) | fake timers + `act(() => jest.advanceTimersByTime(SETTLEMENT_LATENCY_MS))` | Online, it settles before Maestro can look. Go offline to assert pending, then `extendedWaitUntil` after reconnecting |
| Battle animation (~5.8s to Continue) | fake timers | `extendedWaitUntil: visible: "Continue"` (timeout 10000) |
| Market lot | seed store / mock `generateMarketLot` | ✗ — `open-affordable-listing` taps a row and battles until it's affordable; read the price with `copyTextFrom` |
| Starting cash | `useGameStore.setState(...)` | grind: `open-affordable-listing` (see below) |

### Selectors: on-screen text, not testIDs

Assertions read the text the user sees, so a test also checks the copy. Notes:

1. **Scope by tab (RNTL).** Native tabs keep every tab mounted, so text such as a starter's name or a price appears on several tabs at once. Query with `withinTab("index" | "history" | "stable" | "buy" | "options")` from `test/renderApp.tsx`. Maestro only sees the visible tab, so it doesn't need this.
2. **Scope by screen (RNTL).** A detail modal sits on top of the list it came from. Use `withinScreenContaining("Base stats")` for the Pokémon detail screen, or any text unique to the screen you want.
3. **`textTransform` text.** RNTL matches the *source* string; Maestro sees the *rendered* one (verified). This affects uppercase labels: ledger types (`PRIZE`, `PURCHASE · PENDING`), Overview card labels, and the stable badge (`BUYING · PENDING`). Pokémon types are capitalised in JS (`formatTypes`), not with `textTransform`, because iOS `capitalize` also lowercased the record (`1w–0l`).
4. **Curly apostrophes.** Several strings use `’` (e.g. `This round’s market lot`, `You can’t sell your last Pokémon.`). Copy them exactly, or match with `.*` / a regex.
5. **Dynamic values** (prize, listing price, cash). RNTL pins them with spies (`pickChallenger`) or seeded store state, then asserts the computed string. Maestro reads them with `copyTextFrom` (e.g. `Prize \+\$\d+`), pulls the number out with `evalScript: ${output.prize = maestro.copiedText.match(/[0-9][0-9,]*/)[0]}`, then asserts `\$${output.prize}`. A literal `$` inside `${…}` breaks Maestro's parser, hence the regex.
6. **Grouped labels (Maestro).** A pressable row or card is one accessibility element whose label joins its texts with `, `, e.g. `Squirtle, Water · 1W–0L, $459` or `PRIZE, Battle prize, Squirtle beat Onix, +$157, Bal $157`. Maestro text selectors match the whole label as a regex, so use `Squirtle, .*`-style patterns.
7. **Lists (RNTL).** `LegendList` is mapped to `FlatList` in `jest.setup.ts`. LegendList renders no rows without measured layout, and FlatList renders its first 10 rows. Long-list scenarios must scroll or keep the ledger short.

### RNTL harness

The harness lives in `StableMate/` and runs with `npm test`:

- **Config:** jest-expo preset, configured in `package.json`. `transformIgnorePatterns` also allows `nitro-core`, `standard-navigation` and `@legendapp/*` to be transformed.
- **`jest.setup.ts`:**
  - worklets mock
  - Reanimated `setUpTests()`, with the `.native` initializer redirected (a Reanimated 4 + jest-expo incompatibility)
  - in-memory MMKV
  - LegendList mapped to FlatList
- **`test/renderApp.tsx`:**
  - `renderApp(initialUrl)` renders the real `src/app` via `renderRouter`. Deep-link straight to a screen, e.g. `/stable/squirtle-starter` after `createState("squirtle")`.
  - `resetStores()` runs in `beforeEach`.
  - `withinTab` and `withinScreenContaining` scope queries.
- **RNTL v14 is async.** `await fireEvent.press(...)`, `await renderApp(...)`, and wrap timer advances in `await act(() => jest.runAllTimers())`.
- **Battle overlay:** use `jest.useFakeTimers()`, then `runAllTimers()` after pressing Battle to reach `Continue`.

### Maestro flows

Flows live in `StableMate/.maestro/` and run against the dev build on a booted simulator with Metro running (`npm run e2e`). Each flow starts from a fresh install.

| Flow | Covers |
|---|---|
| `onboarding.yaml` | O1, O3, O4, O6 |
| `battle.yaml` | B1, B2, B3, B7 |
| `money.yaml` | P4, P3, P7, S4, S3, S2 |
| `options.yaml` | OP1, OP2 |

Subflows in `.maestro/subflows/`:

- `launch.yaml` — `launchApp: clearState: true`, connect the dev client to Metro, dismiss the dev-menu intro
- `start-game.yaml` — launch → Next → Next → `${STARTER}` (default Squirtle) → Start training
- `set-overrides.yaml` — Options → `${BATTLE}` and/or `${SETTLEMENT}` → Overview
- `toggle-network.yaml` — Options → the `Network` switch → Overview
- `battle.yaml` — Stable → `${FIGHTER}` → Battle → Continue → close the modal
- `open-affordable-listing.yaml` — Buy → a listing; while `Insufficient funds`, battle and try again. Leaves the price in `${output.price}`
- `close-modal.yaml` — swipe the detail modal down

Reference values, with Squirtle as the default starter:

- **List price $433.** Bulbasaur $438, Charmander $426.
- **After 1W:** $459.
- **After 1L:** $407.
- **Prize range:** $91–$174.

---

## 1. Onboarding

**O1 · Slides advance with Next** [Both] ✅ RNTL · Maestro
- Fresh install
- `StableMate` visible → tap `Next` → `How it works` visible → tap `Next` → `Choose your starter` visible
- Expect: `Start training` replaces `Next` on the last slide; three starter cards are visible

**O2 · Slides advance by swiping** [E2E]
- Swipe left twice → `Choose your starter` visible, `Start training` button shown

**O3 · Start is disabled until a starter is picked** [Both] ✅ RNTL · Maestro
- Reach the last slide → tap `Start training`
- Expect: still on onboarding (RNTL: game state stays `null`)

**O4 · Picking each starter** [Both] ✅ RNTL · Maestro (parameterise over Bulbasaur / Charmander / Squirtle)
- Pick `${STARTER}` → `Start training`
- Expect on Overview:
  - Starter card shows `${STARTER}` and its type (`Grass` / `Fire` / `Water`)
  - Cash `$0`, Rounds played `0`, Stable size `1`
  - Net worth equals the starter's list price ($438 / $426 / $433)
  - Chart shows `Win a prize or trade to start the chart.`
- Expect on Stable: `1 Pokémon owned`; row `${STARTER}` · `0W–0L` · list price
- Expect on History: `No transactions yet`, `0 transactions`, balance `$0`

**O5 · Selection changes before confirming** [Both] ✅ RNTL
- Tap Bulbasaur → tap Charmander → Start training
- Expect: Overview starter is `Charmander`, not Bulbasaur

**O6 · Game persists across relaunch** [E2E] ✅ Maestro
- O4 → `launchApp` (no `clearState`)
- Expect: lands on Overview, not onboarding; same starter

---

## 2. Battling

Setup for all: O4 with Squirtle.

**B1 · Win** [Both] ✅ RNTL · Maestro (partial: no chart assertion yet)
- Override `Always win` (RNTL: also pin challenger, e.g. Onix → prize known)
- Stable → Squirtle → `Battle`
- Expect overlay: `Squirtle wins`, `Prize +$<p>`, `Continue`
- Continue → expect:
  - Detail: record `1W–0L` (regex — see type casing note), mark price `$459`
  - Battle history row `Round 1 · vs <challenger>`, `Win · +$<p>`, `W`
  - Overview: Cash `$<p>`, Rounds `1`, Net worth `$<p + 459>`
  - History: 1 row with type `Prize`, `Battle prize`, `Squirtle beat <challenger>`, `+$<p>`, `Bal $<p>`; balance card `$<p>`, `1 transaction`
  - Chart: accessibility label `Cash over 1 transactions and 1 rounds`
- Maestro: read `<p>` with `copyTextFrom: "Prize \\+\\$\\d+"`, then assert it shows up in History and Overview

**B2 · Loss** [Both] ✅ RNTL · Maestro
- Override `Always lose` → battle
- Expect overlay: `<challenger> wins`, `No prize this round`
- Continue → expect:
  - Detail: record `0W–1L`, mark price `$407`
  - Battle history row `Loss`, `L`
  - Overview: Cash `$0`, Rounds `1`, Net worth `$407`
  - History: still `No transactions yet` (a loss adds no ledger line)

**B3 · Win then loss accumulate** [Both] ✅ Maestro
- Win → Continue → Lose → Continue
- Expect: record `1W–1L`, mark price `$433`, Rounds `2`, two battle history rows (newest first), one prize ledger row

**B4 · Battle advances the round and refreshes the market** [Both]
- Note the first market row → battle → Continue → Buy tab
- Expect: lot regenerated (RNTL: listing ids now `round-1-*`; Maestro: `8 for sale` again even if a listing was bought before)

**B5 · Battle button locked while the overlay is up** [RNTL]
- Press Battle → expect Battle and Sell `disabled` until `onFinished`

**B6 · Android back dismisses overlay and still settles** [E2E, Android]
- Battle → wait for overlay → `back`
- Expect: round settled (Rounds `1`). Documents the `onRequestClose` path

**B7 · Battle result survives a force-quit** [Both] ✅ RNTL · Maestro
- `Always lose` → Battle
- Expect: the loss is recorded as soon as Battle is pressed (Rounds `1`, record `0W–1L`), before `Continue`
- E2E: `stopApp` before Continue → `launchApp` → still `0W–1L`, Rounds `1`

---

## 3. Buying

**P1 · Insufficient funds** [Both] ✅ RNTL (deterministic from a fresh game: cash $0)
- Buy → first listing
- Expect: `Insufficient funds — need $<price> more.`, `Buy · $<price>` disabled

**P2 · Online buy settles** [Both] ✅ RNTL
- Setup: `earn-cash` (RNTL: seed cash 1000); `Always settle`
- Buy → first listing (note price `<b>`) → `Buy · $<b>`
- Expect immediately (optimistic):
  - Modal closes; lot shows `7 for sale`, listing gone
  - Cash drops by `<b>` (hold)
  - Stable: new row with `Buying · pending`
  - History: top row `Purchase · Pending`, `Bought <name>`, `-$<b>`, `Bal $<cash − b>`
- After ~1.5s:
  - Pending badge gone, `Pending` label gone, cash unchanged (hold became the debit)
  - Net worth = cash + Σ mark (unchanged by the buy)
- Detail of the bought Pokémon: record is its market record; `No battles under your ownership yet.`

**P3 · Offline buy queues, then settles** [Both] ✅ RNTL · Maestro
- Options → Simulate network off
- Buy a listing → detail shows `You’re offline — funds are held now and the purchase settles when you reconnect.` before buying
- Expect: hold applied, row stays `Buying · pending` beyond 3s; History row `Pending`
- Network on → within ~1.5s it settles as in P2

**P4 · Failed buy refunds** [Both] ✅ RNTL · Maestro
- `Always fail` → buy `<name>` at `<b>`
- Expect:
  - Alert `Purchase failed`, `Sold out before your order cleared. $<b> has been refunded.` (RNTL: spy `Alert.alert`)
  - Cash restored
  - Pokémon gone from Stable
  - Listing not back in the lot
  - History, newest first: `Refund` row `Refund · <name>`, `+$<b>`, `Bal $<restored>`; then `Purchase · Failed`, amount struck through
  - Receipt for the failed purchase: Status `Failed`, Reason `Sold out before your order cleared`

**P5 · Holds prevent double-spending** [RNTL] ✅ RNTL
- Seed cash 600, two listings at 400 → buy first → second shows `Insufficient funds — need $200 more.`

**P6 · Pending purchase locks the Pokémon** [Both] ✅ RNTL
- Offline → buy → open it in Stable
- Expect: `Purchase pending. Settles when you’re back online.`; Battle and Sell disabled

**P7 · Pending queue survives relaunch** [E2E] / [RNTL via rehydrate] ✅ Maestro
- Offline → buy → relaunch (no `clearState`)
- Expect: still pending; network still off (persisted); network on → settles

**P8 · Queue drains oldest first** [RNTL] ✅ RNTL
- Offline → buy A, buy B → online → advance 1500ms
- Expect: A settled, B pending → advance 1500ms → B settled

---

## 4. Selling

**S1 · Can't sell your last Pokémon** [Both] ✅ RNTL (deterministic from a fresh game)
- Stable → starter
- Expect: `You can’t sell your last Pokémon.`, `Sell · $433` disabled

**S2 · Online sale settles** [Both] ✅ RNTL · Maestro
- Setup: P2 done (2 Pokémon); `Always settle`
- Stable → bought Pokémon (mark `<m>`) → `Sell · $<m>`
- Expect immediately:
  - Modal closes; row shows `Selling · pending`
  - Cash unchanged (credits aren't spendable until they settle)
  - Overview: `+$<m> sales pending`
  - History: top row `Sale · Pending`, `Sold <name>`, `+$<m>`, no `Bal` line
  - History balance card shows `+$<m> pending from sales`
  - Receipt: Balance after `Credits on settlement`
- After ~1.5s:
  - Cash `+<m>`; Pokémon gone; `1 Pokémon owned`
  - History top row `Sale`, `Bal $<new cash>`; pending note gone
  - Net worth unchanged from before the sale (asset swapped for cash)
  - Chart gains a step up

**S3 · Offline sale queues** [Both] ✅ RNTL · Maestro
- Network off → sell → row pending beyond 3s, detail shows `Sale pending at $<m>. Settles when you’re back online.` → network on → settles as S2

**S4 · Failed sale rolls back** [Both] ✅ RNTL · Maestro
- `Always fail` → sell
- Expect:
  - Alert `Sale failed`, `No buyers at your price. <name> is back in your stable.`
  - Cash unchanged; Pokémon still in Stable with no badge; Battle/Sell enabled again
  - History: `Sale · Failed`, struck-through amount, no balance
  - Receipt: Reason `No buyers at your price`, Balance after `Not credited`

**S5 · Pending sale counts as gone for the last-Pokémon rule** [Both] ✅ RNTL
- Two Pokémon, offline → sell A → open B
- Expect: `You can’t sell your last Pokémon.`; Sell disabled

**S6 · Pending sale locks battling** [Both] ✅ RNTL
- Offline → sell A → open A
- Expect: Battle and Sell disabled

---

## 5. History and ledger

**H1 · Ordering** [RNTL] ✅ RNTL (fiddly in E2E)
- Script: win (prize) → offline buy (pending) → sell (pending) → online → settle all
- Expect while pending: pending rows first, then posted rows newest-first
- After settling: settled sale moves to the top (posting order), purchase stays where it was posted

**H2 · Running-balance invariant (V8)** [RNTL] ✅ RNTL
- Run any mixed sequence of P/S/B actions
- Walking the ledger oldest → newest over posted entries (`balanceAfter !== null`), each `balanceAfter` = previous + `amount`
- The newest posted `balanceAfter` = cash

**H3 · Balance card** [Both]
- After each scenario above: `Current balance` = Overview cash; `N transaction(s)` = row count, with correct singular/plural

**H4 · Receipt per type** [Both] ✅ RNTL
- Open one row each of Prize / Purchase / Sale / Refund
- Expect: title, signed amount, subtitle, Type, Status, Round, Reference (= ledger id), and Settled / Failed timestamp present for non-pending entries

**H5 · Receipt for a vanished entry** [RNTL] ✅ RNTL
- `renderRouter` at `/history/missing` → `Transaction not found`

---

## 6. Overview

**OV1 · Totals after a full journey** [Both]
- After B1 → P2 → S2: Cash, Rounds, Stable size and Net worth match the sum of the steps

**OV2 · Chart points** [unit] ✅ `cashChartModel.test.ts`
- `cashSeries`: prizes land at the end of their round, trades are spread between battles, pending entries aren't plotted, and a late-settling sale never moves the line backwards
- Accessibility label `Cash over N transactions and R rounds`, where N = posted ledger entries

**OV3 · Chart axes** [unit] ✅ `cashChartModel.test.ts`
- `niceTicks`: round-number steps from $0 (cash can't go negative, so $0 is the bottom)
- `roundLabelStep`: round numbers thin out as rounds pile up

---

## 7. Options and persistence

**OP1 · Network toggle persists, overrides reset** [E2E] ✅ Maestro
- Network off, `Always win`, `Always fail` → relaunch
- Expect: network still off; Battle and Settlement outcome back to `Random`

**OP2 · Reset game** [Both] ✅ RNTL · Maestro
- Mid-game (with pending transactions) → `Reset game`
- Expect:
  - Onboarding `StableMate` slide; picking a starter starts fresh at Cash `$0`
  - Network setting kept
- Also asserts no `console.error`. Null-state selectors are covered separately in `selectors.test.tsx`

---

## 8. Full-journey smoke (E2E)

**J1** — `start-game` (Squirtle) → `Always win`, `Always settle` → `earn-cash` → buy first listing → battle with it → sell it → verify:
- History has 7 prizes (6 from `earn-cash` + 1), 1 purchase, 1 sale; all settled
- Overview cash = Σ prizes − purchase + sale
- `1 Pokémon owned`

Run once per platform as the release gate.

---

## Unit tests (pure functions)

- `markPriceFromRecord`: ±6% per net win, rounding, `$25` floor
- `prizeMoneyForWin`: 22% of list, `$75` floor
- `rollPlayerWins`: forced outcomes; `random` uses `Math.random() < 0.7` (mock the boundary)
- `decideSettlement`: forced outcomes; random thresholds 10% / 20%; reason per type
- `formatMoney` / `formatSignedMoney` (thousands grouping, signs) ✅, `typeLabel`, `statusLabel`, `settlementFailureMessage`: every branch
- Store actions: ✅ `__tests__/store.test.ts` (9 cases: holds, refunds, sale posting order, rollback, battle lock, idempotency)
- `merge` migration: old persisted state with no `status` / `pending` / `ownedId` hydrates as settled / null
