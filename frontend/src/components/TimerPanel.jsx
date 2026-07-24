import { useEffect, useState } from "react";
import { formatDuration } from "../hp";

export default function TimerPanel({ active, onStart, onStop, tasks }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active?.startedAt) {
      setElapsed(0);
      return undefined;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const linked = tasks.find((t) => t.id === active?.taskId);

  return (
    <section className="timer-panel parchment">
      <h2>Time-Turner</h2>
      <p className="timer-panel__lead">Track how long you&apos;ve truly worked.</p>
      <div className="timer-panel__display">{formatDuration(elapsed)}</div>
      {linked && <p className="timer-panel__task">On: {linked.title}</p>}
      <div className="timer-panel__actions">
        {active ? (
          <button type="button" className="btn btn--primary" onClick={onStop}>
            Stop &amp; save
          </button>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={() => onStart(null)}>
            Start free session
          </button>
        )}
      </div>
    </section>
  );
}
