"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { FieldRow } from "@/components/ui/field-row";
import { SearchableSingleSelect, SegmentedSelect } from "@/components/ui/form-controls";
import { serviceTypeOptions } from "@/lib/constants";
import type { Client, OrderDraft, Writer } from "@/lib/types";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";

export function ClientOrderDialog({
  client,
  draft,
  writers
}: {
  client: Client;
  draft: OrderDraft;
  writers: Writer[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sourceType, setSourceType] = useState(draft.sourceType);
  const [serviceType, setServiceType] = useState(draft.serviceType);
  const [packageMode, setPackageMode] = useState(draft.packageMode);
  const [writerId, setWriterId] = useState(draft.writerId ?? "");
  const [ownerName, setOwnerName] = useState(draft.ownerName);
  const [transactionDate, setTransactionDate] = useState(draft.transactionDate);
  const [deadline, setDeadline] = useState(draft.deadline);
  const [writerDeadline, setWriterDeadline] = useState(draft.writerDeadline ?? "");
  const [completedAt, setCompletedAt] = useState(draft.completedAt ?? "");
  const [status, setStatus] = useState(draft.status);
  const [paymentStatus, setPaymentStatus] = useState(draft.paymentStatus);
  const [isSettled, setIsSettled] = useState(draft.isSettled ? "true" : "false");
  const [urgency, setUrgency] = useState(draft.urgency);

  useEffect(() => {
    if (!open) return;
    setSourceType(draft.sourceType);
    setServiceType(draft.serviceType);
    setPackageMode(draft.packageMode);
    setWriterId(draft.writerId ?? "");
    setOwnerName(draft.ownerName);
    setTransactionDate(draft.transactionDate);
    setDeadline(draft.deadline);
    setWriterDeadline(draft.writerDeadline ?? "");
    setCompletedAt(draft.completedAt ?? "");
    setStatus(draft.status);
    setPaymentStatus(draft.paymentStatus);
    setIsSettled(draft.isSettled ? "true" : "false");
    setUrgency(draft.urgency);
  }, [draft, open]);

  useEffect(() => {
    if (sourceType === "self_owned") {
      setWriterId("");
    }
  }, [sourceType]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        一键生成工单
      </button>

      {open ? (
        <ModalShell
          title={`${client.name} 的工单草稿`}
          subtitle="客户信息会在右侧关联展示，重叠字段默认回显，提交前仍可继续调整业务字段。"
          onClose={() => setOpen(false)}
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              const formData = new FormData(formElement);
              const amount = Number(formData.get("amount") ?? 0);
              const settledAmount = Number(formData.get("settledAmount") ?? 0);
              const costAmount = Number(formData.get("costAmount") ?? 0);
              const receivableAmount = Math.max(amount - settledAmount, 0);
              const profitAmount = amount - costAmount;

              const payload = {
                sourceType: String(formData.get("sourceType") ?? "self_owned"),
                title: String(formData.get("title") ?? ""),
                serviceType: String(formData.get("serviceType") ?? ""),
                packageMode: String(formData.get("packageMode") ?? ""),
                writerId: formData.get("writerId") ? String(formData.get("writerId")) : null,
                ownerName: String(formData.get("ownerName") ?? ""),
                deadline: String(formData.get("deadline") ?? ""),
                writerDeadline: String(formData.get("writerDeadline") ?? ""),
                completedAt: String(formData.get("completedAt") ?? ""),
                transactionDate: String(formData.get("transactionDate") ?? ""),
                amount,
                settledAmount,
                receivableAmount,
                costAmount,
                profitAmount,
                paymentStatus: String(formData.get("paymentStatus") ?? "pending"),
                isSettled: String(formData.get("isSettled") ?? "false") === "true",
                urgency: String(formData.get("urgency") ?? "medium"),
                status: String(formData.get("status") ?? "lead"),
                notes: String(formData.get("notes") ?? ""),
                remark: String(formData.get("remark") ?? "")
              };

              startTransition(() => {
                void (async () => {
                  const response = await fetch(`/api/clients/${client.id}/create-order`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                  });

                  if (response.ok) {
                    setMessage("工单已创建，列表已刷新。");
                    router.refresh();
                    setOpen(false);
                  } else {
                    setMessage("创建失败，请检查表单数据后重试。");
                  }
                })();
              });
            }}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
              <div className="space-y-4">
                <FieldRow label="工单类型">
                  <SegmentedSelect
                    name="sourceType"
                    value={sourceType}
                    onChange={(value) => setSourceType(value as "self_owned" | "outsourced")}
                    options={[
                      { value: "self_owned", label: "自接" },
                      { value: "outsourced", label: "转包" }
                    ]}
                  />
                </FieldRow>
                <FieldRow label="论文主题">
                  <input name="title" defaultValue={draft.title || client.preferredTitle || ""} className={inputClassName} />
                </FieldRow>
                <FieldRow label="服务类型">
                  <SearchableSingleSelect
                    name="serviceType"
                    value={serviceType}
                    onChange={(value) => {
                      setServiceType(value);
                      if (!packageMode || packageMode === draft.packageMode) {
                        setPackageMode(value);
                      }
                    }}
                    placeholder="选择服务类型"
                    options={serviceTypeOptions}
                  />
                </FieldRow>
                <FieldRow label="包干方式">
                  <SearchableSingleSelect
                    name="packageMode"
                    value={packageMode}
                    onChange={setPackageMode}
                    placeholder="选择包干方式"
                    options={serviceTypeOptions}
                  />
                </FieldRow>
                <FieldRow label="负责人">
                  <input
                    name="ownerName"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    className={inputClassName}
                  />
                </FieldRow>
                {sourceType === "outsourced" ? (
                  <FieldRow label="关联写手">
                    <select
                      name="writerId"
                      value={writerId}
                      onChange={(event) => setWriterId(event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">暂不分配</option>
                      {writers.map((writer) => (
                        <option key={writer.id} value={writer.id}>
                          {writer.name} / {writer.ownerName}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                ) : (
                  <input type="hidden" name="writerId" value="" />
                )}
                <FieldRow label="交易日期">
                  <input
                    name="transactionDate"
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                    className={inputClassName}
                  />
                </FieldRow>
                <FieldRow label="计划完成日期">
                  <input
                    name="deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className={inputClassName}
                  />
                </FieldRow>
                <FieldRow label="写手完成日期">
                  <input
                    name="writerDeadline"
                    type="date"
                    value={writerDeadline}
                    onChange={(event) => setWriterDeadline(event.target.value)}
                    className={inputClassName}
                  />
                </FieldRow>
                <FieldRow label="实际完成日期">
                  <input
                    name="completedAt"
                    type="date"
                    value={completedAt}
                    onChange={(event) => setCompletedAt(event.target.value)}
                    className={inputClassName}
                  />
                </FieldRow>
                <FieldRow label="总价 / 收入">
                  <input name="amount" type="number" defaultValue={draft.amount || client.preferredBudget || 0} className={inputClassName} />
                </FieldRow>
                <FieldRow label="已结算金额">
                  <input name="settledAmount" type="number" defaultValue={draft.settledAmount} className={inputClassName} />
                </FieldRow>
                <FieldRow label="成本">
                  <input name="costAmount" type="number" defaultValue={draft.costAmount} className={inputClassName} />
                </FieldRow>
                <FieldRow label="工单状态">
                  <SearchableSingleSelect
                    name="status"
                    value={status}
                    onChange={(value) => setStatus(value as typeof status)}
                    placeholder="选择状态"
                    options={["lead", "quoted", "in_progress", "review", "delivered", "after_sales"]}
                  />
                </FieldRow>
                <FieldRow label="付款状态">
                  <SearchableSingleSelect
                    name="paymentStatus"
                    value={paymentStatus}
                    onChange={(value) => setPaymentStatus(value as typeof paymentStatus)}
                    placeholder="选择付款状态"
                    options={["pending", "partial", "paid"]}
                  />
                </FieldRow>
                <FieldRow label="是否结清">
                  <SegmentedSelect
                    name="isSettled"
                    value={isSettled}
                    onChange={(value) => setIsSettled(value as "true" | "false")}
                    options={[
                      { value: "false", label: "未结清" },
                      { value: "true", label: "已结清" }
                    ]}
                  />
                </FieldRow>
                <FieldRow label="紧急度">
                  <SegmentedSelect
                    name="urgency"
                    value={urgency}
                    onChange={(value) => setUrgency(value as typeof urgency)}
                    options={[
                      { value: "low", label: "low" },
                      { value: "medium", label: "medium" },
                      { value: "high", label: "high" }
                    ]}
                  />
                </FieldRow>
                <FieldRow label="备注说明">
                  <textarea
                    name="notes"
                    defaultValue={draft.notes ?? client.notes ?? ""}
                    className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </FieldRow>
                <FieldRow label="补充备注">
                  <textarea
                    name="remark"
                    defaultValue={draft.remark ?? ""}
                    className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </FieldRow>
              </div>

              <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">关联客户</p>
                  <h4 className="mt-2 text-xl font-semibold text-slate-950">{client.name}</h4>
                  <p className="mt-2 text-sm text-slate-500">{client.contactHandle}</p>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    学校信息: {client.schoolType} / {client.educationLevel} / {client.school}
                  </div>
                  <div className="rounded-[18px] bg-white px-4 py-3">专业: {client.major}</div>
                  <div className="rounded-[18px] bg-white px-4 py-3">来源: {client.sourceChannel}</div>
                  <div className="rounded-[18px] bg-white px-4 py-3">预设题目: {client.preferredTitle ?? "-"}</div>
                  <div className="rounded-[18px] bg-white px-4 py-3">预设服务: {client.preferredServiceType ?? "-"}</div>
                  <div className="rounded-[18px] bg-white px-4 py-3">预设预算: ¥{(client.preferredBudget ?? 0).toLocaleString()}</div>
                  <div className="rounded-[18px] bg-white px-4 py-3">预设截止: {client.preferredDeadline ?? "-"}</div>
                </div>
              </aside>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between rounded-[22px] border border-slate-800 bg-slate-950 px-5 py-4 text-white shadow-2xl">
              <div>
                <p className="text-sm text-slate-300">来源自动继承</p>
                <p className="mt-1 text-lg font-medium">{client.sourceChannel}</p>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
              >
                {isPending ? "创建中..." : "确认创建工单"}
              </button>
            </div>
          </form>

          {message ? <p className="mt-4 text-sm text-slate-500">{message}</p> : null}
        </ModalShell>
      ) : null}
    </>
  );
}
