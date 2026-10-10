"use client";

export default function AnalogClock({
  time,
  timeZone,
  color,
}: {
  time: Date;
  timeZone: string;
  color: string;
}) {
  // Extract exact regional time variables
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const hours = parseInt(
    parts.find((p) => p.type === "hour")?.value || "0",
    10,
  );
  const minutes = parseInt(
    parts.find((p) => p.type === "minute")?.value || "0",
    10,
  );
  const seconds = parseInt(
    parts.find((p) => p.type === "second")?.value || "0",
    10,
  );

  // Calculate rotation angles
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  return (
    <div className="relative w-10 h-10 rounded-full border border-zinc-700 bg-zinc-900 shadow-inner shrink-0">
      {/* 12, 3, 6, 9 markers */}
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-zinc-600 rounded-sm" />
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-zinc-600 rounded-sm" />
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-zinc-600 rounded-sm" />
      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-zinc-600 rounded-sm" />

      {/* Hour Hand */}
      <div
        className="absolute w-[2px] h-3 bg-zinc-400 origin-bottom rounded-full"
        style={{
          bottom: "50%",
          left: "calc(50% - 1px)",
          transform: `rotate(${hourAngle}deg)`,
        }}
      />
      {/* Minute Hand */}
      <div
        className="absolute w-[1.5px] h-4 bg-zinc-200 origin-bottom rounded-full"
        style={{
          bottom: "50%",
          left: "calc(50% - 0.75px)",
          transform: `rotate(${minuteAngle}deg)`,
        }}
      />
      {/* Second Hand */}
      <div
        className="absolute w-[1px] h-4.5 origin-bottom rounded-full"
        style={{
          bottom: "50%",
          left: "calc(50% - 0.5px)",
          backgroundColor: color,
          transform: `rotate(${secondAngle}deg)`,
        }}
      />

      {/* Center Pin */}
      <div
        className="absolute w-1.5 h-1.5 rounded-full bg-zinc-200"
        style={{ top: "calc(50% - 3px)", left: "calc(50% - 3px)" }}
      />
    </div>
  );
}
