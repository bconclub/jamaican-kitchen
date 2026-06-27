import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

// Shared demo wallet auth. Wallets are keyed by EMAIL in localStorage, so orders
// placed with an email show up whenever that email logs in (guest order today,
// see it after logging in tomorrow). Fully local until the real auth is wired.
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
interface Wallet {
  balance: number;
  orders: WalletOrder[];
  transactions: WalletTxn[];
}

const WELCOME_BONUS = 5.0;
const CURRENT_KEY = "jk_demo_current";
const wkey = (email: string) => `jk_demo_wallet:${email.trim().toLowerCase()}`;

let _seq = 0;
const newId = () => `tx-${Date.now()}-${_seq++}`;

function freshWallet(): Wallet {
  return {
    balance: WELCOME_BONUS,
    orders: [],
    transactions: [{ id: newId(), amount: WELCOME_BONUS, kind: "earn", note: "Welcome bonus", created_at: new Date().toISOString() }],
  };
}

function loadWallet(email: string): Wallet | null {
  try {
    const raw = localStorage.getItem(wkey(email));
    if (!raw) return null;
    return { balance: 0, orders: [], transactions: [], ...(JSON.parse(raw) as Partial<Wallet>) };
  } catch {
    return null;
  }
}
function saveWallet(email: string, w: Wallet) {
  try {
    localStorage.setItem(wkey(email), JSON.stringify(w));
  } catch {
    /* ignore */
  }
}

// Record a placed order against an email's wallet — works whether or not that
// email is currently logged in (this is the "match by email" path).
export function recordOrder(
  email: string,
  payload: { order: WalletOrder; cashback: number; redeem: number },
) {
  if (!email.trim()) return;
  const w = loadWallet(email) ?? freshWallet();
  w.orders = [payload.order, ...w.orders];
  if (payload.redeem > 0) {
    w.balance = Number(Math.max(0, w.balance - payload.redeem).toFixed(2));
    w.transactions = [{ id: newId(), amount: -payload.redeem, kind: "redeem", note: `Redeemed on ${payload.order.shortId}`, created_at: new Date().toISOString() }, ...w.transactions];
  }
  if (payload.cashback > 0) {
    w.balance = Number((w.balance + payload.cashback).toFixed(2));
    w.transactions = [{ id: newId(), amount: payload.cashback, kind: "earn", note: `Cashback on ${payload.order.shortId}`, created_at: new Date().toISOString() }, ...w.transactions];
  }
  saveWallet(email, w);
}

interface WalletAuthState {
  user: WalletUser | null;
  balance: number;
  orders: WalletOrder[];
  transactions: WalletTxn[];
  login: (email: string, name: string) => void;
  logout: () => void;
  reload: () => void;
}

const EMPTY: Wallet = { balance: 0, orders: [], transactions: [] };
const WalletAuthContext = createContext<WalletAuthState | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [wallet, setWallet] = useState<Wallet>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      if (raw) {
        const u = JSON.parse(raw) as WalletUser;
        setUser(u);
        setWallet(loadWallet(u.email) ?? EMPTY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = (email: string, name: string) => {
    const u = { email: email.trim(), name: name.trim() || "Guest" };
    let w = loadWallet(u.email);
    if (!w) {
      w = freshWallet();
      saveWallet(u.email, w);
    }
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    setUser(u);
    setWallet(w);
  };

  const logout = () => {
    try {
      localStorage.removeItem(CURRENT_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setWallet(EMPTY);
  };

  // Re-read the current user's wallet from storage (e.g. after a checkout wrote to it).
  const reload = useCallback(() => {
    if (user) setWallet(loadWallet(user.email) ?? EMPTY);
  }, [user]);

  return (
    <WalletAuthContext.Provider value={{ user, balance: wallet.balance, orders: wallet.orders, transactions: wallet.transactions, login, logout, reload }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => {
  const ctx = useContext(WalletAuthContext);
  if (!ctx) throw new Error("useWalletAuth must be used within a WalletAuthProvider");
  return ctx;
};
