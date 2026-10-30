"use client";

type ScrollRailControlsProps = {
  targetId: string;
  label: string;
};

export default function ScrollRailControls({ targetId, label }: ScrollRailControlsProps) {
  function move(direction: -1 | 1) {
    const rail = document.getElementById(targetId);
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.max(280, rail.clientWidth * 0.78),
      behavior: "smooth",
    });
  }

  return (
    <div className="rail-controls" aria-label={`${label} carousel controls`}>
      <span>Swipe or use the arrows</span>
      <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`}>
        <span aria-hidden="true">←</span>
      </button>
      <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`}>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
