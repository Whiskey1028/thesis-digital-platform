"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OrderBoard } from "@/components/orders/order-board";
import { OrderManagementPanel } from "@/components/orders/order-management-panel";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { getBooleanParam, replaceUrlParams } from "@/lib/client-url-state";
import type { Client, Order, Writer } from "@/lib/types";

export function OrderPageSections({
  orders,
  writers,
  clients
}: {
  orders: Order[];
  writers: Writer[];
  clients: Client[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [boardOpen, setBoardOpen] = useState(() =>
    getBooleanParam(searchParams, "orderBoardOpen", true)
  );

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        orderBoardOpen: boardOpen ? null : "0"
      }
    });
  }, [boardOpen, pathname, router]);

  return (
    <>
      <CollapsibleSection
        title="工单分类泳道"
        description="可以整体收起泳道区，便于在长页面中快速跳到列表管理。"
        open={boardOpen}
        onToggle={setBoardOpen}
      >
        <OrderBoard orders={orders} clients={clients} />
      </CollapsibleSection>

      <OrderManagementPanel orders={orders} writers={writers} clients={clients} />
    </>
  );
}
