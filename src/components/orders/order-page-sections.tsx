"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OrderBoard } from "@/components/orders/order-board";
import { OrderManagementPanel } from "@/components/orders/order-management-panel";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { getBooleanParam, replaceUrlParams } from "@/lib/client-url-state";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { Order, Writer } from "@/lib/types";

export function OrderPageSections({
  boardOrders,
  list,
  writers
}: {
  boardOrders: Order[];
  list: PaginatedResult<Order>;
  writers: Writer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [boardOpen, setBoardOpen] = useState(() => getBooleanParam(searchParams, "orderBoardOpen", true));

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
        description="泳道展示活跃阶段工单概览；列表区按页加载。"
        open={boardOpen}
        onToggle={setBoardOpen}
      >
        <OrderBoard orders={boardOrders} />
      </CollapsibleSection>

      <OrderManagementPanel list={list} writers={writers} />
    </>
  );
}
