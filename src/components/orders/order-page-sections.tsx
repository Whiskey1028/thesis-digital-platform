"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OrderBoard, type OrderBoardColumn } from "@/components/orders/order-board";
import { OrderManagementPanel } from "@/components/orders/order-management-panel";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { usePersistedOpenState } from "@/lib/client-ui-preference";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { Order, Writer } from "@/lib/types";

export function OrderPageSections({
  boardColumns,
  list,
  writers,
  serviceTypeFilterOptions
}: {
  boardColumns: OrderBoardColumn[];
  list: PaginatedResult<Order>;
  writers: Writer[];
  serviceTypeFilterOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [boardOpen, setBoardOpen] = usePersistedOpenState({
    storageKey: "thesis.ui.orderBoardOpen",
    urlKey: "orderBoardOpen",
    searchParams,
    pathname,
    router,
    defaultOpen: true
  });
  const deepLinkOrderId = searchParams.get("orderId");
  const boardOpenShown = deepLinkOrderId ? false : boardOpen;

  return (
    <>
      <CollapsibleSection
        title="工单分类泳道"
        open={boardOpenShown}
        onToggle={setBoardOpen}
      >
        <OrderBoard columns={boardColumns} />
      </CollapsibleSection>

      <OrderManagementPanel
        list={list}
        writers={writers}
        serviceTypeFilterOptions={serviceTypeFilterOptions}
      />
    </>
  );
}
