"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { getBooleanParam, replaceUrlParams } from "@/lib/client-url-state";
import { WriterCreateForm } from "@/components/writers/writer-create-form";

export function WriterCreateSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(() => getBooleanParam(searchParams, "writerCreateOpen", true));

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        writerCreateOpen: open ? null : "0"
      }
    });
  }, [open, pathname, router]);

  return (
    <CollapsibleSection
      title="新增写手"
      description="支持负责人、结算方式、容量、评分等字段，便于后续区分自营和转包协作。"
      open={open}
      onToggle={setOpen}
    >
      <GlassCard className="p-1">
        <WriterCreateForm />
      </GlassCard>
    </CollapsibleSection>
  );
}
