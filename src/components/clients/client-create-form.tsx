"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldRow } from "@/components/ui/field-row";
import { SearchableSingleSelect, SegmentedSelect } from "@/components/ui/form-controls";
import {
  educationLevels,
  riskLevels,
  schoolTypeOptions,
  serviceTypeOptions
} from "@/lib/constants";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";

export function ClientCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [educationLevel, setEducationLevel] = useState("本科");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [schoolType, setSchoolType] = useState("双非");
  const [preferredServiceType, setPreferredServiceType] = useState("论文全文");
  const [preferredDeadline, setPreferredDeadline] = useState("");
  const [sourceChannel, setSourceChannel] = useState("自然咨询");

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setPreferredDeadline(nextWeek.toISOString().slice(0, 10));
  }, []);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const formData = new FormData(formElement);
        const payload = {
          name: String(formData.get("name") ?? ""),
          contactHandle: String(formData.get("contactHandle") ?? ""),
          sourceChannel: String(formData.get("sourceChannel") ?? ""),
          schoolType: String(formData.get("schoolType") ?? ""),
          school: String(formData.get("school") ?? ""),
          educationLevel: String(formData.get("educationLevel") ?? educationLevel),
          major: String(formData.get("major") ?? ""),
          riskLevel: String(formData.get("riskLevel") ?? riskLevel),
          preferredTitle: String(formData.get("preferredTitle") ?? ""),
          preferredServiceType: String(formData.get("preferredServiceType") ?? ""),
          preferredDeadline: String(formData.get("preferredDeadline") ?? ""),
          preferredBudget: Number(formData.get("preferredBudget") ?? 0),
          notes: String(formData.get("notes") ?? "")
        };

        startTransition(() => {
          void (async () => {
            const result = await apiFetch("/api/clients", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (result.ok) {
              setMessage("客户已创建，列表已刷新。");
              formElement.reset();
              setEducationLevel("本科");
              setRiskLevel("medium");
              setSchoolType("双非");
              setPreferredServiceType("论文全文");
              setSourceChannel("自然咨询");
              router.refresh();
            } else {
              setMessage(formatApiError(result.error));
            }
          })();
        });
      }}
    >
      <FieldRow label="客户姓名">
        <input name="name" className={inputClassName} />
      </FieldRow>
      <FieldRow label="联系方式" hint="微信 / Telegram / 其他">
        <input name="contactHandle" className={inputClassName} />
      </FieldRow>
      <FieldRow label="来源渠道">
        <input
          name="sourceChannel"
          value={sourceChannel}
          onChange={(event) => setSourceChannel(event.target.value)}
          className={inputClassName}
        />
      </FieldRow>
      <FieldRow label="学校类型" hint="如 211 / 双非">
        <SearchableSingleSelect
          name="schoolType"
          value={schoolType}
          onChange={setSchoolType}
          placeholder="选择学校类型"
          options={schoolTypeOptions}
        />
      </FieldRow>
      <FieldRow label="学校名称">
        <input name="school" className={inputClassName} />
      </FieldRow>
      <FieldRow label="学历">
        <SearchableSingleSelect
          name="educationLevel"
          value={educationLevel}
          onChange={(value) => setEducationLevel(value)}
          placeholder="选择学历"
          options={educationLevels}
        />
      </FieldRow>
      <FieldRow label="专业">
        <input name="major" className={inputClassName} />
      </FieldRow>
      <FieldRow label="风险等级">
        <SegmentedSelect
          name="riskLevel"
          value={riskLevel}
          onChange={(value) => setRiskLevel(value)}
          options={riskLevels.map((item) => ({ value: item, label: item }))}
        />
      </FieldRow>
      <FieldRow label="预设题目">
        <input name="preferredTitle" className={inputClassName} />
      </FieldRow>
      <FieldRow label="预设服务类型">
        <SearchableSingleSelect
          name="preferredServiceType"
          value={preferredServiceType}
          onChange={setPreferredServiceType}
          placeholder="选择预设服务类型"
          options={serviceTypeOptions}
        />
      </FieldRow>
      <FieldRow label="预设截止日期">
        <input
          name="preferredDeadline"
          type="date"
          value={preferredDeadline}
          onChange={(event) => setPreferredDeadline(event.target.value)}
          className={inputClassName}
        />
      </FieldRow>
      <FieldRow label="预设预算">
        <input name="preferredBudget" type="number" className={inputClassName} />
      </FieldRow>
      <FieldRow label="客户备注">
        <textarea name="notes" className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm" />
      </FieldRow>
      <div className="flex items-center justify-between rounded-[22px] bg-slate-950 px-5 py-4 text-white">
        <div>
          <p className="text-sm text-slate-300">客户先建档</p>
          <p className="mt-1 text-sm">建档后即可从客户卡片直接发起工单。</p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
        >
          {isPending ? "创建中..." : "新增客户"}
        </button>
      </div>
      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </form>
  );
}
