"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OverviewPanels } from "@/components/dashboard/overview-panels";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  getBooleanParam,
  getEnumParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import type { OverviewFilterOptions, OverviewMetrics } from "@/lib/queries/overview";

const sourceTypeOptions = ["all", "self_owned", "outsourced"] as const;
const settledStateOptions = ["all", "settled", "unsettled"] as const;
const riskLevelOptions = ["all", "low", "medium", "high"] as const;

export function OverviewFilterPanel({
  metrics,
  options
}: {
  metrics: OverviewMetrics;
  options: OverviewFilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(() =>
    getBooleanParam(searchParams, "overviewFiltersOpen", true)
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
        overviewFiltersOpen: filterOpen ? null : "0"
      }
    });
  }, [filterOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    replaceUrlParams({ pathname, router, updates });
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

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="统计筛选"
        open={filterOpen}
        onToggle={setFilterOpen}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={sourceType}
              onChange={(event) =>
                updateParams({
                  overviewSourceType: event.target.value === "all" ? null : event.target.value
                })
              }
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">全部风险等级</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select
              value={educationLevel}
              onChange={(event) =>
                updateParams({
                  overviewEducationLevel: event.target.value === "all" ? null : event.target.value
                })
              }
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
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
                onChange={(event) =>
                  updateParams({ overviewDateFrom: event.target.value || null })
                }
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => updateParams({ overviewDateTo: event.target.value || null })}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span>
              当前口径下客户 {metrics.filteredClientCount} 个，工单 {metrics.filteredOrderCount} 条。
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

      <OverviewPanels metrics={metrics} />
    </div>
  );
}
