"use client";

import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import type { PointerEvent } from "react";
import ClockCard from "@/components/ClockCard";
import AddClockForm from "@/components/AddClockForm";
import {
  DEFAULT_CLOCKS,
  getClockSnapshot,
  getServerClockSnapshot,
  saveClocks,
  subscribeToClocks,
  updateClocks,
} from "@/lib/clocks.ts";

type DragState = {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const subscribeToClient = () => () => {};
const getClientStatus = () => true;
const getServerStatus = () => false;
const subscribeToTime = (listener: () => void) => {
  const interval = window.setInterval(listener, 1000);
  return () => window.clearInterval(interval);
};
const getCurrentTime = () => Math.floor(Date.now() / 1000) * 1000;
const getServerTime = () => 0;

export default function ClockDashboard() {
  const { clocks, error: storageError } = useSyncExternalStore(
    subscribeToClocks,
    getClockSnapshot,
    getServerClockSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToClient,
    getClientStatus,
    getServerStatus,
  );
  const timestamp = useSyncExternalStore(
    subscribeToTime,
    getCurrentTime,
    getServerTime,
  );

  const time = isHydrated ? new Date(timestamp) : null;
  const canvasRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for native fullscreen changes (e.g., pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleAddClock = (name: string, timeZone: string, color: string) => {
    const furthestDown = clocks.reduce(
      (max, clock) => Math.max(max, clock.position.y),
      -224,
    );

    updateClocks((current) => [
      ...current,
      {
        id: `clock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        timeZone,
        color,
        isCustom: true,
        position: { x: 0, y: furthestDown + 224 },
      },
    ]);
  };

  const handleRemoveClock = (id: string) => {
    updateClocks((current) => current.filter((clock) => clock.id !== id));
  };

  const handleResetDashboard = () => {
    updateClocks(() => DEFAULT_CLOCKS);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen mode:", err);
    }
  };

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    const card = event.currentTarget.closest<HTMLElement>(".clock-card");
    if (!card) return;

    const cardRect = card.getBoundingClientRect();
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: event.clientX - cardRect.left,
      offsetY: event.clientY - cardRect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    const card = event.currentTarget.closest<HTMLElement>(".clock-card");
    if (!drag || drag.pointerId !== event.pointerId || !canvas || !card) return;

    const SNAP_GRID = 20;
    const canvasRect = canvas.getBoundingClientRect();
    const maxX = Math.max(0, canvas.clientWidth - card.offsetWidth);

    const rawX =
      event.clientX - canvasRect.left + canvas.scrollLeft - drag.offsetX;
    const rawY =
      event.clientY - canvasRect.top + canvas.scrollTop - drag.offsetY;

    const nextX = Math.min(
      maxX,
      Math.max(0, Math.round(rawX / SNAP_GRID) * SNAP_GRID),
    );
    const nextY = Math.max(0, Math.round(rawY / SNAP_GRID) * SNAP_GRID);

    updateClocks(
      (current) =>
        current.map((clock) =>
          clock.id === drag.id
            ? { ...clock, position: { x: nextX, y: nextY } }
            : clock,
        ),
      false,
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      saveClocks();
    }
  };

  const canvasHeight = Math.max(448, ...clocks.map((c) => c.position.y + 208));

  return (
    <main className="dashboard">
      <div className="dashboard__content">
        <header className="dashboard__header">
          <div className="dashboard__eyebrow">
            <span className="dashboard__live-dot" />
            YOUR TIME, AROUND THE WORLD
          </div>
          <h1 className="dashboard__title">
            Every place has
            <br />
            <span>its own moment.</span>
          </h1>
          <p className="dashboard__intro">
            A little closer to everywhere. Add your places, then make the clock
            wall your own.
          </p>
        </header>

        <AddClockForm onAddClock={handleAddClock} />

        <section aria-labelledby="clocks-title" className="clock-section">
          <div className="clock-section__heading">
            <div>
              <p className="section-kicker">YOUR WORLD</p>
              <div className="flex items-center gap-4">
                <h2 id="clocks-title">World clocks</h2>
                <button
                  onClick={handleResetDashboard}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition-colors border border-zinc-700"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="text-xs bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 px-3 py-1.5 rounded-md transition-colors border border-emerald-800/50 flex items-center gap-2"
                >
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                </button>
              </div>
            </div>
            <p className="clock-section__tip">
              <span aria-hidden="true">⠿</span> Drag the handle to rearrange
            </p>
          </div>

          {storageError && (
            <p className="storage-warning" role="status">
              {storageError}
            </p>
          )}

          {/* Fullscreen Wrapper */}
          <div
            ref={fullscreenContainerRef}
            className={
              isFullscreen
                ? "bg-[#10110f] p-8 overflow-auto h-screen w-screen"
                : ""
            }
          >
            <div
              aria-label="Draggable world clocks"
              className="clock-canvas"
              ref={canvasRef}
              style={{ height: canvasHeight }}
            >
              {isHydrated && time ? (
                clocks.map((clock) => (
                  <ClockCard
                    clock={clock}
                    key={clock.id}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onRemove={handleRemoveClock}
                    time={time}
                  />
                ))
              ) : (
                <p className="clock-canvas__loading">
                  Tuning into the world...
                </p>
              )}
            </div>
          </div>
        </section>

        <footer className="dashboard__footer">
          <span>TIME IS BETTER WHEN IT BRINGS US CLOSER.</span>
          <span>UPDATED EVERY SECOND</span>
        </footer>
      </div>
    </main>
  );
}
