export type ClockPosition = {
  x: number;
  y: number;
};

export type ClockDefinition = {
  id: string;
  name: string;
  timeZone: string;
  color: string;
  isCustom: boolean;
  position: ClockPosition;
};

export const CLOCK_STORAGE_KEY = "custom-world-clock.clocks";

export const TIME_ZONE_OPTIONS = [
  { label: "Manila, Philippines", value: "Asia/Manila" },
  { label: "Tokyo, Japan", value: "Asia/Tokyo" },
  { label: "Seoul, South Korea", value: "Asia/Seoul" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Hong Kong", value: "Asia/Hong_Kong" },
  { label: "Ho Chi Minh City, Vietnam", value: "Asia/Ho_Chi_Minh" },
  { label: "Bangkok, Thailand", value: "Asia/Bangkok" },
  { label: "Jakarta, Indonesia", value: "Asia/Jakarta" },
  { label: "New Delhi, India", value: "Asia/Kolkata" },
  { label: "Dubai, UAE", value: "Asia/Dubai" },
  { label: "London, United Kingdom", value: "Europe/London" },
  { label: "Lisbon, Portugal", value: "Europe/Lisbon" },
  { label: "Paris, France", value: "Europe/Paris" },
  { label: "Berlin, Germany", value: "Europe/Berlin" },
  { label: "Johannesburg, South Africa", value: "Africa/Johannesburg" },
  { label: "New York, USA", value: "America/New_York" },
  { label: "Chicago, USA", value: "America/Chicago" },
  { label: "Denver, USA", value: "America/Denver" },
  { label: "Phoenix, USA", value: "America/Phoenix" },
  { label: "Los Angeles, USA", value: "America/Los_Angeles" },
  { label: "Toronto, Canada", value: "America/Toronto" },
  { label: "São Paulo, Brazil", value: "America/Sao_Paulo" },
  { label: "Sydney, Australia", value: "Australia/Sydney" },
  { label: "Auckland, New Zealand", value: "Pacific/Auckland" },
  { label: "UTC", value: "UTC" },
] as const;

export const DEFAULT_CLOCKS: ClockDefinition[] = [
  {
    id: "manila",
    name: "PH / SG / MY / CN / TW",
    timeZone: "Asia/Manila",
    color: "#23d5d5",
    isCustom: false,
    position: { x: 0, y: 0 },
  },
  {
    id: "tokyo",
    name: "Korea / Japan",
    timeZone: "Asia/Tokyo",
    color: "#a78bfa",
    isCustom: false,
    position: { x: 374, y: 0 },
  },
  {
    id: "vietnam",
    name: "Vietnam",
    timeZone: "Asia/Ho_Chi_Minh",
    color: "#fbbf24",
    isCustom: false,
    position: { x: 748, y: 0 },
  },
  {
    id: "portugal",
    name: "Portugal",
    timeZone: "Europe/Lisbon",
    color: "#fb7185",
    isCustom: false,
    position: { x: 0, y: 224 },
  },
  {
    id: "arizona",
    name: "Arizona (USA)",
    timeZone: "America/Phoenix",
    color: "#60a5fa",
    isCustom: false,
    position: { x: 374, y: 224 },
  },
];

export type ClockStoreSnapshot = {
  clocks: ClockDefinition[];
  error: string;
};

const serverSnapshot: ClockStoreSnapshot = {
  clocks: DEFAULT_CLOCKS,
  error: "",
};
let clientSnapshot = serverSnapshot;
let hasLoaded = false;
const clockListeners = new Set<() => void>();

const isClockDefinition = (value: unknown): value is ClockDefinition => {
  if (typeof value !== "object" || value === null) return false;

  const clock = value as Record<string, unknown>;
  const position = clock.position;

  if (
    typeof clock.id !== "string" ||
    typeof clock.name !== "string" ||
    typeof clock.timeZone !== "string" ||
    typeof clock.color !== "string" ||
    !/^#[\da-f]{6}$/i.test(clock.color) ||
    typeof clock.isCustom !== "boolean" ||
    typeof position !== "object" ||
    position === null
  ) {
    return false;
  }

  const coordinates = position as Record<string, unknown>;
  if (
    typeof coordinates.x !== "number" ||
    !Number.isFinite(coordinates.x) ||
    coordinates.x < 0 ||
    typeof coordinates.y !== "number" ||
    !Number.isFinite(coordinates.y) ||
    coordinates.y < 0
  ) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: clock.timeZone });
    return true;
  } catch {
    return false;
  }
};

export const parseStoredClocks = (value: string): ClockDefinition[] => {
  const parsed: unknown = JSON.parse(value);

  if (!Array.isArray(parsed) || !parsed.every(isClockDefinition)) {
    throw new Error("Saved clocks have an invalid format.");
  }

  return parsed;
};

const loadClientSnapshot = () => {
  if (hasLoaded || typeof window === "undefined") return clientSnapshot;

  hasLoaded = true;
  try {
    const savedClocks = window.localStorage.getItem(CLOCK_STORAGE_KEY);
    if (savedClocks !== null) {
      clientSnapshot = { clocks: parseStoredClocks(savedClocks), error: "" };
    } else {
      const width = window.innerWidth - 64;
      const columns = Math.max(1, Math.min(3, Math.floor((width + 24) / 374)));
      clientSnapshot = {
        clocks: DEFAULT_CLOCKS.map((clock, index) => ({
          ...clock,
          position: {
            x: (index % columns) * 374,
            y: Math.floor(index / columns) * 224,
          },
        })),
        error: "",
      };
    }
  } catch (error) {
    console.error("Unable to load saved world clocks.", error);
    clientSnapshot = {
      clocks: DEFAULT_CLOCKS,
      error: "Your saved clocks could not be loaded. Changes may not persist.",
    };
  }

  return clientSnapshot;
};

export const getClockSnapshot = () =>
  typeof window === "undefined" ? serverSnapshot : loadClientSnapshot();

export const getServerClockSnapshot = () => serverSnapshot;

export const subscribeToClocks = (listener: () => void) => {
  clockListeners.add(listener);
  loadClientSnapshot();
  return () => {
    clockListeners.delete(listener);
  };
};

const notifyClockListeners = () => {
  clockListeners.forEach((listener) => listener());
};

const persistClockSnapshot = (clocks: ClockDefinition[]) => {
  try {
    window.localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(clocks));
    clientSnapshot = { clocks, error: "" };
  } catch (error) {
    console.error("Unable to save world clocks.", error);
    clientSnapshot = {
      clocks,
      error: "Your clocks could not be saved in this browser.",
    };
  }
};

export const updateClocks = (
  update: (clocks: ClockDefinition[]) => ClockDefinition[],
  persist = true,
) => {
  const current = loadClientSnapshot();
  const clocks = update(current.clocks);
  clientSnapshot = { ...current, clocks };
  if (persist && typeof window !== "undefined") {
    persistClockSnapshot(clocks);
  }
  notifyClockListeners();
};

export const saveClocks = () => {
  const { clocks } = loadClientSnapshot();
  if (typeof window !== "undefined") {
    persistClockSnapshot(clocks);
    notifyClockListeners();
  }
};

export const formatClockTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

export const formatClockDate = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
