import { useEffect, useRef, useState } from "react";
import type { RegionId } from "../game/domain/types";
// Original Dream Harbor masters, pinned to the audited source revision.
const SOURCE =
  "https://raw.githubusercontent.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/ef95da0e1815539b6c4a25abd6919aa67a16d094/public/audio/";
export const TRACKS = [
  ["keep-the-radio-on", "Keep the Radio On", "vault"],
  ["the-stranger-of-ironclad", "The Stranger of Ironclad", "ironclad"],
  ["glowin-in-slag-town", "Glowin’ in Slag Town", "slagtown"],
  ["dont-look-up-at-blackspire", "Don’t Look Up at Blackspire", "blackspire"],
  ["brasswater-keeps-rollin", "Brasswater Keeps Rollin’", "brasswater"],
  ["meet-me-in-veyra", "Meet Me in Veyra", "veyra"],
  ["welcome-to-the-thirty-eight", "Welcome to the Thirty-Eight", "casino"],
];
export function Radio({
  region,
  duck,
  casino = false,
}: {
  region: RegionId;
  duck: boolean;
  casino?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [volume, setVolume] = useState(0.35),
    [follow, setFollow] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (follow) {
      const i = TRACKS.findIndex((t) => t[2] === (casino ? "casino" : region));
      if (i >= 0) setIndex(i);
    }
  }, [region, follow, casino]);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume * (duck ? 0.22 : 1);
  }, [volume, duck]);
  useEffect(() => {
    if (playing)
      void audio.current?.play().catch(() => {
        setPlaying(false);
        setError("Tap Play to resume the radio.");
      });
  }, [index, playing]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        audio.current?.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  return (
    <details className="radio-dock">
      <summary>
        <span className={playing ? "signal-on" : ""}>◉</span> VAULT 13 RADIO{" "}
        <span>{playing ? TRACKS[index][1] : "OFF AIR"}</span>
      </summary>
      <div className="radio-controls">
        <audio
          ref={audio}
          src={SOURCE + TRACKS[index][0] + ".mp3"}
          preload="none"
          onEnded={() => setIndex((i) => (i + 1) % TRACKS.length)}
          onError={() => {
            setError(
              "Radio needs a connection. The journey remains playable offline.",
            );
            setPlaying(false);
          }}
        />
        <button
          aria-label={playing ? "Pause radio" : "Play radio"}
          onClick={() => {
            setError("");
            if (playing) {
              audio.current?.pause();
              setPlaying(false);
            } else {
              void audio.current
                ?.play()
                .then(() => setPlaying(true))
                .catch(() =>
                  setError(
                    "Unable to play this broadcast. Check your connection and try again.",
                  ),
                );
            }
          }}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <label>
          Station
          <select
            aria-label="Radio track"
            value={index}
            onChange={(e) => {
              setFollow(false);
              setIndex(Number(e.target.value));
            }}
          >
            {TRACKS.map((t, i) => (
              <option value={i} key={t[0]}>
                {t[1]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Volume
          <input
            aria-label="Radio volume"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={follow}
            onChange={(e) => setFollow(e.target.checked)}
          />{" "}
          Follow region
        </label>
        <p className="small">
          Original Dream Harbor broadcasts · streams online · quietens during
          dialogue and combat
        </p>
        {error ? <p role="status">{error}</p> : null}
      </div>
    </details>
  );
}
