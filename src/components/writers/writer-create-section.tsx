"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { usePersistedOpenState } from "@/lib/client-ui-preference";
import { WriterCreateForm } from "@/components/writers/writer-create-form";

export function WriterCreateSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = usePersistedOpenState({
    storageKey: "thesis.ui.writerCreateOpen",
    urlKey: "writerCreateOpen",
    searchParams,
    pathname,
    router,
    defaultOpen: false
  });

  return (
    <CollapsibleSection title="新增写手" open={open} onToggle={setOpen}>
      <GlassCard className="p-1">
        <WriterCreateForm />
      </GlassCard>
    </CollapsibleSection>
  );
}
