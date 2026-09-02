"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientCreateForm } from "@/components/clients/client-create-form";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { usePersistedOpenState } from "@/lib/client-ui-preference";

export function ClientCreateSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = usePersistedOpenState({
    storageKey: "thesis.ui.clientCreateOpen",
    urlKey: "clientCreateOpen",
    searchParams,
    pathname,
    router,
    defaultOpen: false
  });

  return (
    <CollapsibleSection title="新增客户" open={open} onToggle={setOpen}>
      <GlassCard className="p-1">
        <ClientCreateForm />
      </GlassCard>
    </CollapsibleSection>
  );
}
