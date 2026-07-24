export default function WeeklySummary({ summary }) {
  if (!summary) return null;
  const plannedH = (summary.plannedMinutes / 60).toFixed(1);
  const doneH = (summary.completedPlannedMinutes / 60).toFixed(1);
  const workedH = (summary.workedSeconds / 3600).toFixed(1);

  return (
    <section className="summary parchment">
      <h2>House Cup · Weekly OWLs</h2>
      <div className="summary__meter" aria-label="Weekly completion">
        <div className="summary__fill" style={{ width: `${summary.percentComplete}%` }} />
      </div>
      <p className="summary__pct">{summary.percentComplete}% complete</p>
      <ul className="summary__stats">
        <li>
          <strong>{summary.completedTasks}</strong> / {summary.totalTasks} tasks
        </li>
        <li>
          Planned <strong>{plannedH}h</strong> · Done blocks <strong>{doneH}h</strong>
        </li>
        <li>
          Time-Turner worked <strong>{workedH}h</strong>
        </li>
        <li>
          House points <strong>{summary.housePoints}</strong>
        </li>
      </ul>
      <p className="summary__motto">{summary.motto}</p>
    </section>
  );
}
