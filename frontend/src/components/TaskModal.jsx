import { useEffect, useState } from "react";
import { normalizeTimeValue } from "../dates";

const emptyForm = {
  title: "",
  notes: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  untilMidnight: false,
  category: "study",
  priority: "normal",
  tags: "",
  notifyAtTime: true,
  notifyOneDayEarlier: true,
  notifyMinutesBefore: 15,
  completed: false,
  recurrenceEnabled: false,
  recurrenceDays: [],
};

const DOW = [
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
  { v: 7, l: "Sun" },
];

function toTimeInputValue(t) {
  if (!t || t === "24:00") return "";
  return normalizeTimeValue(t);
}

export default function TaskModal({ open, initial, categories, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (initial) {
      const end = initial.endTime || "10:00";
      setForm({
        title: initial.title || "",
        notes: initial.notes || "",
        date: initial.date || "",
        startTime: initial.startTime || "09:00",
        endTime: end === "24:00" ? "23:59" : end,
        untilMidnight: end === "24:00",
        category: initial.category || "study",
        priority: initial.priority || "normal",
        tags: (initial.tags || []).join(", "),
        notifyAtTime: initial.notifyAtTime ?? true,
        notifyOneDayEarlier: initial.notifyOneDayEarlier ?? true,
        notifyMinutesBefore: initial.notifyMinutesBefore ?? 15,
        completed: initial.completed ?? false,
        recurrenceEnabled: Boolean(initial.recurrence?.daysOfWeek?.length),
        recurrenceDays: initial.recurrence?.daysOfWeek || [],
        id: initial.id,
      });
    } else setForm(emptyForm);
  }, [open, initial]);

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleDay(v) {
    setForm((f) => {
      const has = f.recurrenceDays.includes(v);
      return {
        ...f,
        recurrenceDays: has
          ? f.recurrenceDays.filter((d) => d !== v)
          : [...f.recurrenceDays, v],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const startTime = normalizeTimeValue(form.startTime);
      const endTime = form.untilMidnight
        ? "24:00"
        : normalizeTimeValue(form.endTime);
      if (!startTime) throw new Error("Choose a start time (e.g. 16:45).");
      if (!endTime) throw new Error("Choose an end time (e.g. 17:10).");

      const payload = {
        title: form.title.trim(),
        notes: form.notes,
        date: form.date,
        startTime,
        endTime,
        category: form.category,
        priority: form.priority,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notifyAtTime: form.notifyAtTime,
        notifyOneDayEarlier: form.notifyOneDayEarlier,
        notifyMinutesBefore: Number(form.notifyMinutesBefore) || 0,
        completed: form.completed,
        recurrence: form.recurrenceEnabled
          ? {
              daysOfWeek: form.recurrenceDays,
              startTime,
              endTime,
            }
          : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Could not save scroll");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id || String(form.id).includes("__") || !onDelete) return;
    if (!confirm("Vanishing Charm — delete this work?")) return;
    setSaving(true);
    try {
      await onDelete(form.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <h2>{form.id ? "Edit Enchantment" : "Assign Work"}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="modal__form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Defence Against the Dark Arts…"
              autoFocus
            />
          </label>
          <label>
            Day
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Start (any minute — e.g. 16:45)
              <input
                type="time"
                required
                step={60}
                min="05:00"
                max="23:59"
                value={toTimeInputValue(form.startTime)}
                onChange={(e) => update("startTime", normalizeTimeValue(e.target.value))}
              />
            </label>
            <label>
              End (e.g. 17:10)
              <input
                type="time"
                required={!form.untilMidnight}
                step={60}
                min="05:00"
                max="23:59"
                disabled={form.untilMidnight}
                value={form.untilMidnight ? "" : toTimeInputValue(form.endTime)}
                onChange={(e) => update("endTime", normalizeTimeValue(e.target.value))}
              />
            </label>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={form.untilMidnight}
              onChange={(e) => update("untilMidnight", e.target.checked)}
            />
            Ends at midnight (24:00)
          </label>
          <p className="time-hint">
            Incomplete blocks show subject colour. Finish work to keep your House Cup rising.
          </p>
          <div className="form-row">
            <label>
              Subject / House path
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} · {c.house}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="high">High (Dark Mark)</option>
              </select>
            </label>
          </div>
          <label>
            Tags (comma-separated)
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="owl, essay, potions"
            />
          </label>
          <label>
            Notes
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>

          <fieldset className="reminders-fieldset">
            <legend>Recurring (every week)</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={form.recurrenceEnabled}
                onChange={(e) => update("recurrenceEnabled", e.target.checked)}
              />
              Repeat on selected days (e.g. Mon/Wed 6–8)
            </label>
            {form.recurrenceEnabled && (
              <div className="dow-row">
                {DOW.map((d) => (
                  <button
                    key={d.v}
                    type="button"
                    className={`dow-chip${form.recurrenceDays.includes(d.v) ? " is-on" : ""}`}
                    onClick={() => toggleDay(d.v)}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="reminders-fieldset">
            <legend>Owl reminders</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={form.notifyAtTime}
                onChange={(e) => update("notifyAtTime", e.target.checked)}
              />
              Time-Turner alert before start
            </label>
            {form.notifyAtTime && (
              <label className="indent">
                Minutes before
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={form.notifyMinutesBefore}
                  onChange={(e) => update("notifyMinutesBefore", e.target.value)}
                />
              </label>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={form.notifyOneDayEarlier}
                onChange={(e) => update("notifyOneDayEarlier", e.target.checked)}
              />
              Howler one day earlier (9:00 AM)
            </label>
          </fieldset>

          {form.id && !String(form.id).includes("__") && (
            <label className="check">
              <input
                type="checkbox"
                checked={form.completed}
                onChange={(e) => update("completed", e.target.checked)}
              />
              Snitch caught (completed)
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          <div className="modal__actions">
            {form.id && !String(form.id).includes("__") && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={saving}
              >
                Vanish
              </button>
            )}
            <div className="modal__actions-right">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Sealing…" : "Seal Scroll"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
