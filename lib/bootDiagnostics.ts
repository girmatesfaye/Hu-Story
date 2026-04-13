type BootState = {
  stage: string;
  updatedAt: string;
  appReady: boolean | null;
  authLoading: boolean | null;
  hasSession: boolean | null;
  hasSupabaseEnv: boolean | null;
  routePath: string | null;
  routeTarget: string | null;
  errorSource: string | null;
  errorMessage: string | null;
  events: string[];
};

type BootPatch = Partial<Omit<BootState, "events" | "updatedAt">>;

type Listener = (state: BootState) => void;

const listeners = new Set<Listener>();
const MAX_EVENTS = 24;
const diagnosticsEnv = process.env.EXPO_PUBLIC_BOOT_DEBUG;
const diagnosticsEnabled = diagnosticsEnv !== "0";

let state: BootState = {
  stage: "INIT",
  updatedAt: new Date().toISOString(),
  appReady: null,
  authLoading: null,
  hasSession: null,
  hasSupabaseEnv: null,
  routePath: null,
  routeTarget: null,
  errorSource: null,
  errorMessage: null,
  events: [],
};

export function isBootDiagnosticsEnabled() {
  return diagnosticsEnabled;
}

const shouldLog = () => diagnosticsEnabled;

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

function nextEvent(label: string, details?: unknown) {
  const payload =
    details === undefined ? label : `${label} ${JSON.stringify(details)}`;
  return `${new Date().toISOString()} ${payload}`;
}

function updateState(patch: Partial<BootState>) {
  state = {
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  emit();
}

export function getBootDiagnosticsState() {
  return state;
}

export function subscribeBootDiagnostics(listener: Listener) {
  listeners.add(listener);
  listener(state);

  return () => {
    listeners.delete(listener);
  };
}

export function markBootStage(stage: string, details?: unknown) {
  if (!shouldLog()) return;

  console.log("[BOOTDBG]", stage, details ?? "");

  const events = [...state.events, nextEvent(stage, details)].slice(
    -MAX_EVENTS,
  );
  updateState({
    stage,
    events,
  });
}

export function patchBootState(patch: BootPatch, eventLabel?: string) {
  if (!shouldLog()) return;

  const events = eventLabel
    ? [...state.events, nextEvent(eventLabel, patch)].slice(-MAX_EVENTS)
    : state.events;

  updateState({
    ...patch,
    events,
  });
}

export function captureBootError(source: string, error: unknown) {
  if (!shouldLog()) return;

  const errorMessage =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "Unknown error";

  console.error("[BOOTDBG]", source, error);

  const events = [
    ...state.events,
    nextEvent(`ERROR@${source}`, errorMessage),
  ].slice(-MAX_EVENTS);

  updateState({
    stage: "ERROR",
    errorSource: source,
    errorMessage,
    events,
  });
}
