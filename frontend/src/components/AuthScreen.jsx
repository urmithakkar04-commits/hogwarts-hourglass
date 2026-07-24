import { useState } from "react";
import { api, setToken } from "../api";

const HOUSES = ["Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"];

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    house: "Gryffindor",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--castle">
      <img
        className="auth-bg-castle"
        src="/scenes/hogwarts-castle.png"
        alt=""
      />
      <div className="auth-bg-clear" />

      <div className="auth-box">
        <div className="auth-box__brand">
          <img src="/icons/icon-512.png" alt="" className="auth-box__icon" />
          <div>
            <p className="auth-eyebrow">Personal planner</p>
            <h1>Hogwarts Hourglass</h1>
          </div>
        </div>
        <p className="auth-lead">
          Plan your week from 5 AM until midnight. Sign in to open your timetable.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            Enter
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
          >
            Enrol
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <label>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label>
                House
                <select value={form.house} onChange={(e) => update("house", e.target.value)}>
                  {HOUSES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@email.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
