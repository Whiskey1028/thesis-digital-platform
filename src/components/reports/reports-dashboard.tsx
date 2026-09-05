"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import type { ReportsPayload } from "@/lib/queries/reports";
import {
  labelOf,
  orderStatusLabels,
  riskLevelLabels,
  sourceTypeLabels,
  urgencyLabels
} from "@/lib/ui/labels";

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#1e293b", "#475569", "#78716c"];

function ChartCard({
  title,
  children,
  className = ""
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 h-64 w-full">{children}</div>
    </GlassCard>
  );
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">暂无数据</div>;
}

function money(value: number) {
  return `¥${Math.round(value).toLocaleString()}`;
}

function mapStatus(key: string) {
  return labelOf(orderStatusLabels, key);
}

function mapRisk(key: string) {
  return labelOf(riskLevelLabels, key);
}

function mapSource(key: string) {
  return labelOf(sourceTypeLabels, key);
}

function mapUrgency(key: string) {
  return labelOf(urgencyLabels, key);
}

function mapPayment(key: string) {
  if (key === "pending") return "待付";
  if (key === "partial") return "部分回款";
  if (key === "paid") return "已付清";
  return key;
}

export function ReportsDashboard({ data }: { data: ReportsPayload }) {
  const { kpis, clientPersona, orderPersona, monthlyTrend } = data;

  const conversionData = [
    { label: "有工单", count: clientPersona.conversion.withOrders },
    { label: "无工单", count: clientPersona.conversion.withoutOrders }
  ];

  const sourceCompare = orderPersona.bySource.map((row) => ({
    label: mapSource(row.key),
    count: row.count,
    amount: row.amount,
    profit: row.profit
  }));

  const statusData = orderPersona.byStatus.map((row) => ({
    ...row,
    label: mapStatus(row.key)
  }));

  const riskData = clientPersona.byRisk.map((row) => ({
    ...row,
    label: mapRisk(row.key)
  }));

  const urgencyData = orderPersona.byUrgency.map((row) => ({
    ...row,
    label: mapUrgency(row.key)
  }));

  const paymentData = orderPersona.byPaymentStatus.map((row) => ({
    ...row,
    label: mapPayment(row.key)
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="工单数" value={kpis.orderCount} detail="当前筛选口径" />
        <KpiCard label="关联客户" value={kpis.clientCount} detail="有匹配工单的客户数" />
        <KpiCard label="总收入" value={money(kpis.revenue)} detail="amount 合计" />
        <KpiCard label="利润估算" value={money(kpis.profit)} detail="profit 合计" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">客户画像</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="获客渠道">
            {clientPersona.bySource.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={clientPersona.bySource}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {clientPersona.bySource.map((entry, index) => (
                      <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="风险等级">
            {riskData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="学历分布">
            {clientPersona.byEducation.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={clientPersona.byEducation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#334155" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="学校类型">
            {clientPersona.bySchoolType.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={clientPersona.bySchoolType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#475569" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="专业 Top10">
            {clientPersona.topMajors.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={clientPersona.topMajors} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#0f172a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="学校 Top10">
            {clientPersona.topSchools.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={clientPersona.topSchools} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#334155" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="预算意向分桶">
            {clientPersona.budgetBuckets.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={clientPersona.budgetBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="客户数" fill="#64748b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="客户转化（有/无工单）">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={conversionData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={80}
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">订单画像</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="自接 / 转包（单量·收入·利润）">
            {sourceCompare.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={sourceCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => (name === "count" ? value : money(value))} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="单量" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="amount" name="收入" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="profit" name="利润" fill="#334155" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="服务类型（收入）">
            {orderPersona.byServiceType.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={orderPersona.byServiceType} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => money(value)} />
                  <Bar dataKey="amount" name="收入" fill="#0f172a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="工单状态">
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="单量" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="回款状态">
            {paymentData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentData} dataKey="count" nameKey="label" outerRadius={80}>
                    {paymentData.map((entry, index) => (
                      <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="结清占比">
            {orderPersona.bySettled.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={orderPersona.bySettled} dataKey="count" nameKey="label" innerRadius={48} outerRadius={80}>
                    {orderPersona.bySettled.map((entry, index) => (
                      <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="紧急度">
            {urgencyData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={urgencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="单量" fill="#475569" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="成交额分桶">
            {orderPersona.amountBuckets.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={orderPersona.amountBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="单量" fill="#64748b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="负责人 Top10（收入）">
            {orderPersona.topOwners.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={orderPersona.topOwners} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => money(value)} />
                  <Bar dataKey="amount" name="收入" fill="#0f172a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="工单学校 Top10">
            {orderPersona.topSchools.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart data={orderPersona.topSchools} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="单量" fill="#334155" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="工单学历 / 学校类型">
            {orderPersona.byEducation.length === 0 && orderPersona.bySchoolType.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer>
                <BarChart
                  data={[
                    ...orderPersona.byEducation.map((row) => ({
                      label: `学历·${row.label}`,
                      count: row.count
                    })),
                    ...orderPersona.bySchoolType.map((row) => ({
                      label: `类型·${row.label}`,
                      count: row.count
                    }))
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="单量" fill="#475569" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">经营趋势</h2>
        <ChartCard title="按交易月：收入 / 已回款 / 应收 / 利润" className="xl:col-span-2">
          {monthlyTrend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => money(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="收入" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="settled" name="已回款" stroke="#334155" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="receivable" name="应收" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="利润" stroke="#64748b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>
    </div>
  );
}
