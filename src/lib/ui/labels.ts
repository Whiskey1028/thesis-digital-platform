export const riskLevelLabels: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

export const urgencyLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高"
};

export const availabilityLabels: Record<string, string> = {
  available: "空闲",
  busy: "忙碌",
  offline: "离线"
};

export const orderStatusLabels: Record<string, string> = {
  lead: "线索",
  quoted: "已报价",
  in_progress: "撰写中",
  review: "审改中",
  delivered: "已交付",
  after_sales: "售后"
};

export const sourceTypeLabels: Record<string, string> = {
  self_owned: "自接",
  outsourced: "转包"
};

export const settledStateLabels: Record<string, string> = {
  settled: "已结清",
  unsettled: "未结清"
};

export function labelOf(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}
