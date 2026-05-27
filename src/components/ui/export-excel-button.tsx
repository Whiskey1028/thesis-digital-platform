"use client";

import { useState } from "react";

export function ExportExcelButton({
  exportUrl,
  label = "导出 Excel"
}: {
  exportUrl: string;
  label?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        window.alert("导出失败，请稍后重试。");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const utf8FilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiFilenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = utf8FilenameMatch
        ? decodeURIComponent(utf8FilenameMatch[1])
        : asciiFilenameMatch?.[1] ?? "export.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("导出失败，请检查网络后重试。");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleExport();
      }}
      disabled={isExporting}
      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 disabled:opacity-60"
    >
      {isExporting ? "导出中..." : label}
    </button>
  );
}
