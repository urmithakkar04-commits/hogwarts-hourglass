export const CATEGORY_STYLE = {
  study: {
    house: "Ravenclaw",
    label: "Study",
    color: "#1a3a6b",
    accent: "#5b8def",
    border: "#9ec1ff",
    text: "#f4f8ff",
    chip: "rgba(14, 26, 64, 0.55)",
  },
  project: {
    house: "Gryffindor",
    label: "Project",
    color: "#8b0000",
    accent: "#e8a317",
    border: "#ffd56a",
    text: "#fff8e8",
    chip: "rgba(80, 0, 0, 0.45)",
  },
  class: {
    house: "Hufflepuff",
    label: "Class",
    color: "#c9a227",
    accent: "#5c3d12",
    border: "#ffe08a",
    text: "#1c140c",
    chip: "rgba(255, 248, 220, 0.55)",
  },
  personal: {
    house: "Slytherin",
    label: "Personal",
    color: "#145a32",
    accent: "#58d68d",
    border: "#a9dfbf",
    text: "#f2fff6",
    chip: "rgba(10, 40, 20, 0.5)",
  },
};

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
