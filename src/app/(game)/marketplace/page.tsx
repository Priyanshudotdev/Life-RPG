"use client";

import { Coins, ShoppingBag } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { db, PLAYER_ID } from "@/lib/db";
import { purchaseShopItem } from "@/lib/game";
import { useGame } from "@/lib/store";
import type { ShopItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
  const { player } = useGame();
  const items = useLiveQuery(() => db.shopItems.toArray(), []);
  const purchases = useLiveQuery(
    () => db.purchases.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );
  const [flash, setFlash] = useState<{ itemId: string; text: string; ok: boolean } | null>(null);

  if (!player) return null;
  const ownedIds = new Set((purchases ?? []).map((p) => p.shopItemId));

  async function handleClaim(item: ShopItem) {
    const result = await purchaseShopItem(item.id);
    setFlash({
      itemId: item.id,
      text: result.ok ? `${item.name} is yours!` : result.reason,
      ok: result.ok,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Marketplace</h1>
          <p className="mt-1 text-sm text-ink-500">
            Spend your hard-earned coins on well-deserved rewards.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400 bg-gold-100 px-4 py-1.5">
          <Coins className="h-4 w-4 text-gold-600" />
          <span className="font-mono text-sm font-bold text-gold-700">{player.coins}</span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map((item) => {
          const affordable = player.coins >= item.costCoins;
          const owned = ownedIds.has(item.id);
          return (
            <Panel key={item.id} className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-parchment-400 bg-parchment-100 text-4xl">
                {item.imageAsset}
              </span>
              <h3 className="mt-3 font-display font-bold text-ink-900">{item.name}</h3>
              <p className="mt-1 min-h-10 text-xs leading-relaxed text-ink-400">
                {item.description}
              </p>
              <span className="mt-2 rounded-full border border-parchment-400 bg-parchment-100 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-ink-500">
                {item.category}
              </span>

              {flash?.itemId === item.id ? (
                <p
                  role="status"
                  className={cn(
                    "mt-3 w-full rounded-lg border px-3 py-2 text-xs font-semibold",
                    flash.ok
                      ? "border-moss-300 bg-moss-50 text-moss-600"
                      : "border-terra-300 bg-terra-100/60 text-terra-600"
                  )}
                >
                  {flash.text}
                </p>
              ) : null}

              <div className="mt-auto w-full pt-4">
                {owned ? (
                  <Button variant="secondary" disabled className="w-full">
                    <ShoppingBag className="h-4 w-4" /> Claimed ✓
                  </Button>
                ) : (
                  <>
                    <p className="mb-2 flex items-center justify-center gap-1 font-mono text-sm font-bold text-gold-700">
                      <Coins className="h-3.5 w-3.5" /> {item.costCoins}
                    </p>
                    <Button
                      variant={affordable ? "accent" : "secondary"}
                      className="w-full"
                      onClick={() => void handleClaim(item)}
                    >
                      Claim
                    </Button>
                  </>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
