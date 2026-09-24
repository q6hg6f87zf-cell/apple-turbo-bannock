import type { Save } from "./types";
export type Outcome = {
  state: Save;
  text: string;
  kind: "info" | "hit" | "guard" | "heal" | "win" | "upgrade" | "defeat";
  damage?: number;
  incoming?: number;
};
export const result = (
  state: Save,
  text: string,
  kind: Outcome["kind"] = "info",
  extra: Partial<Outcome> = {},
): Outcome => ({ state, text, kind, ...extra });
export const note = (s: Save, text: string) => {
  if (!s.journal.entries.includes(text))
    s.journal.entries = [...s.journal.entries, text].slice(-50);
};
