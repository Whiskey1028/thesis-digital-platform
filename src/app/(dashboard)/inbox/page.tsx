import { Suspense } from "react";
import { InboxView } from "@/components/inbox/inbox-view";
import { Topbar } from "@/components/layout/topbar";
import { loadInboxPayload } from "@/lib/queries/inbox";
import { parseInboxPageQuery } from "@/lib/queries/page-params";

type InboxPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const query = parseInboxPageQuery(params);
  const { kpis, list } = await loadInboxPayload(query);

  return (
    <div className="pb-10">
      <Topbar title="在途" description="个人交付待办：按对客截止排序，优先看逾期与临期。" />
      <Suspense
        fallback={
          <div className="mt-6 rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">
            正在载入在途看板...
          </div>
        }
      >
        <InboxView kpis={kpis} list={list} />
      </Suspense>
    </div>
  );
}
