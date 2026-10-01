"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/client/api-fetch";

/**
 * Open an entity detail from a URL id param: prefer current list page, else GET by id.
 * Scrolls to an optional anchor after open (modal is portaled; scroll still helps list context).
 */
export function useDeepLinkEntity<T>({
  entityId,
  listItems,
  getItemId,
  fetchPathPrefix,
  onOpen,
  scrollAnchorId
}: {
  entityId: string;
  listItems: readonly T[];
  getItemId: (item: T) => string;
  fetchPathPrefix: string;
  onOpen: (entity: T) => void;
  scrollAnchorId?: string;
}) {
  const handledRef = useRef<string | null>(null);
  const onOpenRef = useRef(onOpen);
  const getItemIdRef = useRef(getItemId);
  onOpenRef.current = onOpen;
  getItemIdRef.current = getItemId;

  useEffect(() => {
    if (!entityId) {
      handledRef.current = null;
      return;
    }

    if (handledRef.current === entityId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const fromList = listItems.find((item) => getItemIdRef.current(item) === entityId);
      let entity = fromList ?? null;

      if (!entity) {
        const result = await apiFetch<T>(`${fetchPathPrefix}${encodeURIComponent(entityId)}`);
        if (!result.ok) {
          return;
        }
        entity = result.data;
      }

      if (cancelled || !entity) {
        return;
      }

      handledRef.current = entityId;
      onOpenRef.current(entity);

      if (scrollAnchorId) {
        const scroll = () => {
          document
            .getElementById(scrollAnchorId)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        window.requestAnimationFrame(() => {
          scroll();
          window.setTimeout(scroll, 120);
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entityId, fetchPathPrefix, listItems, scrollAnchorId]);
}
