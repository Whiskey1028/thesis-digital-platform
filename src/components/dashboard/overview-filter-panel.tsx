"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Client, Order, Writer } from "@/lib/types";
import { OverviewPanels } from "@/components/dashboard/overview-panels";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  getBooleanParam,
  getEnumParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";

const sourceTypeOptions = ["all", "self_owned", "outsourced"] as const;
const settledStateOptions = ["all", "settled", "unsettled"] as const;
const riskLevelOptions = ["all", "low", "medium", "high"] as const;

export function OverviewFilterPanel({
  orders,
  writers,
  clients
}: {
  orders: Order[];
  writers: Writer[];
  clients: Client[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(() =>
    getBooleanParam(searchParams, "overviewFiltersOpen", true)
  );
  const [sourceType, setSourceType] = useState<"all" | "self_owned" | "outsourced">(() =>
    getEnumParam(searchParams, "overviewSourceType", sourceTypeOptions, "all")
  );
  const [clientSource, setClientSource] = useState(() =>
    getStringParam(searchParams, "overviewClientSource", "all")
  );
  const [riskLevel, setRiskLevel] = useState(() =>
    getEnumParam(searchParams, "overviewRiskLevel", riskLevelOptions, "all")
  );
  const [serviceType, setServiceType] = useState(() =>
    getStringParam(searchParams, "overviewServiceType", "all")
  );
  const [educationLevel, setEducationLevel] = useState(() =>
    getStringParam(searchParams, "overviewEducationLevel", "all")
  );
  const [schoolType, setSchoolType] = useState(() =>
    getStringParam(searchParams, "overviewSchoolType", "all")
  );
  const [settledState, setSettledState] = useState(() =>
    getEnumParam(searchParams, "overviewSettledState", settledStateOptions, "all")
  );
  const [dateFrom, setDateFrom] = useState(() =>
    getStringParam(searchParams, "overviewDateFrom", "")
  );
  const [dateTo, setDateTo] = useState(() =>
    getStringParam(searchParams, "overviewDateTo", "")
  );

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        overviewFiltersOpen: filterOpen ? null : "0",
        overviewSourceType: sourceType === "all" ? null : sourceType,
        overviewClientSource: clientSource === "all" ? null : clientSource,
        overviewRiskLevel: riskLevel === "all" ? null : riskLevel,
        overviewServiceType: serviceType === "all" ? null : serviceType,
        overviewEducationLevel: educationLevel === "all" ? null : educationLevel,
        overviewSchoolType: schoolType === "all" ? null : schoolType,
        overviewSettledState: settledState === "all" ? null : settledState,
        overviewDateFrom: dateFrom || null,
        overviewDateTo: dateTo || null
      }
    });
  }, [
    clientSource,
    dateFrom,
    dateTo,
    educationLevel,
    filterOpen,
    pathname,
    riskLevel,
    router,
    schoolType,
    serviceType,
    settledState,
    sourceType
  ]);

  const clientSourceOptions = useMemo(
    () => ["all", ...Array.from(new Set(clients.map((item) => item.sourceChannel))).sort()],
    [clients]
  );
  const serviceTypeOptions = useMemo(
    () => ["all", ...Array.from(new Set(orders.map((item) => item.serviceType))).sort()],
    [orders]
  );
  const educationLevelOptions = useMemo(
    () => ["all", ...Array.from(new Set(clients.map((item) => item.educationLevel))).sort()],
    [clients]
  );
  const schoolTypeOptions = useMemo(
    () => ["all", ...Array.from(new Set(clients.map((item) => item.schoolType))).sort()],
    [clients]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSource = clientSource === "all" || client.sourceChannel === clientSource;
      const matchesRisk = riskLevel === "all" || client.riskLevel === riskLevel;
      const matchesEducation = educationLevel === "all" || client.educationLevel === educationLevel;
      const matchesSchoolType = schoolType === "all" || client.schoolType === schoolType;
      return matchesSource && matchesRisk && matchesEducation && matchesSchoolType;
    });
  }, [clients, clientSource, riskLevel, educationLevel, schoolType]);

  const filteredClientIds = useMemo(
    () => new Set(filteredClients.map((item) => item.id)),
    [filteredClients]
  );
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesType = sourceType === "all" || order.sourceType === sourceType;
      const matchesService = serviceType === "all" || order.serviceType === serviceType;
      const matchesClient = filteredClientIds.has(order.clientId);
      const matchesSettled =
        settledState === "all" ||
        (settledState === "settled" && order.isSettled) ||
        (settledState === "unsettled" && !order.isSettled);
      const matchesDateFrom = !dateFrom || order.transactionDate >= dateFrom;
      const matchesDateTo = !dateTo || order.transactionDate <= dateTo;
      return matchesType && matchesService && matchesClient && matchesSettled && matchesDateFrom && matchesDateTo;
    });
  }, [orders, sourceType, serviceType, filteredClientIds, settledState, dateFrom, dateTo]);

  function resetFilters() {
    setSourceType("all");
    setClientSource("all");
    setRiskLevel("all");
    setServiceType("all");
    setEducationLevel("all");
    setSchoolType("all");
    setSettledState("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="统计筛选"
        description="通过工单与客户字段共同控制总览统计口径。"
        open={filterOpen}
        onToggle={setFilterOpen}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as "all" | "self_owned" | "outsourced")}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">全部工单类型</option>
              <option value="self_owned">仅自接</option>
              <option value="outsourced">仅转包</option>
            </select>
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {serviceTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部服务类型" : option}
                </option>
              ))}
            </select>
            <select
              value={settledState}
              onChange={(event) => setSettledState(event.target.value as "all" | "settled" | "unsettled")}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">全部结清状态</option>
              <option value="settled">仅已结清</option>
              <option value="unsettled">仅未结清</option>
            </select>
            <select
              value={clientSource}
              onChange={(event) => setClientSource(event.target.value)}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {clientSourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部客户来源" : option}
                </option>
              ))}
            </select>
            <select
              value={riskLevel}
              onChange={(event) => setRiskLevel(event.target.value as "all" | "low" | "medium" | "high")}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">全部风险等级</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select
              value={educationLevel}
              onChange={(event) => setEducationLevel(event.target.value)}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {educationLevelOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部学历" : option}
                </option>
              ))}
            </select>
            <select
              value={schoolType}
              onChange={(event) => setSchoolType(event.target.value)}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {schoolTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部学校类型" : option}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span>
              当前口径下客户 {filteredClients.length} 个，工单 {filteredOrders.length} 条。
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              重置筛选
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <OverviewPanels orders={filteredOrders} writers={writers} clients={filteredClients} />
    </div>
  );
}
