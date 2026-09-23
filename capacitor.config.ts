import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.moonsquad.hollowrealm",
  appName: "Hollow Realm",
  webDir: "dist",
  backgroundColor: "#111917",
  ios: { contentInset: "never", preferredContentMode: "mobile" },
};
export default config;
