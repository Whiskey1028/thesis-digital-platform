"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { usePersistedOpenState } from "@/lib/client-ui-preference";

export function CreateSection({
  title,
  storageKey,
  urlKey,
  defaultOpen = false,
  children
}: {
  title: string;
  storageKey: string;
  urlKey: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = usePersistedOpenState({
    storageKey,
    urlKey,
    searchParams,
    pathname,
    router,
    defaultOpen
  });

  return (
    <CollapsibleSection title={title} open={open} onToggle={setOpen}>
      <GlassCard className="p-1">{children}</GlassCard>
    </CollapsibleSection>
  );
}
