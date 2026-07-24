export default function RemindersPanel({ reminders, onRefresh, onSnooze }) {
  return (
    <aside className="reminders parchment" aria-labelledby="reminders-heading">
      <div className="reminders__head">
        <h2 id="reminders-heading">Owl Post</h2>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <p className="reminders__lead">
        Timed Time-Turners and one-day Howlers. Snooze with Stupefy for 10 minutes.
      </p>
      {reminders.length === 0 ? (
        <p className="reminders__empty">No owls in flight.</p>
      ) : (
        <ul className="reminders__list">
          {reminders.map((r) => {
            const when = new Date(r.fireAt);
            return (
              <li
                key={`${r.instanceId || r.taskId}-${r.kind}-${r.originalFireAt || r.fireAt}`}
                className="reminder-card"
              >
                <span
                  className={`reminder-card__kind${
                    r.kind === "one_day_earlier" ? " is-early" : " is-timed"
                  }`}
                >
                  {r.kind === "one_day_earlier" ? "Howler −1 day" : "Time-Turner"}
                </span>
                <strong className="reminder-card__title">
                  {r.character?.glyph} {r.title}
                </strong>
                <span className="reminder-card__meta">
                  {r.date}
                  {r.startTime ? ` · ${r.startTime}` : ""} · {r.character?.name}
                </span>
                <span className="reminder-card__fire">
                  Delivers{" "}
                  {when.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() =>
                    onSnooze({
                      taskId: r.taskId,
                      kind: r.kind,
                      originalFireAt: r.originalFireAt || r.fireAt,
                      minutes: 10,
                    })
                  }
                >
                  Snooze 10m
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
