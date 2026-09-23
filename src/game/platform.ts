import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { initial, parseSave, type Save } from "./engine";
const KEY = "hollow-bannock-save-v1";
let queue = Promise.resolve();
export async function loadGame(): Promise<{ state: Save; warning: string }> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    const saved = parseSave(value);
    if (saved) return { state: saved, warning: "" };
    if (value) {
      const backup = parseSave(
        (await Preferences.get({ key: KEY + "-backup" })).value,
      );
      return {
        state: backup ?? initial(),
        warning: backup
          ? "Recovered the previous checkpoint."
          : "The saved game could not be read. A fresh game is ready; the original save remains in storage until you begin.",
      };
    }
    return { state: initial(), warning: "" };
  } catch {
    return {
      state: initial(),
      warning:
        "Storage is unavailable. Progress may not survive closing the app.",
    };
  }
}
export function saveGame(state: Save): Promise<void> {
  const value = JSON.stringify(state);
  const task = queue
    .catch(() => {})
    .then(async () => {
      const old = await Preferences.get({ key: KEY });
      if (parseSave(old.value))
        await Preferences.set({ key: KEY + "-backup", value: old.value! });
      await Preferences.set({ key: KEY, value });
    });
  queue = task;
  return task;
}
let audio: AudioContext | null = null;
export function unlockSound() {
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
  } catch {
    /* Silent mode remains playable. */
  }
}
export function suspendSound() {
  void audio?.suspend().catch(() => {});
}
export function feedback(kind: string, s: Save) {
  if (s.settings.haptics && Capacitor.isNativePlatform())
    void Haptics.impact({
      style: kind === "upgrade" ? ImpactStyle.Heavy : ImpactStyle.Light,
    }).catch(() => {});
  if (!s.settings.sound || !audio || audio.state !== "running") return;
  const osc = audio.createOscillator(),
    gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);
  const time = audio.currentTime;
  osc.type = kind === "hit" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(
    kind === "upgrade"
      ? 440
      : kind === "win"
        ? 330
        : kind === "hit"
          ? 170
          : 220,
    time,
  );
  osc.frequency.exponentialRampToValueAtTime(
    kind === "upgrade" ? 880 : kind === "win" ? 660 : 70,
    time + 0.2,
  );
  gain.gain.setValueAtTime(0.06, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  osc.start(time);
  osc.stop(time + 0.26);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
