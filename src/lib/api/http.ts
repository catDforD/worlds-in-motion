const DEFAULT_WORLD_STATE_API_BASE_URL = "http://localhost:8000/api";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getWorldStateApiBaseUrl() {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_WORLD_STATE_API_BASE_URL ??
      process.env.WORLD_STATE_API_BASE_URL ??
      DEFAULT_WORLD_STATE_API_BASE_URL,
  );
}

function buildRequestUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getWorldStateApiBaseUrl()}${normalizedPath}`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string } | string | null;
    if (typeof payload === "string") {
      return payload;
    }
    if (payload && typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    // Ignore parse failures and fall back to status text.
  }

  return response.statusText || `Request failed (${response.status})`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildRequestUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

