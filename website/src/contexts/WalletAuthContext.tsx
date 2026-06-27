import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Shared demo wallet auth so the header, wallet page, and checkout all agree on
// who is logged in, the balance, placed orders, and activity. Fully local (no
// backend) until the real email/OTP service is wired.
export interface WalletUser {
  email: string;
  name: string;
}
export interface WalletOrder {
  id: string;
  shortId: string;
  createdAt: string;
  status: string;
  total: number;
  cashbackEarned: number;
  items: { name: string; qty: number; price: number }[];
}
export interface WalletTxn {
  id: string;
  amount: number;
  kind: "earn" | "redeem" | "adjust";
  note?: string;
  created_at: string;
}

interface WalletAuthState {
  user: WalletUser | null;
  balance: number;
  orders: WalletOrder[];
  transactions: WalletTxn[];
  login: (email: string, name: string) => void;
  logout: () => void;
  addOrder: (order: WalletOrder) => void;
  earn: (amount: number, note: string) => void;
  spend: (amount: number, note: string) => void;
}

const KEY = "jk_demo_wallet";
const WELCOME_BONUS = 5.0;

interface Stored {
  user: WalletUser | null;
  balance: number;
  orders: WalletOrder[];
  transactions: WalletTxn[];
}

const WalletAuthContext = createContext<WalletAuthState | undefined>(undefined);

// Unique-ish id without Math.random reliance issues.
let _seq = 0;
const newId = () => `tx-${Date.now()}-${_seq++}`;

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>({ user: null, balance: 0, orders: [], transactions: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ user: null, balance: 0, orders: [], transactions: [], ...(JSON.parse(raw) as Partial<Stored>) });
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: Stored) => {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const login = (email: string, name: string) => {
    const u = { email: email.trim(), name: name.trim() || "Guest" };
    // Fresh wallet (no prior activity) gets a welcome bonus so redeem is testable.
    if (state.transactions.length === 0 && state.orders.length === 0) {
      persist({
        user: u,
        balance: WELCOME_BONUS,
        orders: [],
        transactions: [{ id: newId(), amount: WELCOME_BONUS, kind: "earn", note: "Welcome bonus", created_at: new Date().toISOString() }],
      });
    } else {
      persist({ ...state, user: u });
    }
  };

  const logout = () => {
    setState({ user: null, balance: 0, orders: [], transactions: [] });
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const addOrder = (order: WalletOrder) => persist({ ...state, orders: [order, ...state.orders] });

  const earn = (amount: number, note: string) =>
    persist({
      ...state,
      balance: Number((state.balance + amount).toFixed(2)),
      transactions: [{ id: newId(), amount, kind: "earn", note, created_at: new Date().toISOString() }, ...state.transactions],
    });

  const spend = (amount: number, note: string) =>
    persist({
      ...state,
      balance: Number(Math.max(0, state.balance - amount).toFixed(2)),
      transactions: [{ id: newId(), amount: -amount, kind: "redeem", note, created_at: new Date().toISOString() }, ...state.transactions],
    });

  return (
    <WalletAuthContext.Provider
      value={{ user: state.user, balance: state.balance, orders: state.orders, transactions: state.transactions, login, logout, addOrder, earn, spend }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => {
  const ctx = useContext(WalletAuthContext);
  if (!ctx) throw new Error("useWalletAuth must be used within a WalletAuthProvider");
  return ctx;
};
