"use client";

import { CreateSection } from "@/components/ui/create-section";
import { WriterCreateForm } from "@/components/writers/writer-create-form";

export function WriterCreateSection() {
  return (
    <CreateSection
      title="新增写手"
      storageKey="thesis.ui.writerCreateOpen"
      urlKey="writerCreateOpen"
    >
      <WriterCreateForm />
    </CreateSection>
  );
}
