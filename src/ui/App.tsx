import { useCallback, useEffect, useRef, useState } from "react";
import { App as NativeApp } from "@capacitor/app";
import {
  initial,
  interact,
  upgrade,
  act,
  chooseEnding,
  objective,
  level,
  maxHp,
  damage,
  enemyName,
  intent,
  enemyTurn,
  actionForecast,
  type Save,
  type Outcome,
  type Action,
} from "../game/engine";
import { SITES, type Point, type SiteId } from "../game/world";
import {
  feedback,
  loadGame,
  saveGame,
  unlockSound,
  suspendSound,
} from "../game/platform";
import type { IroncladScene } from "../game/scene";
import { Gear } from "./Gear";

type Panel = "gear" | "journal" | "settings" | "destinations" | SiteId | null;
export function App() {
  const [state, setState] = useState<Save>(initial),
    [ready, setReady] = useState(false),
    [entered, setEntered] = useState(false);
  const [panel, setPanel] = useState<Panel>(null),
    [notice, setNotice] = useState(""),
    [warning, setWarning] = useState(""),
    [graphicsError, setGraphicsError] = useState("");
  const [busy, setBusy] = useState(false),
    [travelling, setTravelling] = useState(""),
    [last, setLast] = useState<Outcome | null>(null),
    [confirmReset, setConfirmReset] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<IroncladScene | null>(null),
    live = useRef(state),
    modal = useRef<HTMLDialogElement>(null),
    locked = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const commit = useCallback((s: Save) => {
    live.current = s;
    setState(s);
    if (s.started)
      void saveGame(s).catch(() =>
        setWarning(
          "Could not save this checkpoint. Keep the app open and retry when storage is available.",
        ),
      );
  }, []);
  const apply = useCallback(
    (out: Outcome) => {
      commit(out.state);
      setNotice(out.text);
      setLast(out);
      feedback(out.kind, out.state);
      scene.current?.flash(out);
    },
    [commit],
  );
  useEffect(() => {
    let mounted = true;
    void loadGame().then(({ state: s, warning: w }) => {
      if (mounted) {
        live.current = s;
        setState(s);
        setWarning(w);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!entered || !host.current) return;
    let disposed = false;
    void import("../game/scene").then(({ IroncladScene }) => {
      if (disposed || !host.current) return;
      try {
        scene.current = new IroncladScene(
          host.current,
          live.current,
          (position: Point, id: SiteId | null) => {
            setTravelling("");
            const s = { ...live.current, position };
            commit(s);
            if (id) {
              const out = interact(s, id);
              apply(out);
              if (!out.state.battle) setPanel(id);
            }
          },
          setGraphicsError,
        );
      } catch {
        setGraphicsError(
          "This device could not start the 3D scene. Your save is safe. Try reloading with other graphics-heavy apps closed.",
        );
      }
    });
    return () => {
      disposed = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [entered, commit, apply]);
  useEffect(() => {
    scene.current?.update(state);
  }, [state]);
  useEffect(() => {
    scene.current?.setPaused(!!panel);
    if (panel && !modal.current?.open) modal.current?.showModal();
    else if (!panel && modal.current?.open) modal.current.close();
  }, [panel]);
  useEffect(() => {
    const checkpoint = () => {
      suspendSound();
      if (live.current.started)
        commit({
          ...live.current,
          position: scene.current?.getPosition() ?? live.current.position,
        });
    };
    const visibility = () => {
      if (document.hidden) checkpoint();
      else if (live.current.settings.sound) unlockSound();
    };
    document.addEventListener("visibilitychange", visibility);
    let dead = false;
    let remove: (() => void) | undefined;
    void NativeApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) checkpoint();
    })
      .then((handle) => {
        if (dead) void handle.remove();
        else
          remove = () => {
            void handle.remove();
          };
      })
      .catch(() => {});
    return () => {
      dead = true;
      remove?.();
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(timer.current);
    };
  }, [commit]);
  const begin = () => {
    unlockSound();
    commit({ ...live.current, started: true });
    setEntered(true);
    setNotice(
      "Tap the street to walk. Follow the gold objective, or choose a destination. Tyrone is waiting.",
    );
  };
  const travel = (id: SiteId) => {
    setPanel(null);
    setTravelling(SITES.find((s) => s.id === id)!.name);
    scene.current?.setPaused(false);
    scene.current?.travel(id);
  };
  const battleAction = (action: Action) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    unlockSound();
    apply(act(live.current, action));
    timer.current = setTimeout(
      () => {
        locked.current = false;
        setBusy(false);
      },
      live.current.settings.reducedMotion ? 150 : 400,
    );
  };
  const open = (p: Panel) => {
    setTravelling("");
    setPanel(p);
  };
  const obj = objective(state),
    b = state.battle;
  const telegraph = b ? enemyTurn(b) : null;
  const rankFloor = level(state) === 3 ? 150 : level(state) === 2 ? 60 : 0;
  const rankCeiling = level(state) === 3 ? 150 : level(state) === 2 ? 150 : 60;
  const close = () => {
    setPanel(null);
    setConfirmReset(false);
  };
  if (!ready)
    return (
      <main className="loading">
        <span className="sigil">H</span>
        <p>Finding the signal…</p>
      </main>
    );
  if (!entered)
    return (
      <main className="title-screen">
        <img
          className="title-background"
          src="./art/ironclad-title.jpg"
          alt="The industrial ruins of the Hollow Realm"
        />
        <div className="title-top">
          <span>MOON SQUAD ORIGINAL</span>
          <span>FIRST LIGHT / CHAPTER 01</span>
        </div>
        <div className="title-copy">
          <p className="eyebrow">A road out of the ashes</p>
          <h1>
            HOLLOW
            <br />
            <em>REALM</em>
          </h1>
          <p className="title-description">
            A stranger. An old machine.
            <br />A city with something to hide.
          </p>
          <button className="primary start" onClick={begin}>
            {state.started ? "Continue your journey" : "Enter Ironclad"}{" "}
            <span>↗</span>
          </button>
          <p className="small">
            A playable opening chapter · Progress saves on this device
          </p>
          {warning ? <p role="alert">{warning}</p> : null}
        </div>
        <footer className="title-bottom">
          <span>EXPLORE. BUILD. LEAVE A MARK.</span>
          <span>EARLY BUILD 0.1</span>
        </footer>
      </main>
    );
  return (
    <main
      className={`game ${state.settings.reducedMotion ? "reduce-motion" : ""}`}
    >
      <div className="world" ref={host} />
      <div className="vignette" />
      <header className="hud-top">
        <div className="identity">
          <span className="sigil small-sigil">H</span>
          <div>
            <span className="eyebrow">THE HOLLOW REALM</span>
            <h1>
              Ironclad <span>/ North Quarter</span>
            </h1>
          </div>
        </div>
        <button
          className="icon-button"
          aria-label="Settings and pause"
          onClick={() => open("settings")}
        >
          Ⅱ
        </button>
      </header>
      <section className="vitals" aria-label="Player status">
        <div>
          <span className="rank">{String(level(state)).padStart(2, "0")}</span>
          <div>
            <span className="eyebrow">WANDERER</span>
            <div className="health-label">
              <span>Health</span>
              <strong>
                {state.hp} / {maxHp(state)}
              </strong>
            </div>
            <div className="bar">
              <i style={{ width: `${(state.hp / maxHp(state)) * 100}%` }} />
            </div>
          </div>
        </div>
        <p>
          {state.scrap} scrap <span>·</span> {state.meds} medkits <span>·</span>{" "}
          {state.xp} XP
        </p>
        <div
          className="xp-track"
          role="progressbar"
          aria-label="Rank progress"
          aria-valuemin={rankFloor}
          aria-valuemax={rankCeiling}
          aria-valuenow={Math.min(state.xp, rankCeiling)}
        >
          <i
            style={{
              width: `${level(state) === 3 ? 100 : ((state.xp - rankFloor) / (rankCeiling - rankFloor)) * 100}%`,
            }}
          />
        </div>
        <span className="rank-progress">
          {level(state) === 3
            ? "CHAPTER RANK COMPLETE"
            : `${rankCeiling - state.xp} XP TO RANK ${level(state) + 1}`}
        </span>
      </section>
      {!b ? (
        <aside className="objective">
          <p className="eyebrow">
            CHAPTER 01 <span>{obj.step} / 5</span>
          </p>
          <h2>{obj.title}</h2>
          <p>{obj.body}</p>
          <button className="text-button" onClick={() => travel(obj.target)}>
            {travelling ? `Walking to ${travelling}…` : "Follow objective"}{" "}
            <span>↗</span>
          </button>
        </aside>
      ) : null}
      <nav className="utility" aria-label="Game menus">
        <button onClick={() => open("gear")}>
          <span>◇</span>Loadout{state.coil ? <i /> : null}
        </button>
        <button onClick={() => open("journal")}>
          <span>≡</span>Journal
        </button>
        <button disabled={!!b} onClick={() => open("destinations")}>
          <span>⌖</span>Places
        </button>
      </nav>
      {graphicsError ? (
        <div className="graphics-error" role="alert">
          <p>{graphicsError}</p>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      ) : null}
      <div className="bottom-hud">
        {warning ? (
          <p className="save-warning" role="alert">
            {warning}
          </p>
        ) : null}
        {b ? (
          <section className="combat" aria-label="Combat">
            <div className="combat-heading">
              <div>
                <p className="eyebrow">
                  {telegraph?.phase} · TURN {b.turn + 1}
                </p>
                <h2>{enemyName(b)}</h2>
              </div>
              <strong>
                {b.hp}
                <small> / {b.maxHp} HP</small>
              </strong>
            </div>
            <div className="bar enemy-bar">
              <i style={{ width: `${(b.hp / b.maxHp) * 100}%` }} />
            </div>
            <p className={`intent ${telegraph?.incoming ? "danger" : ""}`}>
              {telegraph?.incoming ? "⚠" : "◈"} {intent(b)}
            </p>
            <div className="combat-stats">
              <span>
                COIL CHARGE{" "}
                <b>
                  {"●".repeat(state.energy)}
                  {"○".repeat(4 - state.energy)}
                </b>
              </span>
              <span>
                {b.exposed
                  ? "EXPOSED · NEXT STRIKE +4"
                  : b.enemy === "warden"
                    ? telegraph?.vulnerable
                      ? "VENTS OPEN · STRIKE +4"
                      : `ARMOUR · −${telegraph?.armour} STRIKE`
                    : "UNARMOURED"}
              </span>
            </div>
            <div className="actions">
              <button
                disabled={busy}
                className="primary"
                onClick={() => battleAction("strike")}
              >
                Strike
                <small>{actionForecast(state, "strike")}</small>
              </button>
              <button disabled={busy} onClick={() => battleAction("guard")}>
                Guard<small>{actionForecast(state, "guard")}</small>
              </button>
              <button
                disabled={busy || !state.coil || state.energy < 2}
                onClick={() => battleAction("pulse")}
              >
                Coil pulse · 2 charge
                <small>{actionForecast(state, "pulse")}</small>
              </button>
              <button
                disabled={busy || state.meds === 0 || state.hp === maxHp(state)}
                onClick={() => battleAction("heal")}
              >
                Medkit · {state.meds}
                <small>{actionForecast(state, "heal")}</small>
              </button>
            </div>
            <div className="combat-foot">
              <span role="status">{notice}</span>
              <button
                disabled={busy}
                className="text-button"
                onClick={() => battleAction("retreat")}
              >
                Retreat
              </button>
            </div>
          </section>
        ) : (
          <>
            <div
              className={`field-message ${last?.kind === "upgrade" ? "upgraded" : ""}`}
              role="status"
            >
              <img src="./art/tyrone.jpg" alt="TyroneBot" />
              <div>
                <p className="eyebrow">
                  {last?.kind === "upgrade"
                    ? "LOADOUT UPGRADED"
                    : "TYRONE / FIELD CHANNEL"}
                </p>
                <p>
                  {notice || "Keep moving. This town won’t introduce itself."}
                </p>
              </div>
            </div>
            <div className="explore-bar">
              <span>
                <i className="live-dot" />{" "}
                {travelling
                  ? `Walking to ${travelling}`
                  : "Tap the street to move"}
              </span>
              <button onClick={() => travel(obj.target)}>
                {state.stage === "complete"
                  ? "Visit workshop"
                  : "Continue journey"}{" "}
                ↗
              </button>
            </div>
          </>
        )}
      </div>
      <dialog
        ref={modal}
        onCancel={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="panel">
          <button className="close" aria-label="Close panel" onClick={close}>
            ×
          </button>
          {panel === "gear" ? (
            <>
              <p className="eyebrow">YOUR EQUIPMENT</p>
              <h2>{state.coil ? "Ironbound rifle" : "Salvaged rifle"}</h2>
              <Gear coil={state.coil} armour={state.armour} />
              <div className="gear-stats">
                <div>
                  <strong>{damage(state)}</strong>
                  <span>STRIKE DAMAGE</span>
                </div>
                <div>
                  <strong>{state.coil ? "12" : "—"}</strong>
                  <span>COIL PULSE</span>
                </div>
                <div>
                  <strong>{state.armour ? "−2" : "0"}</strong>
                  <span>DAMAGE TAKEN</span>
                </div>
              </div>
              <p>
                {state.coil
                  ? "The recovered core is wired into your rifle. The coil bypasses armour and exposes enemies for a stronger follow-up strike."
                  : "A serviceable rifle with room to grow. Recover a power core from the Rail Cut and have Travis fit it."}
              </p>
              <div className="equipment-row">
                <span>
                  {state.armour ? "Rivetguard coat" : "Worn field coat"}
                </span>
                <b>{state.armour ? "REINFORCED" : "BASE"}</b>
              </div>
              <div className="equipment-row">
                <span>Weapon modification</span>
                <b>{state.coil ? "IRONBOUND COIL" : "EMPTY SOCKET"}</b>
              </div>
              <button
                className="primary"
                disabled={!!b}
                onClick={() => travel("workshop")}
              >
                Visit Travis ↗
              </button>
            </>
          ) : null}
          {panel === "journal" ? (
            <>
              <p className="eyebrow">A RECORD OF YOUR CHOICES</p>
              <h2>Field journal</h2>
              <div className="journal-objective">
                <span>ACTIVE / {obj.step} OF 5</span>
                <h3>{obj.title}</h3>
                <p>{obj.body}</p>
              </div>
              {state.journal.length ? (
                state.journal.map((line, i) => (
                  <article className="journal-entry" key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <p>{line}</p>
                  </article>
                ))
              ) : (
                <p>Your story starts with the machine waiting on the street.</p>
              )}
            </>
          ) : null}
          {panel === "destinations" ? (
            <>
              <p className="eyebrow">IRONCLAD / NORTH QUARTER</p>
              <h2>Choose your next step.</h2>
              <p>You will walk to the location through the street.</p>
              <div className="destinations">
                {SITES.map((site) => (
                  <button key={site.id} onClick={() => travel(site.id)}>
                    <span>
                      <small>
                        {site.label}
                        {site.id === obj.target ? " / OBJECTIVE" : ""}
                      </small>
                      <strong>{site.name}</strong>
                    </span>
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {panel === "settings" ? (
            <>
              <p className="eyebrow">TAKE A BREATH</p>
              <h2>Paused</h2>
              <p>
                Progress saves after each action and when you arrive. This build
                plays offline inside the iOS app. Saves stay on this device.
              </p>
              {(["sound", "haptics", "reducedMotion"] as const).map((key) => (
                <label className="setting" key={key}>
                  <span>
                    {key === "sound"
                      ? "Sound effects"
                      : key === "haptics"
                        ? "Haptics (supported devices)"
                        : "Reduce motion"}
                  </span>
                  <input
                    type="checkbox"
                    checked={state.settings[key]}
                    onChange={(e) => {
                      unlockSound();
                      commit({
                        ...live.current,
                        settings: {
                          ...live.current.settings,
                          [key]: e.target.checked,
                        },
                      });
                    }}
                  />
                </label>
              ))}
              <p className="small">
                Controls: tap to walk, choose Places to navigate, or use WASD /
                arrow keys. Combat waits for your decisions.
              </p>
              <details>
                <summary>Privacy & game information</summary>
                <p>
                  This build has no accounts, ads, analytics, purchases, or
                  remote AI calls. Game progress and preferences are stored on
                  your device. Starting a new journey replaces your progress.
                  The web preview’s hosting provider may receive standard
                  connection logs.
                </p>
                <p>
                  Hollow Realm · First Light · 0.1.0. A new opening chapter set
                  in the Hollow Realm.
                </p>
              </details>
              <button className="primary" onClick={close}>
                Return to the street
              </button>
              {confirmReset ? (
                <div className="reset-confirm">
                  <p>Replace this journey and its progress?</p>
                  <button
                    onClick={() => {
                      const s = initial();
                      s.started = true;
                      commit(s);
                      scene.current?.dispose();
                      scene.current = null;
                      setEntered(false);
                      close();
                    }}
                  >
                    Replace saved journey
                  </button>
                  <button onClick={() => setConfirmReset(false)}>
                    Keep playing
                  </button>
                </div>
              ) : (
                <button
                  className="text-button"
                  onClick={() => setConfirmReset(true)}
                >
                  Start a new journey
                </button>
              )}
            </>
          ) : null}
          {panel && SITES.some((s) => s.id === panel) ? (
            <>
              {panel === "tyrone" || panel === "workshop" ? (
                <img
                  className="speaker"
                  src={`./art/${panel === "tyrone" ? "tyrone" : "travis"}.jpg`}
                  alt={panel === "tyrone" ? "TyroneBot" : "Travis"}
                />
              ) : null}
              <p className="eyebrow">
                {SITES.find((s) => s.id === panel)?.label}
              </p>
              <h2>{SITES.find((s) => s.id === panel)?.name}</h2>
              <p className="dialogue">{notice}</p>
              {panel === "workshop" ? (
                <>
                  <Gear coil={state.coil} armour={state.armour} />
                  {!state.coil && state.core ? (
                    <div
                      className="upgrade-preview"
                      aria-label="Upgrade comparison"
                    >
                      <p className="eyebrow">IRONBOUND COIL / BEFORE → AFTER</p>
                      <p>
                        Strike{" "}
                        <strong>
                          {damage(state)} →{" "}
                          {damage(upgrade(state, "coil").state)}
                        </strong>{" "}
                        · includes rank gain
                      </p>
                      <p>
                        Pulse <strong>Locked → 12 damage</strong>
                      </p>
                      <p>
                        Armour bypass, exposed targets and cannon interrupts.
                        Health restored on fitting.
                      </p>
                      <details>
                        <summary>Inspect the fitted coil</summary>
                        <Gear coil armour={state.armour} />
                      </details>
                    </div>
                  ) : null}
                  <button
                    className="primary"
                    disabled={!state.core || state.coil}
                    onClick={() => apply(upgrade(live.current, "coil"))}
                  >
                    {state.coil ? "Coil fitted ✓" : "Fit Ironbound Coil"}{" "}
                    <small>
                      {state.coil
                        ? "Equipped on your rifle"
                        : "1 recovered core · +2 damage · unlock pulse"}
                    </small>
                  </button>
                  <button
                    disabled={state.armour || state.scrap < 4}
                    onClick={() => apply(upgrade(live.current, "armour"))}
                  >
                    {state.armour ? "Armour fitted ✓" : "Reinforce field coat"}{" "}
                    <small>
                      4 scrap · absorb 2 damage · visible shoulder plates
                    </small>
                  </button>
                </>
              ) : null}
              {panel === "gate" && state.stage === "decision" ? (
                <div className="ending-options">
                  <button
                    className="primary"
                    onClick={() =>
                      apply(chooseEnding(live.current, "broadcast"))
                    }
                  >
                    Broadcast the names
                    <small>Warn the city. Reveal that you survived.</small>
                  </button>
                  <button
                    onClick={() => apply(chooseEnding(live.current, "conceal"))}
                  >
                    Keep the evidence
                    <small>
                      Protect your lead. Leave the transmitter dark.
                    </small>
                  </button>
                </div>
              ) : null}
              {state.stage === "complete" && panel === "gate" ? (
                <div className="chapter-complete">
                  <p className="eyebrow">CHAPTER COMPLETE</p>
                  <h3>
                    {state.ending === "broadcast"
                      ? "The city heard you."
                      : "The secret leaves with you."}
                  </h3>
                  <p>
                    Your choice is saved. This is the end of the current
                    playable chapter. Ironclad remains open to explore.
                  </p>
                </div>
              ) : null}
              <button className="text-button" onClick={close}>
                Back to the street →
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </main>
  );
}
