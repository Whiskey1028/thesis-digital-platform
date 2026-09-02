"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldRow } from "@/components/ui/field-row";
import { SearchableSingleSelect, SegmentedSelect } from "@/components/ui/form-controls";
import { priceTierOptions, writerAvailabilityOptions } from "@/lib/constants";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";

export function WriterCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [availability, setAvailability] = useState("available");
  const [priceTier, setPriceTier] = useState("standard");
  const [settlementMode, setSettlementMode] = useState("按单结算");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const formData = new FormData(formElement);
        const specialties = String(formData.get("specialties") ?? "")
          .split(/[,\n，]/)
          .map((item) => item.trim())
          .filter(Boolean);

        const payload = {
          name: String(formData.get("name") ?? ""),
          specialties,
          availability: String(formData.get("availability") ?? availability),
          capacity: Number(formData.get("capacity") ?? 1),
          rating: Number(formData.get("rating") ?? 4.5),
          completionRate: Number(formData.get("completionRate") ?? 0.9),
          averageTurnaroundDays: Number(formData.get("averageTurnaroundDays") ?? 5),
          priceTier: String(formData.get("priceTier") ?? priceTier),
          ownerName: String(formData.get("ownerName") ?? ""),
          settlementMode: String(formData.get("settlementMode") ?? ""),
          notes: String(formData.get("notes") ?? "")
        };

        startTransition(() => {
          void (async () => {
            const result = await apiFetch("/api/writers", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (result.ok) {
              setMessage("写手已新增，列表已刷新。");
              formElement.reset();
              setAvailability("available");
              setPriceTier("standard");
              setSettlementMode("按单结算");
              router.refresh();
            } else {
              setMessage(formatApiError(result.error));
            }
          })();
        });
      }}
    >
      <FieldRow label="写手姓名">
        <input name="name" className={inputClassName} />
      </FieldRow>
      <FieldRow label="负责人 / 对接人">
        <input name="ownerName" className={inputClassName} />
      </FieldRow>
      <FieldRow label="擅长专业" hint="逗号分隔">
        <textarea name="specialties" className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm" />
      </FieldRow>
      <FieldRow label="结算方式">
        <input
          name="settlementMode"
          value={settlementMode}
          onChange={(event) => setSettlementMode(event.target.value)}
          className={inputClassName}
        />
      </FieldRow>
      <FieldRow label="可用状态">
        <SegmentedSelect
          name="availability"
          value={availability}
          onChange={(value) => setAvailability(value)}
          options={writerAvailabilityOptions.map((item) => ({ value: item, label: item }))}
        />
      </FieldRow>
      <FieldRow label="报价层级">
        <SearchableSingleSelect
          name="priceTier"
          value={priceTier}
          onChange={(value) => setPriceTier(value)}
          placeholder="选择报价层级"
          options={[...priceTierOptions]}
        />
      </FieldRow>
      <FieldRow label="容量上限">
        <input name="capacity" type="number" className={inputClassName} />
      </FieldRow>
      <FieldRow label="评分">
        <input name="rating" type="number" step="0.1" className={inputClassName} />
      </FieldRow>
      <FieldRow label="完成率 0-1">
        <input name="completionRate" type="number" step="0.01" className={inputClassName} />
      </FieldRow>
      <FieldRow label="平均交付天数">
        <input name="averageTurnaroundDays" type="number" step="0.1" className={inputClassName} />
      </FieldRow>
      <FieldRow label="写手备注">
        <textarea name="notes" className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm" />
      </FieldRow>
      <div className="flex items-center justify-between rounded-[22px] bg-slate-950 px-5 py-4 text-white">
        <div>
          <p className="text-sm text-slate-300">写手独立管理</p>
          <p className="mt-1 text-sm">新增后即可在客户生成工单时直接分配。</p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
        >
          {isPending ? "创建中..." : "新增写手"}
        </button>
      </div>
      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </form>
  );
}
