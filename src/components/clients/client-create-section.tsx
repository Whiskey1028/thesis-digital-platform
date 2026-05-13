"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientCreateForm } from "@/components/clients/client-create-form";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { getBooleanParam, replaceUrlParams } from "@/lib/client-url-state";

export function ClientCreateSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(() => getBooleanParam(searchParams, "clientCreateOpen", true));

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        clientCreateOpen: open ? null : "0"
      }
    });
  }, [open, pathname, router]);

  return (
    <CollapsibleSection
      title="新增客户"
      description="字段已对齐历史 Excel 的核心口径，包括学校类型、学历、预设服务类型与预算信息。"
      open={open}
      onToggle={setOpen}
    >
      <GlassCard className="p-1">
        <ClientCreateForm />
      </GlassCard>
    </CollapsibleSection>
  );
}
