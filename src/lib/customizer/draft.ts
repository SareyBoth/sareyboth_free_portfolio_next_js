import type { PortfolioConfig } from "@/types/portfolio";
import {
  SUPPORTED_SCHEMA_VERSION,
  validatePortfolioConfig,
  type ValidationIssue,
} from "@/lib/content/schema";

export const CUSTOMIZER_DRAFT_STORAGE_KEY = "openfolio:customizer-draft:v1";
export const MAX_IMPORT_FILE_BYTES = 1024 * 1024; // 1 MB

interface StoredDraftEnvelope {
  envelopeVersion: typeof SUPPORTED_SCHEMA_VERSION;
  savedAt: string;
  config: PortfolioConfig;
}

export type DraftLoadOutcome =
  | { status: "empty" }
  | { status: "loaded"; config: PortfolioConfig }
  | { status: "recovered"; reason: string };

export function loadDraftFromStorage(): DraftLoadOutcome {
  if (typeof window === "undefined") {
    return { status: "empty" };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CUSTOMIZER_DRAFT_STORAGE_KEY);
  } catch {
    return {
      status: "recovered",
      reason:
        "Browser local storage is unavailable. Changes will work for this session and can still be exported as JSON.",
    };
  }

  if (!raw) {
    return { status: "empty" };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const candidate =
      parsed &&
      typeof parsed === "object" &&
      "config" in parsed &&
      "envelopeVersion" in parsed
        ? (parsed as StoredDraftEnvelope).config
        : parsed;

    const validation = validatePortfolioConfig(candidate);
    if (!validation.success) {
      try {
        window.localStorage.removeItem(CUSTOMIZER_DRAFT_STORAGE_KEY);
      } catch {
        // ignore storage cleanup errors
      }
      return {
        status: "recovered",
        reason:
          "A previous local draft was outdated or invalid and has been reset to the committed configuration.",
      };
    }

    return { status: "loaded", config: validation.data };
  } catch {
    try {
      window.localStorage.removeItem(CUSTOMIZER_DRAFT_STORAGE_KEY);
    } catch {
      // ignore storage cleanup errors
    }
    return {
      status: "recovered",
      reason:
        "A corrupted local draft was detected in browser storage and reset to the committed configuration.",
    };
  }
}

export function saveDraftToStorage(config: PortfolioConfig): {
  saved: boolean;
  error?: string;
} {
  if (typeof window === "undefined") {
    return { saved: false };
  }

  const validation = validatePortfolioConfig(config);
  if (!validation.success) {
    return {
      saved: false,
      error: "Draft contains validation issues and was not persisted yet.",
    };
  }

  const envelope: StoredDraftEnvelope = {
    envelopeVersion: SUPPORTED_SCHEMA_VERSION,
    savedAt: "local-draft",
    config: validation.data,
  };

  try {
    window.localStorage.setItem(
      CUSTOMIZER_DRAFT_STORAGE_KEY,
      JSON.stringify(envelope)
    );
    return { saved: true };
  } catch {
    return {
      saved: false,
      error:
        "Could not save draft to browser storage (storage may be full or disabled). You can still export your JSON file.",
    };
  }
}

export function clearDraftFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CUSTOMIZER_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export type ImportJsonOutcome =
  | { success: true; config: PortfolioConfig }
  | { success: false; errorSummary: string; issues: ValidationIssue[] };

export function parseAndValidateImportedJson(
  rawJsonText: string,
  byteLength = new TextEncoder().encode(rawJsonText).length
): ImportJsonOutcome {
  if (byteLength > MAX_IMPORT_FILE_BYTES) {
    return {
      success: false,
      errorSummary: `File exceeds the maximum allowed size of 1 MB (${Math.round(
        byteLength / 1024
      )} KB provided).`,
      issues: [
        {
          path: "(file)",
          message: "Imported JSON file must be 1 MB or smaller.",
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch (err) {
    return {
      success: false,
      errorSummary: "The selected file is not valid JSON syntax.",
      issues: [
        {
          path: "(json)",
          message:
            err instanceof Error ? err.message : "Unable to parse JSON syntax.",
        },
      ],
    };
  }

  const validation = validatePortfolioConfig(parsed);
  if (!validation.success) {
    return {
      success: false,
      errorSummary: `Configuration validation failed with ${validation.issues.length} issue(s). Your current draft was preserved.`,
      issues: validation.issues,
    };
  }

  return {
    success: true,
    config: validation.data,
  };
}

export function serializePortfolioConfig(config: PortfolioConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export async function readFileAsText(file: Blob): Promise<string> {
  if (typeof file.text === "function") {
    return await file.text();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () =>
        reject(reader.error ?? new Error("Failed to read file."));
      reader.readAsText(file);
      return;
    }
    reject(new Error("File reading is not supported in this environment."));
  });
}

let cachedStorageRaw: string | null | undefined = undefined;
let cachedStorageOutcome: DraftLoadOutcome = { status: "empty" };
const SERVER_DRAFT_OUTCOME: DraftLoadOutcome = { status: "empty" };

export function invalidateDraftStorageCache(): void {
  cachedStorageRaw = undefined;
}

export function subscribeDraftStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === CUSTOMIZER_DRAFT_STORAGE_KEY
    ) {
      cachedStorageRaw = undefined;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function getDraftStorageSnapshot(): DraftLoadOutcome {
  if (typeof window === "undefined") {
    return SERVER_DRAFT_OUTCOME;
  }
  let currentRaw: string | null = null;
  try {
    currentRaw = window.localStorage.getItem(CUSTOMIZER_DRAFT_STORAGE_KEY);
  } catch {
    currentRaw = "__ERROR__";
  }

  if (currentRaw === cachedStorageRaw) {
    return cachedStorageOutcome;
  }

  cachedStorageRaw = currentRaw;
  cachedStorageOutcome = loadDraftFromStorage();
  return cachedStorageOutcome;
}

export function getDraftStorageServerSnapshot(): DraftLoadOutcome {
  return SERVER_DRAFT_OUTCOME;
}
