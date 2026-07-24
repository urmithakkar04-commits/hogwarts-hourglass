import { formatDuration, CATEGORY_STYLE } from "../hp";

export default function AgendaView({ tasks, onTaskClick, onToggleComplete, onStartTimer }) {
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <section className="agenda">
      <header className="agenda__head">
        <h2>Today&apos;s Agenda</h2>
        <p>Colour marks the subject — tick Done when the work is finished.</p>
      </header>
      {open.length === 0 ? (
        <p className="agenda__empty">
          All clear — {done.length ? "Outstanding work today." : "No spells scheduled. Add work on the map."}
        </p>
      ) : (
        <ul className="agenda__list">
          {open.map((t) => {
            const style = CATEGORY_STYLE[t.category] || CATEGORY_STYLE.study;
            return (
              <li
                key={t.id}
                className="agenda-item"
                style={{ borderLeft: `5px solid ${style.accent}` }}
              >
                <button type="button" className="agenda-item__body" onClick={() => onTaskClick(t)}>
                  <span className="task-block__chip" style={{ background: style.color, color: style.text }}>
                    {style.label}
                  </span>
                  <strong>{t.title}</strong>
                  <span>
                    {t.startTime || "Untimed"}
                    {t.endTime ? `–${t.endTime}` : ""}
                  </span>
                </button>
                <div className="agenda-item__actions">
                  {!String(t.id).includes("__") && (
                    <>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onStartTimer(t)}>
                        Time-Turner
                      </button>
                      <label className="agenda-complete">
                        <input type="checkbox" checked={false} onChange={() => onToggleComplete(t)} />
                        Mark complete
                      </label>
                    </>
                  )}
                </div>
                {t.workedSeconds > 0 && (
                  <span className="agenda-item__worked">Worked {formatDuration(t.workedSeconds)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {done.length > 0 && (
        <div className="agenda__done">
          <h3>Completed ({done.length})</h3>
          <ul className="agenda__done-list">
            {done.map((t) => (
              <li key={t.id} className="agenda-done-row">
                <button type="button" onClick={() => onTaskClick(t)}>
                  {t.title}
                </button>
                <label className="agenda-complete">
                  <input type="checkbox" checked onChange={() => onToggleComplete(t)} />
                  Done
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
