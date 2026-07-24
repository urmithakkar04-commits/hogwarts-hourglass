import { CATEGORY_STYLE } from "../hp";
import { formatHourLabel, taskLayout } from "../dates";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekGrid({
  weekDates,
  tasks,
  hourSlots,
  todayIso,
  onSlotClick,
  onTaskClick,
  onToggleComplete,
}) {
  const byDate = {};
  for (const d of weekDates) byDate[d] = [];
  for (const t of tasks) {
    if (byDate[t.date]) byDate[t.date].push(t);
  }

  return (
    <div className="week-grid" role="grid" aria-label="Weekly Marauder's Map schedule">
      <div className="week-grid__corner" />
      {weekDates.map((date, i) => {
        const d = new Date(date + "T12:00:00");
        const isToday = date === todayIso;
        return (
          <div
            key={date}
            className={`week-grid__dayhead${isToday ? " is-today" : ""}`}
          >
            <span className="week-grid__dow">{DAY_NAMES[i]}</span>
            <span className="week-grid__dom">{d.getDate()}</span>
          </div>
        );
      })}

      <div className="week-grid__times">
        {hourSlots.map((slot) => (
          <div key={slot} className="week-grid__time">
            {formatHourLabel(slot)}
          </div>
        ))}
        <div className="week-grid__time week-grid__time--end">Midnight</div>
      </div>

      {weekDates.map((date) => (
        <div key={date} className="week-grid__col">
          <div className="week-grid__slots">
            {hourSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className="week-grid__slot"
                aria-label={`Add on ${date} at ${slot}`}
                onClick={() => onSlotClick(date, slot)}
              />
            ))}
          </div>
          <div className="week-grid__tasks">
            {(byDate[date] || [])
              .filter((t) => t.startTime)
              .map((task) => {
                const layout = taskLayout(task);
                const style = CATEGORY_STYLE[task.category] || CATEGORY_STYLE.study;
                return (
                  <div
                    key={task.id}
                    className={`task-block task-block--subject-${task.category || "study"}${task.completed ? " is-done" : ""}`}
                    style={{
                      ...layout,
                      background: `linear-gradient(145deg, ${style.color}, ${style.accent})`,
                      borderColor: style.border,
                      color: style.text,
                    }}
                  >
                    <button
                      type="button"
                      className="task-block__main"
                      onClick={() => onTaskClick(task)}
                    >
                      <span className="task-block__chip" style={{ background: style.chip }}>
                        {style.label}
                      </span>
                      <span className="task-block__title">{task.title}</span>
                      <span className="task-block__time">
                        {task.startTime}
                        {task.endTime ? `–${task.endTime}` : ""}
                      </span>
                    </button>
                    <label
                      className="task-block__complete"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        disabled={String(task.id).includes("__")}
                        onChange={() => {
                          if (String(task.id).includes("__")) return;
                          onToggleComplete(task);
                        }}
                      />
                      <span>{task.completed ? "Done" : "Done?"}</span>
                    </label>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
