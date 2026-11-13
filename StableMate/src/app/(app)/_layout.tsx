import { NativeTabs } from "expo-router/native-tabs";

export default function AppTabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Overview</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
          md={{ default: "bar_chart", selected: "bar_chart" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }}
          md={{ default: "receipt_long", selected: "receipt_long" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stable">
        <NativeTabs.Trigger.Label>Stable</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.stack", selected: "square.stack.fill" }}
          md={{ default: "stacks", selected: "stacks" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="buy">
        <NativeTabs.Trigger.Label>Buy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "cart", selected: "cart.fill" }}
          md={{ default: "shopping_cart", selected: "shopping_cart" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="options">
        <NativeTabs.Trigger.Label>Options</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md={{ default: "settings", selected: "settings" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
