import { supabase } from "@/integrations/supabase/client";

// The wallet tables (customer_wallets, wallet_transactions) aren't in the
// generated Supabase types yet, so we access them through a loosely-typed
// handle and shape the results with the interfaces below. RLS scopes every
// query to the signed-in customer's own rows.
const db = supabase as unknown as {
  from: (table: string) => { select: (cols: string) => any };
};

export const CASHBACK_RATE = 0.05; // 5%

export interface WalletTx {
  id: string;
  kind: "earn" | "redeem" | "adjust";
  amount: number;
  balance_after: number;
  note: string | null;
  order_id: string | null;
  created_at: string;
}

export interface WalletSummary {
  balance: number;
  transactions: WalletTx[];
}

/** Wallet for the currently signed-in customer (RLS-scoped). */
export async function fetchMyWallet(): Promise<WalletSummary> {
  const { data: wallet } = await db
    .from("customer_wallets")
    .select("balance")
    .maybeSingle();

  const { data: txs } = await db
    .from("wallet_transactions")
    .select("id, kind, amount, balance_after, note, order_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    balance: Number((wallet as { balance?: number } | null)?.balance ?? 0),
    transactions: ((txs as WalletTx[] | null) ?? []).map((t) => ({
      ...t,
      amount: Number(t.amount),
      balance_after: Number(t.balance_after),
    })),
  };
}

/** Just the wallet balance (used at checkout to offer redemption). */
export async function fetchMyWalletBalance(): Promise<number> {
  const { data } = await db.from("customer_wallets").select("balance").maybeSingle();
  return Number((data as { balance?: number } | null)?.balance ?? 0);
}

export interface MyOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface MyOrder {
  id: string;
  shortId: string;
  total: number;
  cashbackEarned: number;
  status: string;
  createdAt: string;
  items: MyOrderItem[];
}

/** The signed-in customer's past orders, with line items (RLS-scoped to their own). */
export async function fetchMyOrders(): Promise<MyOrder[]> {
  const { data } = await db
    .from("orders")
    .select("id, short_id, total, cashback_earned, status, created_at, order_items(name, qty, price)")
    .order("created_at", { ascending: false })
    .limit(20);
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((o) => ({
    id: String(o.id),
    shortId: String(o.short_id ?? ""),
    total: Number(o.total ?? 0),
    cashbackEarned: Number(o.cashback_earned ?? 0),
    status: String(o.status ?? "new"),
    createdAt: String(o.created_at ?? ""),
    items: (((o.order_items as Array<Record<string, unknown>>) ?? []) || []).map((it) => ({
      name: String(it.name ?? ""),
      qty: Number(it.qty ?? 1),
      price: Number(it.price ?? 0),
    })),
  }));
}
