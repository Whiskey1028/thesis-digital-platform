import "server-only";

import { z, type ZodType } from "zod";
import { ApiError } from "@/lib/api/errors";

const routeIdParamsSchema = z.object({
  id: z.string().min(1)
});

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body: unknown = await request.json().catch(() => null);

  if (body === null) {
    throw ApiError.validation({ formErrors: ["Invalid JSON body"] });
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw ApiError.validation(parsed.error.flatten());
  }

  return parsed.data;
}

export async function parseRouteParams(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const parsed = routeIdParamsSchema.safeParse(params);

  if (!parsed.success) {
    throw ApiError.validation(parsed.error.flatten());
  }

  return parsed.data;
}

export function parseSearchParams<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw ApiError.validation(parsed.error.flatten());
  }

  return parsed.data;
}
