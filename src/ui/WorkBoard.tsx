import { useEffect, useState } from "react";
import type { Save } from "../game/domain/types";
import type { Outcome } from "../game/domain/outcome";
import {
  WATCHES,
  JOBS,
  dailyJobs,
  workShift,
  jobKey,
  endDay,
  reconcileLife,
  CONVERSATIONS,
  converse,
} from "../game/watches";
import { REGION_ANCHORS } from "../game/domain/characters";
type Props = { state: Save; apply: (o: Outcome) => void };
export function WorkBoard({ state, apply }: Props) {
  const [now, setNow] = useState(Date.now),
    [accept, setAccept] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const l = state.life;
  return (
    <>
      <p className="eyebrow">
        DAY {l.day} / {REGION_ANCHORS[state.player.region].name}
      </p>
      <h2>The day needs hands.</h2>
      <p>
        Six watches. Field contracts use one; local work uses one or two. Crew
        assignments keep running while you are away.
      </p>
      <ol className="watch-track">
        {WATCHES.map((w, i) => (
          <li
            key={w}
            className={i < l.spent ? "spent" : i === l.spent ? "current" : ""}
          >
            {w}
          </li>
        ))}
      </ol>
      {l.work ? (
        <article className="work-active">
          <p className="eyebrow">CREW IN THE FIELD</p>
          <h3>{JOBS.find((j) => j.id === l.work?.id)?.name}</h3>
          <p>
            {l.work.region} ·{" "}
            {Math.max(
              0,
              Math.ceil(
                Math.min(l.work.due - l.work.started, l.work.due - now) / 60000,
              ),
            )}{" "}
            minutes remaining
          </p>
          <button
            disabled={now < l.work.due}
            onClick={() =>
              apply({
                state: reconcileLife(state, Date.now()),
                text: "Crew report received.",
                kind: "win",
              })
            }
          >
            Receive crew report
          </button>
        </article>
      ) : null}
      <div className="contract-list">
        {dailyJobs(state).map((j) => {
          const done = l.completed.includes(jobKey(state, j.id));
          const blocked =
            done ||
            !!l.work ||
            !!state.encounters.active ||
            l.spent + j.cost > 6;
          return (
            <article key={j.id}>
              <p className="eyebrow">
                {j.person.toUpperCase()} / {j.cost} WATCH
                {j.cost > 1 ? "ES" : ""}
              </p>
              <h3>{j.name}</h3>
              <p>
                {j.scrap} scrap · {j.water} water · {j.medicine} Field Gel ·{" "}
                {j.xp} XP
              </p>
              {done ? (
                <p className="completed">✓ Completed today</p>
              ) : (
                <div className="job-actions">
                  <button
                    disabled={blocked}
                    onClick={() =>
                      apply(workShift(state, j.id, "personal", Date.now()))
                    }
                  >
                    {j.id === "patrol" ? "Take the patrol" : "Work the shift"}
                  </button>
                  {j.id !== "patrol" ? (
                    <button
                      disabled={blocked}
                      onClick={() =>
                        apply(workShift(state, j.id, "crew", Date.now()))
                      }
                    >
                      Assign local crew
                      <small>{j.cost * 5} minutes, including time away</small>
                    </button>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <section className="rest-day">
        <h3>Close the day</h3>
        <p>
          Spend at least four watches. Finish any assigned crew, open casino
          round or active encounter first.
        </p>
        {state.choices["clinic-promise"] === `promise:${l.day}` &&
        !l.completed.includes(jobKey(state, "clinic", "ironclad")) ? (
          <label className="setting">
            <span>
              I am leaving Holt’s clinic promise unfinished. Free Route and Holt
              lose 2 relationship.
            </span>
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
          </label>
        ) : null}
        <button
          disabled={l.spent < 4 || !!l.work || !!state.encounters.active}
          onClick={() => {
            apply(endDay(state, accept));
            setAccept(false);
          }}
        >
          Rest until dawn
          <small>
            Recover 12 health and full focus; refresh work and casino allowances
          </small>
        </button>
      </section>
      <details>
        <summary>Work reports & settlement production</summary>
        <p>
          Each restored workshop produces one scrap and each infirmary one Field
          Gel per 30 minutes. Offline catch-up is capped at three hours.
        </p>
        {l.log.map((line, i) => (
          <p className="work-log" key={i}>
            {line}
          </p>
        ))}
      </details>
    </>
  );
}
export function LocalVoices({ state, apply }: Props) {
  return (
    <>
      <p className="eyebrow">THE PEOPLE HERE</p>
      <h2>A town is more than its work.</h2>
      <div className="contract-list">
        {CONVERSATIONS.filter(
          (c) =>
            c.region === state.player.region &&
            state.characters[c.person].alive,
        ).map((c) => (
          <article key={c.id}>
            <p className="eyebrow">{c.person.toUpperCase()}</p>
            <h3>{c.title}</h3>
            <p className="dialogue">{c.line}</p>
            {state.choices["conversation:" + c.id] ? (
              <p className="decision-record">
                {
                  c.choices.find(
                    (a) => a.id === state.choices["conversation:" + c.id],
                  )?.reply
                }
              </p>
            ) : (
              <div className="story-choices">
                {c.choices.map((a) => (
                  <button
                    disabled={!!state.encounters.active}
                    key={a.id}
                    onClick={() => apply(converse(state, c.id, a.id))}
                  >
                    {a.label}
                    {a.promise ? (
                      <small>
                        This is a promise to finish today’s clinic shift.
                      </small>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
