import { useCallback, useEffect, useRef, useState } from "react";
import { App as NativeApp } from "@capacitor/app";
import {
  initial,
  interact,
  workshop,
  respondToTyrone,
  utilityShot,
  settle,
  buyAmmo,
  siteAvailable,
  inVault,
  actionBlocked,
  act,
  objective,
  level,
  maxHp,
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
import { Inventory } from "./Inventory";
import { activeWeapon } from "../game/domain/inventory";
import { WEAPONS } from "../game/domain/registry";
import { ironcladEffects } from "../game/domain/narrative";

type Panel = "gear" | "journal" | "settings" | "destinations" | SiteId | null;
export function App() {
  const [state, setState] = useState<Save>(initial),
    [ready, setReady] = useState(false),
    [entered, setEntered] = useState(false),
    [sceneReady, setSceneReady] = useState(false);
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
    void import("../game/scene")
      .then(({ IroncladScene }) => {
        if (disposed || !host.current) return;
        try {
          scene.current = new IroncladScene(
            host.current,
            live.current,
            (position: Point, id: SiteId | null) => {
              setTravelling("");
              const s = {
                ...live.current,
                player: { ...live.current.player, position },
              };
              commit(s);
              if (id) {
                const out = interact(s, id);
                apply(out);
                if (!out.state.encounters.active) setPanel(id);
              }
            },
            setGraphicsError,
          );
          setSceneReady(true);
        } catch {
          setGraphicsError(
            "This device could not start the 3D scene. Your save is safe. Try reloading with other graphics-heavy apps closed.",
          );
        }
      })
      .catch(() => {
        if (!disposed)
          setGraphicsError(
            "The game scene could not load. Reload to try again. Your checkpoint is saved.",
          );
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
          player: {
            ...live.current.player,
            position:
              scene.current?.getPosition() ?? live.current.player.position,
          },
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
    setSceneReady(false);
    setGraphicsError("");
    unlockSound();
    commit({ ...live.current, started: true });
    setEntered(true);
    setNotice(
      live.current.encounters.active
        ? `Encounter resumed. ${intent(live.current.encounters.active)}`
        : live.current.progression.phase !== "wake"
          ? `Checkpoint restored. ${objective(live.current).body}`
          : "You wake in Vault 13. Tap the floor to move. Tyrone is checking whether you can hear him.",
    );
  };
  const travel = (id: SiteId) => {
    if (!scene.current || !sceneReady) return;
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
    b = state.encounters.active;
  const telegraph = b ? enemyTurn(b) : null;
  const rankFloor = level(state) === 3 ? 150 : level(state) === 2 ? 60 : 0;
  const rankCeiling = level(state) === 3 ? 150 : level(state) === 2 ? 150 : 60;
  const close = () => {
    setPanel(null);
    setConfirmReset(false);
  };
  const w = activeWeapon(state),
    wd = w && WEAPONS[w.definition],
    effects = ironcladEffects(state);
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
          src="./art/places/ironclad-street.jpg"
          alt="Ironclad’s riveted walls and mountain road"
        />
        <div className="title-top">
          <span>MOON SQUAD ORIGINAL</span>
          <span>ACT I / THE INVOICE</span>
        </div>
        <div className="title-copy">
          <p className="eyebrow">He had no reason to stop.</p>
          <h1>
            HOLLOW
            <br />
            <em>REALM</em>
          </h1>
          <p className="title-description">
            A stranger. An old machine.
            <br />A road neither of you expected.
          </p>
          <button className="primary start" onClick={begin}>
            {state.started ? "Continue your journey" : "Wake in Vault 13"}{" "}
            <span>↗</span>
          </button>
          <p className="small">
            An offline story · Progress saves on this device
          </p>
          {warning ? <p role="alert">{warning}</p> : null}
        </div>
        <footer className="title-bottom">
          <span>EXPLORE. REPAIR. CHOOSE.</span>
          <span>CANON FOUNDATION / DEVELOPMENT BUILD</span>
        </footer>
      </main>
    );
  return (
    <main
      className={`game ${state.settings.reducedMotion ? "reduce-motion" : ""}`}
    >
      <div className="world" ref={host} aria-busy={!sceneReady} />
      <div className="vignette" />
      <header className="hud-top">
        <div className="identity">
          <span className="sigil small-sigil">H</span>
          <div>
            <span className="eyebrow">HOLLOW REALM</span>
            <h1>
              {inVault(state) ? "Vault 13" : "Ironclad"}{" "}
              <span>/ {inVault(state) ? "Found You" : "The Invoice"}</span>
            </h1>
          </div>
        </div>
        <button
          className="icon-button"
          aria-label="Settings and pause"
          disabled={!sceneReady}
          onClick={() => open("settings")}
        >
          Ⅱ
        </button>
      </header>
      <section className="vitals" aria-label="Player status">
        <div>
          <span className="rank">{String(level(state)).padStart(2, "0")}</span>
          <div>
            <span className="eyebrow">SURVIVOR</span>
            <div className="health-label">
              <span>Health</span>
              <strong>
                {state.player.hp} / {maxHp(state)}
              </strong>
            </div>
            <div className="bar">
              <i
                style={{ width: `${(state.player.hp / maxHp(state)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <p>
          {state.inventory.supplies.scrap} scrap ·{" "}
          {state.inventory.supplies.medicine} Field Gel · {state.player.xp} XP
        </p>
        <div
          className="xp-track"
          role="progressbar"
          aria-label="Rank progress"
          aria-valuemin={rankFloor}
          aria-valuemax={rankCeiling}
          aria-valuenow={Math.min(state.player.xp, rankCeiling)}
        >
          <i
            style={{
              width: `${level(state) === 3 ? 100 : ((state.player.xp - rankFloor) / (rankCeiling - rankFloor)) * 100}%`,
            }}
          />
        </div>
        <span className="rank-progress">
          {wd
            ? `${wd.name} · ${w!.loaded.rounds}/${wd.capacity} · ${w!.condition}%`
            : "No weapon · no supplies"}
        </span>
      </section>
      {!b ? (
        <aside className="objective">
          <p className="eyebrow">
            ACT I <span>{obj.step} / 8</span>
          </p>
          <h2>{obj.title}</h2>
          <p>{obj.body}</p>
          <button
            className="text-button"
            disabled={!sceneReady}
            onClick={() => travel(obj.target)}
          >
            {travelling ? `Walking to ${travelling}…` : "Follow objective"} ↗
          </button>
        </aside>
      ) : null}
      <nav className="utility" aria-label="Game menus">
        <button disabled={!sceneReady} onClick={() => open("gear")}>
          <span>◇</span>Loadout
        </button>
        <button disabled={!sceneReady} onClick={() => open("journal")}>
          <span>≡</span>Journal
        </button>
        <button
          disabled={!!b || !sceneReady}
          onClick={() => open("destinations")}
        >
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
              {intent(b)}
            </p>
            <div className="combat-stats">
              <span>
                FOCUS {"●".repeat(state.player.focus)}
                {"○".repeat(4 - state.player.focus)}
              </span>
              <span>
                {w?.loaded.rounds ?? 0} loaded ·{" "}
                {b.exposed
                  ? "FIRING ARM EXPOSED"
                  : `PLATE ${telegraph?.armour}`}
              </span>
            </div>
            <div className="actions">
              {(
                ["strike", "guard", "aim", "heal", "reload", "swap"] as Action[]
              ).map((a) => (
                <button
                  key={a}
                  className={a === "strike" ? "primary" : ""}
                  disabled={busy || !sceneReady || !!actionBlocked(state, a)}
                  onClick={() => battleAction(a)}
                >
                  {
                    {
                      strike: "Fire",
                      guard: "Guard",
                      aim: "Aimed shot",
                      heal: "Field Gel",
                      reload: "Reload",
                      swap: "Swap",
                      retreat: "Retreat",
                    }[a]
                  }
                  <small>{actionForecast(state, a)}</small>
                </button>
              ))}
            </div>
            <div className="combat-foot">
              <span role="status">{notice}</span>
              <button
                className="text-button"
                disabled={busy || !sceneReady}
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
                <p className="eyebrow">TYRONE / {state.tyrone.chassis}</p>
                <p>
                  {!sceneReady
                    ? "Opening the shelter…"
                    : notice ||
                      "Keep moving. This town won’t introduce itself."}
                </p>
              </div>
            </div>
            <div className="explore-bar">
              <span>
                <i className="live-dot" />{" "}
                {travelling ? `Walking to ${travelling}` : "Tap to walk"}
              </span>
              <button disabled={!sceneReady} onClick={() => travel(obj.target)}>
                Continue journey ↗
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
          {panel === "gear" ? <Inventory state={state} apply={apply} /> : null}
          {panel === "journal" ? (
            <>
              <p className="eyebrow">FIELD NOTES</p>
              <h2>{obj.title}</h2>
              <p>{obj.body}</p>
              {Object.values(state.journal.evidence).map((e) => (
                <details key={e.id}>
                  <summary>
                    {e.id.replaceAll("-", " ")} · {e.reliability}
                  </summary>
                  <p>{e.source}</p>
                  <p>{e.tyroneReaction}</p>
                  <p>Shared: {e.sharedWith.join(", ") || "held privately"}</p>
                </details>
              ))}
              {state.journal.entries.map((line, i) => (
                <article className="journal-entry" key={i}>
                  <span>{i + 1}</span>
                  <p>{line}</p>
                </article>
              ))}
            </>
          ) : null}
          {panel === "destinations" ? (
            <>
              <p className="eyebrow">
                {inVault(state) ? "VAULT 13" : "IRONCLAD"}
              </p>
              <h2>Choose your next step.</h2>
              {!inVault(state) ? (
                <img
                  className="region-map"
                  src="./map/regions/ironclad.jpg"
                  alt="Ironclad regional map"
                />
              ) : null}
              <div className="destinations">
                {SITES.filter((site) => siteAvailable(state, site.id)).map(
                  (site) => (
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
                  ),
                )}
              </div>
            </>
          ) : null}
          {panel === "settings" ? (
            <>
              <p className="eyebrow">TAKE A BREATH</p>
              <h2>Paused</h2>
              <p>
                Actions and arrivals save on this device. The iOS build plays
                offline.
              </p>
              {(["sound", "haptics", "reducedMotion"] as const).map((key) => (
                <label className="setting" key={key}>
                  <span>
                    {key === "reducedMotion"
                      ? "Reduce motion"
                      : key === "haptics"
                        ? "Haptics"
                        : "Sound effects"}
                  </span>
                  <input
                    type="checkbox"
                    checked={state.settings[key]}
                    onChange={(e) =>
                      commit({
                        ...live.current,
                        settings: {
                          ...live.current.settings,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                </label>
              ))}
              <p className="small">
                Tap to walk, choose Places, or use WASD / arrows. Combat waits
                for your decision.
              </p>
              <details>
                <summary>Privacy & game information</summary>
                <p>
                  No accounts, ads, analytics, purchases or remote AI calls.
                  Progress stays on this device. Starting a new journey replaces
                  this campaign checkpoint.
                </p>
                <p>
                  Canon foundation · development build. Controlled temporary
                  gameplay meshes.
                </p>
              </details>
              <button className="primary" onClick={close}>
                Return to the game
              </button>
              {confirmReset ? (
                <div className="reset-confirm">
                  <p>Replace this journey?</p>
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
          {panel && SITES.some((site) => site.id === panel) ? (
            <>
              {panel === "tyrone" ||
              panel === "workshop" ||
              panel === "relay" ||
              panel === "berm" ? (
                <img
                  className="speaker"
                  src={
                    panel === "tyrone"
                      ? "./art/tyrone.jpg"
                      : `./art/npcs/portraits/${panel === "workshop" ? "travis" : panel === "relay" ? "rourke" : "lyra"}.jpg`
                  }
                  alt={
                    panel === "tyrone"
                      ? "TyroneBot"
                      : panel === "workshop"
                        ? "Travis"
                        : panel === "relay"
                          ? "Calder Rourke"
                          : "LYRA-4"
                  }
                />
              ) : null}
              <p className="eyebrow">
                {SITES.find((site) => site.id === panel)?.label}
              </p>
              <h2>{SITES.find((site) => site.id === panel)?.name}</h2>
              <p className="dialogue">{notice}</p>
              {panel === "board" && state.progression.phase === "board" ? (
                <>
                  <Gear
                    weapon={Object.values(state.inventory.weapons).find(
                      (w) => w.definition === "bb",
                    )}
                  />
                  <button
                    className="primary"
                    onClick={() => apply(utilityShot(live.current))}
                  >
                    Shoot the exposed release
                    <small>One BB · open the tool drawer</small>
                  </button>
                </>
              ) : null}
              {panel === "workshop" ? (
                <>
                  <Gear weapon={w} />
                  <div className="workshop-actions">
                    <button
                      className="primary"
                      disabled={state.progression.phase !== "repair"}
                      onClick={() => apply(workshop(live.current, "restore"))}
                    >
                      Restore M94 action
                      <small>2 scrap · clean receiver · reliable cycling</small>
                    </button>
                    <button
                      disabled={
                        !state.encounters.resolved.includes("scout") ||
                        Object.values(state.inventory.weapons).some(
                          (w) => w.definition === "m94" && w.stage >= 2,
                        )
                      }
                      onClick={() => apply(workshop(live.current, "peep"))}
                    >
                      Fit Rail Peep
                      <small>
                        2 scrap · visible sight · aimed shots and interrupts
                      </small>
                    </button>
                    <button
                      disabled={!!state.loadout.armor}
                      onClick={() => apply(workshop(live.current, "armor"))}
                    >
                      Fit Rivetguard
                      <small>
                        3 scrap · absorb 2 damage · shoulder plate inserts
                      </small>
                    </button>
                    <button
                      onClick={() => apply(workshop(live.current, "repair"))}
                    >
                      Maintain held weapon
                      <small>
                        {effects.repairCost} scrap · restore condition, keep
                        history
                      </small>
                    </button>
                    <button onClick={() => apply(workshop(live.current, "bb"))}>
                      Work on the BB gun
                      <small>
                        Next utility stage requires faction favor or trust
                      </small>
                    </button>
                  </div>
                </>
              ) : null}
              {panel === "relay" &&
              state.journal.evidence["black-tag-ledger"] &&
              !state.choices["tyrone-reluctance"] ? (
                <div className="ending-options">
                  <button
                    onClick={() => apply(respondToTyrone(live.current, true))}
                  >
                    Give Tyrone time<small>Respect his reluctance.</small>
                  </button>
                  <button
                    onClick={() => apply(respondToTyrone(live.current, false))}
                  >
                    Ask what he is withholding
                    <small>Push for an answer before he is ready.</small>
                  </button>
                </div>
              ) : null}
              {panel === "market" ? (
                <button
                  className="primary"
                  disabled={!effects.supplyAccess}
                  onClick={() => apply(buyAmmo(live.current))}
                >
                  Buy .30-30 Ball
                  <small>12 rounds · {effects.ammoPrice} scrap</small>
                </button>
              ) : null}
              {panel === "gate" && state.progression.phase === "settlement" ? (
                <Settlement
                  state={state}
                  onChoose={(choice, expose) =>
                    apply(settle(live.current, choice, expose))
                  }
                />
              ) : null}
              {panel === "gate" && state.progression.phase === "complete" ? (
                <div className="chapter-complete">
                  <p className="eyebrow">THE INVOICE / SETTLED</p>
                  <h3>
                    {state.choices["ironclad-settlement"] === "accord"
                      ? "A working road."
                      : state.choices["ironclad-settlement"] === "compact"
                        ? "Steel keeps moving."
                        : "Supplies reach the mountain."}
                  </h3>
                  <p>
                    Your choice is saved. Ironclad remains playable. Later
                    regions are not open in this build.
                  </p>
                </div>
              ) : null}
              <button className="text-button" onClick={close}>
                Back to the world →
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </main>
  );
}
function Settlement({
  state,
  onChoose,
}: {
  state: Save;
  onChoose: (choice: "compact" | "ashen" | "accord", expose: boolean) => void;
}) {
  const [expose, setExpose] = useState(false);
  return (
    <div className="ending-options">
      <label className="setting">
        <span>
          Share the black-tag ledger with Compact, Ashen and Relay. This raises
          Kane’s attention.
        </span>
        <input
          type="checkbox"
          checked={expose}
          onChange={(e) => setExpose(e.target.checked)}
        />
      </label>
      <button onClick={() => onChoose("compact", expose)}>
        Back the Compact
        <small>Guard escorts and cheaper repairs; Ashen road closes.</small>
      </button>
      <button onClick={() => onChoose("ashen", expose)}>
        Back the Ashen Pack
        <small>Mountain supplies and safe scouts; Compact stores close.</small>
      </button>
      <button
        className="primary"
        disabled={state.tyrone.memories.route.status !== "recovered"}
        onClick={() => onChoose("accord", expose)}
      >
        Negotiate a working agreement
        <small>
          Requires the old route signal. Paid rail work and mountain supplies;
          Free Route owes escorts.
        </small>
      </button>
    </div>
  );
}
