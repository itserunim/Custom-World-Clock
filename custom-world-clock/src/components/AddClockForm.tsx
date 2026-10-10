"use client";

import { useState, type FormEvent } from "react";
import { TIME_ZONE_OPTIONS } from "@/lib/clocks";

type AddClockFormProps = {
  onAddClock: (name: string, timeZone: string, color: string) => void;
};

export default function AddClockForm({ onAddClock }: AddClockFormProps) {
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState<string>("Asia/Tokyo");
  const [color, setColor] = useState("#23d5d5");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onAddClock(trimmedName, timeZone, color);
    setName("");
  };

  return (
    <section aria-labelledby="add-clock-title" className="add-clock">
      <div className="add-clock__heading">
        <div>
          <p className="section-kicker">MAKE IT YOURS</p>
          <h2 id="add-clock-title">Add a place</h2>
        </div>
        <span className="add-clock__icon" aria-hidden="true">
          ＋
        </span>
      </div>
      <form className="add-clock__form" onSubmit={handleSubmit}>
        <label className="field field--name">
          <span>Display name</span>
          <input
            autoComplete="off"
            maxLength={36}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mom's time"
            required
            value={name}
          />
        </label>
        <label className="field field--zone">
          <span>Country / time zone</span>
          <select
            onChange={(event) => setTimeZone(event.target.value)}
            value={timeZone}
          >
            {TIME_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--color">
          <span>Accent color</span>
          <span className="color-picker">
            <input
              aria-label="Choose clock accent color"
              onChange={(event) => setColor(event.target.value)}
              type="color"
              value={color}
            />
            <span>{color.toUpperCase()}</span>
          </span>
        </label>
        <button className="add-clock__submit" type="submit">
          <span>＋</span> Add clock
        </button>
      </form>
      <p className="add-clock__hint">
        Your color becomes a live gradient around the clock.
      </p>
    </section>
  );
}
