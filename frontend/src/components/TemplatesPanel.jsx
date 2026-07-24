export default function TemplatesPanel({ templates, onApply }) {
  return (
    <section className="templates parchment">
      <h2>Spell Scrolls</h2>
      <p className="templates__lead">Preset weeks from the Hogwarts curriculum.</p>
      <ul className="templates__list">
        {(templates || []).map((t) => (
          <li key={t.id}>
            <div>
              <strong>{t.name}</strong>
              <span>{t.tagline}</span>
              <p>{t.description}</p>
            </div>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => onApply(t.id)}>
              Cast
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
