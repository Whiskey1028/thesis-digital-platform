export type OrderStatus =
  | "lead"
  | "quoted"
  | "in_progress"
  | "review"
  | "delivered"
  | "after_sales";

export type PaymentStatus = "pending" | "partial" | "paid";
export type Urgency = "low" | "medium" | "high";
export type Availability = "available" | "busy" | "offline";
export type RiskLevel = "low" | "medium" | "high";
export type OrderSourceType = "self_owned" | "outsourced";
export type EducationLevel =
  | "本科"
  | "硕士"
  | "博士"
  | "大专"
  | "期刊论文"
  | "已工作"
  | "其他";

export interface Client {
  id: string;
  name: string;
  contactHandle: string;
  sourceChannel: string;
  schoolType: string;
  school: string;
  educationLevel: EducationLevel;
  major: string;
  riskLevel: RiskLevel;
  preferredTitle?: string;
  preferredServiceType?: string;
  preferredDeadline?: string;
  preferredBudget?: number;
  notes?: string;
  lastContactAt: string;
  createdAt: string;
}

export interface Writer {
  id: string;
  name: string;
  specialties: string[];
  availability: Availability;
  capacity: number;
  activeOrderCount: number;
  rating: number;
  completionRate: number;
  averageTurnaroundDays: number;
  priceTier: "standard" | "advanced" | "premium";
  ownerName: string;
  settlementMode: string;
  notes?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName?: string;
  sourceType: OrderSourceType;
  title: string;
  schoolType?: string;
  school?: string;
  educationLevel?: EducationLevel;
  major?: string;
  serviceType: string;
  packageMode: string;
  writerId: string | null;
  ownerName: string;
  status: OrderStatus;
  deadline: string;
  writerDeadline?: string;
  completedAt?: string;
  transactionDate: string;
  amount: number;
  settledAmount: number;
  receivableAmount: number;
  costAmount: number;
  profitAmount: number;
  paymentStatus: PaymentStatus;
  isSettled: boolean;
  urgency: Urgency;
  sourceChannel: string;
  notes?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDraft {
  clientId: string;
  clientName?: string;
  sourceType: OrderSourceType;
  title: string;
  schoolType?: string;
  school?: string;
  educationLevel?: EducationLevel;
  major?: string;
  serviceType: string;
  packageMode: string;
  writerId: string | null;
  ownerName: string;
  deadline: string;
  writerDeadline?: string;
  completedAt?: string;
  transactionDate: string;
  amount: number;
  settledAmount: number;
  receivableAmount: number;
  costAmount: number;
  profitAmount: number;
  paymentStatus: PaymentStatus;
  isSettled: boolean;
  urgency: Urgency;
  status: OrderStatus;
  sourceChannel: string;
  notes?: string;
  remark?: string;
}
