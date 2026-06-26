import { supabase } from "@/integrations/supabase/client";

// The wallet tables (customer_wallets, wallet_transactions) aren't in the
// generated Supabase types yet, so we access them through a loosely-typed
// handle and shape the results with the interfaces below. RLS scopes every
// query to the signed-in customer's own rows.
const db = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => any;
  };
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
