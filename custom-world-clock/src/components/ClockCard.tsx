"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  formatClockDate,
  formatClockTime,
  type ClockDefinition,
} from "@/lib/clocks.ts";
import AnalogClock from "./AnalogClock";

type ClockCardProps = {
  clock: ClockDefinition;
  time: Date;
  onRemove: (id: string) => void;
  onPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: string,
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export default function ClockCard({
  clock,
  time,
  onRemove,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ClockCardProps) {
  const style = {
    left: clock.position.x,
    top: clock.position.y,
    "--clock-accent": clock.color,
    /* This variable now smoothly drives the 100% loading ring in the CSS */
    "--clock-angle": `${time.getSeconds() * 6}deg`,
    /* Prevents the mobile browser from scrolling while dragging a card */
    touchAction: "none",
  } as CSSProperties & Record<"--clock-accent" | "--clock-angle", string>;

  return (
    <article className="clock-card" style={style}>
      <div className="clock-card__surface">
        <div className="clock-card__topline">
          <div className="clock-card__controls">
            <button
              aria-label={`Drag ${clock.name} clock`}
              className="clock-card__drag"
              onPointerDown={(event) => onPointerDown(event, clock.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              title="Drag to move this clock"
              type="button"
            >
              <span aria-hidden="true">⠿</span>
            </button>
            <span className="clock-card__zone">
              {clock.timeZone.replaceAll("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AnalogClock
              time={time}
              timeZone={clock.timeZone}
              color={clock.color}
            />
            {/* The remove button is now unconditionally rendered for all clocks */}
            <button
              aria-label={`Remove ${clock.name} clock`}
              className="clock-card__remove"
              onClick={() => onRemove(clock.id)}
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <h2 className="clock-card__name">{clock.name}</h2>
        <p className="clock-card__time">
          {formatClockTime(time, clock.timeZone)}
        </p>
        <p className="clock-card__date">
          {formatClockDate(time, clock.timeZone)}
        </p>
      </div>
    </article>
  );
}
