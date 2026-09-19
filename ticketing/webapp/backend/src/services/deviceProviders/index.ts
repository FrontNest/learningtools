import type { DeviceProvider } from "./DeviceProvider";
import { InventoryFileDeviceProvider } from "./InventoryFileDeviceProvider";
import { appConfig } from "../../config";

// Later: add a GraphIntuneDeviceProvider implementing the same interface and
// switch appConfig.deviceProvider to "INTUNE" — no other code needs to change.
export function getDeviceProvider(): DeviceProvider {
  switch (appConfig.deviceProvider) {
    case "INVENTORY":
    default:
      return new InventoryFileDeviceProvider();
  }
}
