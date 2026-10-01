"use client";

import { ClientCreateForm } from "@/components/clients/client-create-form";
import { CreateSection } from "@/components/ui/create-section";

export function ClientCreateSection() {
  return (
    <CreateSection
      title="新增客户"
      storageKey="thesis.ui.clientCreateOpen"
      urlKey="clientCreateOpen"
    >
      <ClientCreateForm />
    </CreateSection>
  );
}
