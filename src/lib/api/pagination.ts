import { z } from "zod";

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const paginationBaseSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
  q: z.string().trim().optional()
});

export const clientListQuerySchema = paginationBaseSchema.extend({
  risk: z.enum(["all", "low", "medium", "high"]).optional(),
  sort: z
    .enum(["name_asc", "name_desc", "created_desc", "budget_desc"])
    .optional()
});

export const orderListQuerySchema = paginationBaseSchema.extend({
  status: z
    .enum([
      "all",
      "lead",
      "quoted",
      "in_progress",
      "review",
      "delivered",
      "after_sales"
    ])
    .optional(),
  sourceType: z.enum(["all", "self_owned", "outsourced"]).optional(),
  urgency: z.enum(["all", "low", "medium", "high"]).optional(),
  clientId: z.string().optional(),
  writerId: z.string().optional(),
  sort: z.enum(["deadline_asc", "deadline_desc", "amount_desc", "created_desc"]).optional()
});

export const writerListQuerySchema = paginationBaseSchema.extend({
  availability: z.enum(["all", "available", "busy", "offline"]).optional(),
  sort: z.enum(["name_asc", "rating_desc", "load_desc", "capacity_desc"]).optional()
});

export type ClientListQuery = z.infer<typeof clientListQuerySchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type WriterListQuery = z.infer<typeof writerListQuerySchema>;

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize
  };
}

export function isPaginatedRequest(query: { page?: number; pageSize?: number }) {
  return query.page !== undefined || query.pageSize !== undefined;
}
