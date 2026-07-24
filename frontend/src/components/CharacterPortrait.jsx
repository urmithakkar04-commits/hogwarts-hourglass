/** Real film-figure cutout that pops out of the task box. */
export default function CharacterPortrait({ character, size = "md", pop = false }) {
  const id = character?.id || "snape";
  const name = character?.shortName || character?.name || "Snape";
  const src = character?.image || `/characters/${id}.png`;

  return (
    <div
      className={`char-cutout char-cutout--${size}${pop ? " char-cutout--pop" : ""} char-cutout--${id}`}
      title={character?.name || name}
    >
      <img
        className="char-cutout__img"
        src={src}
        alt={character?.name || name}
        draggable={false}
      />
      <span className="char-cutout__name">{name}</span>
    </div>
  );
}
