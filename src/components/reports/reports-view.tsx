"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  FilterBarShell,
  FilterChipRow,
  ResetFilterButton,
  filterControlClass,
  type FilterChip
} from "@/components/ui/filter-bar";
import {
  getBooleanParam,
  getEnumParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import type { OverviewFilterOptions } from "@/lib/queries/overview";
import type { ReportsPayload } from "@/lib/queries/reports";
import {
  countActiveFilters,
  isEnumFilterActive,
  isTextFilterActive
} from "@/lib/ui/filter-state";
import {
  labelOf,
  riskLevelLabels,
  settledStateLabels,
  sourceTypeLabels
} from "@/lib/ui/labels";

const sourceTypeOptions = ["all", "self_owned", "outsourced"] as const;
const settledStateOptions = ["all", "settled", "unsettled"] as const;
const riskLevelOptions = ["all", "low", "medium", "high"] as const;

export function ReportsView({
  data,
  options
}: {
  data: ReportsPayload;
  options: OverviewFilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filterOpen, setFilterOpen] = useState(() =>
    getBooleanParam(searchParams, "reportFiltersOpen", true)
  );

  const sourceType = getEnumParam(searchParams, "overviewSourceType", sourceTypeOptions, "all");
  const clientSource = getStringParam(searchParams, "overviewClientSource", "all");
  const riskLevel = getEnumParam(searchParams, "overviewRiskLevel", riskLevelOptions, "all");
  const serviceType = getStringParam(searchParams, "overviewServiceType", "all");
  const educationLevel = getStringParam(searchParams, "overviewEducationLevel", "all");
  const schoolType = getStringParam(searchParams, "overviewSchoolType", "all");
  const settledState = getEnumParam(searchParams, "overviewSettledState", settledStateOptions, "all");
  const dateFrom = getStringParam(searchParams, "overviewDateFrom", "");
  const dateTo = getStringParam(searchParams, "overviewDateTo", "");

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        reportFiltersOpen: filterOpen ? null : "0"
      }
    });
  }, [filterOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    startTransition(() => {
      replaceUrlParams({ pathname, router, updates });
    });
  }

  function resetFilters() {
    updateParams({
      overviewSourceType: null,
      overviewClientSource: null,
      overviewRiskLevel: null,
      overviewServiceType: null,
      overviewEducationLevel: null,
      overviewSchoolType: null,
      overviewSettledState: null,
      overviewDateFrom: null,
      overviewDateTo: null
    });
  }

  const flags = [
    isEnumFilterActive(sourceType),
    isEnumFilterActive(serviceType),
    isEnumFilterActive(settledState),
    isEnumFilterActive(clientSource),
    isEnumFilterActive(riskLevel),
    isEnumFilterActive(educationLevel),
    isEnumFilterActive(schoolType),
    isTextFilterActive(dateFrom),
    isTextFilterActive(dateTo)
  ];
  const activeFilterCount = countActiveFilters(flags);
  const hasActiveFilters = activeFilterCount > 0;

  const chips: FilterChip[] = [];
  if (flags[0]) {
    chips.push({
      key: "source",
      label: labelOf(sourceTypeLabels, sourceType),
      onClear: () => updateParams({ overviewSourceType: null })
    });
  }
  if (flags[1]) {
    chips.push({
      key: "service",
      label: `服务：${serviceType}`,
      onClear: () => updateParams({ overviewServiceType: null })
    });
  }
  if (flags[2]) {
    chips.push({
      key: "settled",
      label: labelOf(settledStateLabels, settledState),
      onClear: () => updateParams({ overviewSettledState: null })
    });
  }
  if (flags[3]) {
    chips.push({
      key: "clientSource",
      label: `来源：${clientSource}`,
      onClear: () => updateParams({ overviewClientSource: null })
    });
  }
  if (flags[4]) {
    chips.push({
      key: "risk",
      label: labelOf(riskLevelLabels, riskLevel),
      onClear: () => updateParams({ overviewRiskLevel: null })
    });
  }
  if (flags[5]) {
    chips.push({
      key: "education",
      label: `学历：${educationLevel}`,
      onClear: () => updateParams({ overviewEducationLevel: null })
    });
  }
  if (flags[6]) {
    chips.push({
      key: "school",
      label: `学校类型：${schoolType}`,
      onClear: () => updateParams({ overviewSchoolType: null })
    });
  }
  if (flags[7]) {
    chips.push({
      key: "from",
      label: `起：${dateFrom}`,
      onClear: () => updateParams({ overviewDateFrom: null })
    });
  }
  if (flags[8]) {
    chips.push({
      key: "to",
      label: `止：${dateTo}`,
      onClear: () => updateParams({ overviewDateTo: null })
    });
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="报表筛选"
        open={filterOpen}
        onToggle={setFilterOpen}
        activeFilterCount={activeFilterCount}
      >
        <FilterBarShell active={hasActiveFilters}>
          <select
            value={sourceType}
            onChange={(event) =>
              updateParams({
                overviewSourceType: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[0])}
          >
            <option value="all">全部工单类型</option>
            <option value="self_owned">仅自接</option>
            <option value="outsourced">仅转包</option>
          </select>
          <select
            value={serviceType}
            onChange={(event) =>
              updateParams({
                overviewServiceType: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[1])}
          >
            <option value="all">全部服务类型</option>
            {options.serviceTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={settledState}
            onChange={(event) =>
              updateParams({
                overviewSettledState: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[2])}
          >
            <option value="all">全部结清状态</option>
            <option value="settled">仅已结清</option>
            <option value="unsettled">仅未结清</option>
          </select>
          <select
            value={clientSource}
            onChange={(event) =>
              updateParams({
                overviewClientSource: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[3])}
          >
            <option value="all">全部客户来源</option>
            {options.clientSources.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={riskLevel}
            onChange={(event) =>
              updateParams({
                overviewRiskLevel: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[4])}
          >
            <option value="all">全部风险等级</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
          </select>
          <select
            value={educationLevel}
            onChange={(event) =>
              updateParams({
                overviewEducationLevel: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[5])}
          >
            <option value="all">全部学历</option>
            {options.educationLevels.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={schoolType}
            onChange={(event) =>
              updateParams({
                overviewSchoolType: event.target.value === "all" ? null : event.target.value
              })
            }
            className={filterControlClass(flags[6])}
          >
            <option value="all">全部学校类型</option>
            {options.schoolTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => updateParams({ overviewDateFrom: event.target.value || null })}
              className={filterControlClass(flags[7])}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => updateParams({ overviewDateTo: event.target.value || null })}
              className={filterControlClass(flags[8])}
            />
          </div>
        </FilterBarShell>
        <FilterChipRow chips={chips} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span>
            客户画像口径 {data.clientPersona.conversion.withOrders + data.clientPersona.conversion.withoutOrders}{" "}
            人 · 工单 {data.kpis.orderCount} 条
            {isPending ? " · 更新中" : ""}
          </span>
          <ResetFilterButton disabled={!hasActiveFilters} onClick={resetFilters} />
        </div>
      </CollapsibleSection>

      <div className={isPending ? "opacity-55 transition-opacity" : "transition-opacity"}>
        <ReportsDashboard data={data} />
      </div>
    </div>
  );
}
