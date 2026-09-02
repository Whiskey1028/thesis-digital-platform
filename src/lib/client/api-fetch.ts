export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: ApiErrorPayload;
  status: number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function readErrorPayload(body: unknown): ApiErrorPayload {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    const error = body.error as ApiErrorPayload;
    return {
      code: error.code ?? "UNKNOWN",
      message: error.message,
      details: error.details
    };
  }

  return { code: "UNKNOWN", message: "Request failed" };
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(url, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: readErrorPayload(body)
    };
  }

  if (typeof body === "object" && body !== null && "data" in body) {
    return { ok: true, data: body.data as T };
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "ok" in body &&
    (body as { ok?: boolean }).ok === true
  ) {
    return { ok: true, data: body as T };
  }

  return { ok: true, data: body as T };
}

export function formatApiError(error: ApiErrorPayload) {
  return error.message;
}
