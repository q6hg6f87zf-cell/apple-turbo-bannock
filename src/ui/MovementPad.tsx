import { useRef, useState } from "react";
export function MovementPad({
  move,
  reset,
}: {
  move: (x: number, y: number) => void;
  reset: () => void;
}) {
  const pointer = useRef<number | null>(null),
    [point, setPoint] = useState({ x: 0, y: 0 });
  const stop = () => {
    pointer.current = null;
    setPoint({ x: 0, y: 0 });
    move(0, 0);
  };
  return (
    <div className="walk-controls">
      <div
        role="group"
        aria-label="Movement joystick"
        className="movement-pad"
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (pointer.current !== e.pointerId) return;
          const r = e.currentTarget.getBoundingClientRect();
          let x = (e.clientX - r.left - r.width / 2) / 35,
            y = (e.clientY - r.top - r.height / 2) / 35;
          const l = Math.max(1, Math.hypot(x, y));
          x /= l;
          y /= l;
          setPoint({ x, y });
          move(x, y);
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <span
          style={{
            transform: `translate(${point.x * 28}px,${point.y * 28}px)`,
          }}
        >
          ✥
        </span>
      </div>
      <button onClick={reset}>Centre camera</button>
    </div>
  );
}
