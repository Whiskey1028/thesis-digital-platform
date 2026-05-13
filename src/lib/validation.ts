import { z } from "zod";

const orderStatusSchema = z.enum([
  "lead",
  "quoted",
  "in_progress",
  "review",
  "delivered",
  "after_sales"
]);

const paymentStatusSchema = z.enum(["pending", "partial", "paid"]);
const urgencySchema = z.enum(["low", "medium", "high"]);
const riskLevelSchema = z.enum(["low", "medium", "high"]);
const availabilitySchema = z.enum(["available", "busy", "offline"]);
const sourceTypeSchema = z.enum(["self_owned", "outsourced"]);
const educationLevelSchema = z.enum(["本科", "硕士", "博士", "大专", "期刊论文", "已工作", "其他"]);

export const clientSchema = z.object({
  name: z.string().min(1),
  contactHandle: z.string().min(1),
  sourceChannel: z.string().min(1),
  schoolType: z.string().min(1),
  school: z.string().min(1),
  educationLevel: educationLevelSchema,
  major: z.string().min(1),
  riskLevel: riskLevelSchema,
  preferredTitle: z.string().optional(),
  preferredServiceType: z.string().optional(),
  preferredDeadline: z.string().optional(),
  preferredBudget: z.number().nonnegative().optional(),
  notes: z.string().optional()
});

export const writerSchema = z.object({
  name: z.string().min(1),
  specialties: z.array(z.string().min(1)).min(1),
  availability: availabilitySchema,
  capacity: z.number().int().positive(),
  activeOrderCount: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  completionRate: z.number().min(0).max(1),
  averageTurnaroundDays: z.number().positive(),
  priceTier: z.enum(["standard", "advanced", "premium"]),
  ownerName: z.string().min(1),
  settlementMode: z.string().min(1),
  notes: z.string().optional()
});

export const createOrderFromClientSchema = z.object({
  sourceType: sourceTypeSchema,
  title: z.string().min(1),
  serviceType: z.string().min(1),
  packageMode: z.string().min(1),
  writerId: z.string().nullable(),
  ownerName: z.string().min(1),
  deadline: z.string().min(1),
  writerDeadline: z.string().optional().or(z.literal("")),
  completedAt: z.string().optional().or(z.literal("")),
  transactionDate: z.string().min(1),
  amount: z.number().nonnegative(),
  settledAmount: z.number().nonnegative(),
  receivableAmount: z.number().nonnegative(),
  costAmount: z.number().nonnegative(),
  profitAmount: z.number(),
  paymentStatus: paymentStatusSchema,
  isSettled: z.boolean(),
  urgency: urgencySchema,
  status: orderStatusSchema,
  notes: z.string().optional(),
  remark: z.string().optional()
});

export const updateOrderSchema = createOrderFromClientSchema.partial();
