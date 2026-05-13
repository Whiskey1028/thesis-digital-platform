import type { EducationLevel, RiskLevel } from "@/lib/types";

export const educationLevels: EducationLevel[] = [
  "本科",
  "硕士",
  "博士",
  "大专",
  "期刊论文",
  "已工作",
  "其他"
];

export const riskLevels: RiskLevel[] = ["low", "medium", "high"];

export const schoolTypeOptions = [
  "985",
  "211",
  "双非",
  "普本",
  "专科",
  "高中/中专/技校",
  "社会",
  "企业",
  "海外院校",
  "其他"
];

export const serviceTypeOptions = [
  "论文全文",
  "论文咨询",
  "论文修改",
  "统计分析",
  "辅导费",
  "通道费",
  "开题报告",
  "翻译",
  "ppt制作"
];

export const priceTierOptions = ["standard", "advanced", "premium"] as const;

export const writerAvailabilityOptions = ["available", "busy", "offline"] as const;
