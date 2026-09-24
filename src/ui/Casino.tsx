import { useEffect, useRef, useState } from "react";
import type { Save } from "../game/domain/types";
import type { Outcome } from "../game/domain/outcome";
import type { GameId } from "../game/life-state";
import {
  GAMES,
  GAME_NAMES,
  RULES,
  startGame,
  playCasino,
  exchangeChips,
  readLesson,
  canStartGame,
  TRIVIA,
  TRUEFALSE,
  SCRAMBLE,
  CREE,
} from "../game/casino";
import {
  handValue,
  canDouble,
  canSplit,
  basicStrategy,
  strategyLine,
  type Card,
} from "../game/leisure/blackjack";
import type { BetKind } from "../game/leisure/roulette";
import { POKER_PAY, POKER_LABEL } from "../game/leisure/video-poker";
const suit = { S: "♠", H: "♥", D: "♦", C: "♣" };
function PlayingCard({
  card,
  hidden = false,
}: {
  card?: Card;
  hidden?: boolean;
}) {
  return (
    <span
      className={`playing-card ${card && ["H", "D"].includes(card.suit) ? "red-card" : ""}`}
      aria-label={
        hidden ? "Hidden card" : card ? `${card.rank} of ${card.suit}` : "card"
      }
    >
      {hidden ? (
        "H"
      ) : card ? (
        <>
          <b>{card.rank}</b>
          <span>{suit[card.suit]}</span>
        </>
      ) : null}
    </span>
  );
}
function Lockpick({
  target,
  stage,
  manual,
  onTurn,
}: {
  target: number;
  stage: number;
  manual: boolean;
  onTurn: (n: number) => void;
}) {
  const [position, setPosition] = useState(50),
    [accessible, setAccessible] = useState(manual);
  useEffect(() => {
    if (accessible) return;
    let frame = 0;
    const draw = (now: number) => {
      setPosition((Math.sin(now / 650) + 1) * 50);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [accessible]);
  const width = Math.max(3, 9 - stage * 2) * 2;
  return (
    <>
      <div
        className="lock-dial"
        role="img"
        aria-label={`Target from ${Math.round(target - width / 2)} to ${Math.round(target + width / 2)}`}
      >
        <i style={{ left: `${target - width / 2}%`, width: `${width}%` }} />
        <b style={{ left: `${position}%` }} />
      </div>
      <button className="primary" onClick={() => onTurn(position)}>
        Turn the pick
      </button>
      <label className="setting">
        <span>Manual dial / reduced motion</span>
        <input
          type="checkbox"
          checked={accessible}
          onChange={(e) => setAccessible(e.target.checked)}
        />
      </label>
      {accessible ? (
        <input
          aria-label="Pick position"
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
      ) : null}
    </>
  );
}
export default function Casino({
  state,
  apply,
}: {
  state: Save;
  apply: (o: Outcome) => void;
}) {
  const c = state.life.casino,
    r = c.round;
  const [game, setGame] = useState<GameId>(r?.game ?? "blackjack"),
    [stake, setStake] = useState(2),
    [bet, setBet] = useState<BetKind>("red"),
    [number, setNumber] = useState(0),
    [word, setWord] = useState(""),
    [cell, setCell] = useState<string | null>(null),
    [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (r?.game !== "scramble" || r.settled) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [r?.game, r?.settled]);
  const table = useRef<HTMLElement>(null);
  useEffect(() => {
    if (r && !r.settled) table.current?.scrollIntoView({ block: "start" });
  }, [r?.game, r?.settled]);
  const blocked = canStartGame(state, game),
    active = r && !r.settled;
  const choose = (g: GameId) => {
    setGame(g);
    setCell(null);
    setWord("");
  };
  const step = (a: Parameters<typeof playCasino>[1]) =>
    apply(playCasino(state, a, Date.now()));
  return (
    <div className="casino">
      <p className="eyebrow">THE THIRTY-EIGHT / VAULT 13 RADIO</p>
      <h2>A light left on.</h2>
      <p className="casino-intro">
        Cards on felt. A terminal humming in the corner. Somewhere to spend an
        evening between roads.
      </p>
      <div className="chip-account">
        <strong>
          {c.chips}
          <small> CHIPS</small>
        </strong>
        <span>
          Day {state.life.day} · {c.redeemed}/20 scrap redeemed
        </span>
      </div>
      {!active ? (
        <>
          <div className="job-actions">
            <button
              disabled={!!active || state.inventory.supplies.scrap < 2}
              onClick={() => apply(exchangeChips(state, "buy"))}
            >
              Buy 10 chips<small>2 scrap</small>
            </button>
            <button
              disabled={!!active || c.chips < 10 || c.redeemed >= 20}
              onClick={() => apply(exchangeChips(state, "redeem"))}
            >
              Redeem 10 chips<small>2 scrap · daily limit applies</small>
            </button>
          </div>
          <p className="small">
            Local game currency. No purchases or real-money stakes.
          </p>
          <div
            className="casino-games"
            role="group"
            aria-label="Casino activities"
          >
            {GAMES.map((g) => (
              <button
                key={g}
                aria-pressed={game === g}
                disabled={!!active && r.game !== g}
                onClick={() => choose(g)}
              >
                {GAME_NAMES[g]}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <section className="casino-table" ref={table}>
        <p className="eyebrow">
          {["blackjack", "roulette", "poker"].includes(game)
            ? "THE TABLES"
            : "THE CABINETS"}
        </p>
        <h3>{GAME_NAMES[game]}</h3>
        <p>{RULES[game]}</p>
        {game === "poker" ? (
          <details>
            <summary>Pay table</summary>
            {Object.entries(POKER_PAY).map(([id, pay]) => (
              <p key={id}>
                {POKER_LABEL[id as keyof typeof POKER_LABEL]} · {pay}×
              </p>
            ))}
          </details>
        ) : null}
        <p className="casino-message" role="status">
          {c.message}
        </p>
        {game === "cree" ? (
          <div className="lesson-cards">
            {CREE.map((l) => (
              <button key={l.id} onClick={() => apply(readLesson(state, l.id))}>
                <strong>{l.word}</strong>
                <small>
                  {l.title} {c.lessons.includes(l.id) ? "· read" : "· new card"}
                </small>
                <span>{l.meaning}</span>
              </button>
            ))}
          </div>
        ) : null}
        {r?.game === game ? (
          <>
            {r.game === "blackjack" ? (
              <>
                <p className="eyebrow">
                  DEALER{" "}
                  {r.settled ? `/ ${handValue(r.table.dealer).total}` : ""}
                </p>
                <div className="card-hand">
                  {r.table.dealer.map((card, i) => (
                    <PlayingCard
                      key={i}
                      card={card}
                      hidden={!r.settled && i > 0}
                    />
                  ))}
                </div>
                {r.table.hands.map((h, i) => (
                  <div
                    key={i}
                    className={`player-hand ${i === r.table.active && !r.settled ? "active-hand" : ""}`}
                  >
                    <p>
                      Hand {i + 1} · {handValue(h.cards).total} · {h.bet} chips
                    </p>
                    <div className="card-hand">
                      {h.cards.map((card, k) => (
                        <PlayingCard key={k} card={card} />
                      ))}
                    </div>
                  </div>
                ))}
                {!r.settled ? (
                  <>
                    <p className="tyrone-whisper">
                      {strategyLine(
                        basicStrategy(
                          r.table.hands[r.table.active].cards,
                          r.table.dealer[0],
                        ),
                      )}
                    </p>
                    <div className="table-actions">
                      <button onClick={() => step({ kind: "hit" })}>Hit</button>
                      <button onClick={() => step({ kind: "stand" })}>
                        Stand
                      </button>
                      <button
                        disabled={
                          !canDouble(r.table.hands[r.table.active]) ||
                          c.chips < r.table.hands[r.table.active].bet
                        }
                        onClick={() => step({ kind: "double" })}
                      >
                        Double
                      </button>
                      <button
                        disabled={
                          r.table.hands.length >= 2 ||
                          !canSplit(r.table.hands[r.table.active]) ||
                          c.chips < r.table.hands[r.table.active].bet
                        }
                        onClick={() => step({ kind: "split" })}
                      >
                        Split
                      </button>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
            {r.game === "poker" ? (
              <>
                <div className="poker-hand">
                  {r.hand.map((card, i) => (
                    <button
                      key={i}
                      disabled={r.settled}
                      aria-pressed={r.held.includes(i)}
                      aria-label={`${card.rank} ${card.suit}${r.held.includes(i) ? " held" : ""}`}
                      onClick={() => step({ kind: "hold", index: i })}
                    >
                      <PlayingCard card={card} />
                      <small>{r.held.includes(i) ? "HELD" : "HOLD"}</small>
                    </button>
                  ))}
                </div>
                {!r.settled ? (
                  <button
                    className="primary"
                    onClick={() => step({ kind: "draw" })}
                  >
                    Draw replacements
                  </button>
                ) : null}
              </>
            ) : null}
            {r.game === "trivia" || r.game === "truefalse" ? (
              <>
                <p className="knowledge-question">
                  {
                    (r.game === "trivia" ? TRIVIA : TRUEFALSE).find(
                      (q) => q.id === r.id,
                    )?.q
                  }
                </p>
                <div className="story-choices">
                  {r.options.map((o) => (
                    <button
                      key={o}
                      disabled={r.settled}
                      onClick={() => step({ kind: "answer", value: o })}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {r.game === "scramble" ? (
              <>
                <div className="letter-rack">
                  {SCRAMBLE[r.rack].letters.split("").reverse().join(" ")}
                </div>
                <p>
                  {Math.max(0, Math.ceil((r.deadline - now) / 1000))} seconds ·{" "}
                  {r.found.length} words
                </p>
                <p>{r.found.join(" · ")}</p>
                {!r.settled ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      step({ kind: "word", value: word });
                      setWord("");
                    }}
                  >
                    <label>
                      Build a word
                      <input
                        aria-label="Scramble word"
                        autoComplete="off"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        maxLength={15}
                      />
                    </label>
                    <button type="submit">Record word</button>
                    <button
                      type="button"
                      onClick={() => step({ kind: "bank" })}
                    >
                      Bank rack
                    </button>
                  </form>
                ) : null}
              </>
            ) : null}
            {r.game === "wordsearch" ? (
              <>
                <p>
                  Select the first and last cell.{" "}
                  {cell ? `Start: ${cell}. Choose the last letter.` : ""}
                </p>
                <div
                  className="search-grid"
                  style={{ gridTemplateColumns: `repeat(${r.board.size},1fr)` }}
                >
                  {r.board.grid.flatMap((row, y) =>
                    row.map((letter, x) => {
                      const id = `${y}:${x}`;
                      return (
                        <button
                          key={id}
                          disabled={r.settled}
                          aria-label={`Row ${y + 1}, column ${x + 1}, ${letter}`}
                          aria-pressed={cell === id}
                          className={
                            r.board.words.some(
                              (w) =>
                                r.found.includes(w.word) &&
                                w.cells.includes(id),
                            )
                              ? "found-cell"
                              : ""
                          }
                          onClick={() => {
                            if (!cell) setCell(id);
                            else {
                              step({ kind: "line", from: cell, to: id });
                              setCell(null);
                            }
                          }}
                        >
                          {letter}
                        </button>
                      );
                    }),
                  )}
                </div>
                <p className="word-targets">
                  {r.board.words.map((w) => (
                    <span
                      key={w.word}
                      className={r.found.includes(w.word) ? "found-word" : ""}
                    >
                      {w.word}
                    </span>
                  ))}
                </p>
              </>
            ) : null}
            {r.game === "hack" ? (
              <>
                <p>{4 - r.guesses.length} attempts remain</p>
                <div className="hack-words">
                  {r.words.map((w) => (
                    <button
                      key={w}
                      disabled={r.settled || r.guesses.includes(w)}
                      onClick={() => step({ kind: "guess", value: w })}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {r.game === "lockpick" ? (
              <>
                <p>
                  {r.stage}/3 tumblers · {2 - r.misses} misses remaining
                </p>
                {!r.settled ? (
                  <Lockpick
                    target={r.target}
                    stage={r.stage}
                    manual={state.settings.reducedMotion}
                    onTurn={(position) => step({ kind: "turn", position })}
                  />
                ) : null}
              </>
            ) : null}
            {r.game === "slots" || r.game === "roulette" ? (
              <div className="slot-faces">
                {r.faces.map((f, i) => (
                  <span key={i}>{f}</span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        {!active && game !== "cree" ? (
          <div className="deal-controls">
            {["blackjack", "roulette", "poker", "slots"].includes(game) ? (
              <label>
                Stake
                <select
                  aria-label="Chip stake"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                >
                  {[2, 4, 10, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} chips
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {game === "roulette" ? (
              <>
                <label>
                  Bet
                  <select
                    aria-label="Roulette bet"
                    value={bet}
                    onChange={(e) => {
                      setBet(e.target.value as BetKind);
                      setNumber(e.target.value === "straight" ? 0 : 1);
                    }}
                  >
                    {[
                      "red",
                      "black",
                      "even",
                      "odd",
                      "low",
                      "high",
                      "straight",
                      "dozen",
                      "column",
                    ].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                {["straight", "dozen", "column"].includes(bet) ? (
                  <label>
                    Number
                    <input
                      aria-label="Wheel number"
                      type="number"
                      min={bet === "straight" ? 0 : 1}
                      max={bet === "straight" ? 36 : 3}
                      value={number}
                      onChange={(e) => setNumber(Number(e.target.value))}
                    />
                  </label>
                ) : null}
              </>
            ) : null}
            <button
              className="primary"
              disabled={
                !!blocked ||
                (["blackjack", "roulette", "poker", "slots"].includes(game) &&
                  c.chips < stake)
              }
              onClick={() => {
                setCell(null);
                apply(
                  startGame(state, game, stake, Date.now(), {
                    kind: bet,
                    n: number,
                    stake,
                  }),
                );
              }}
            >
              Start {GAME_NAMES[game]}
            </button>
            {blocked ? <p>{blocked}</p> : null}
          </div>
        ) : null}
        {active ? (
          <button
            className="text-button"
            onClick={() => step({ kind: "leave" })}
          >
            Leave round / forfeit unbanked rewards
          </button>
        ) : null}
      </section>
    </div>
  );
}
