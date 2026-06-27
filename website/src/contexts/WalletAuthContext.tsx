import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Shared demo wallet auth so the header, wallet page, and checkout all agree on
// who is logged in and the current balance. Fully local (no backend) until the
// real email/OTP service is wired — then swap this for the Supabase session.
export interface WalletUser {
  email: string;
  name: string;
}

interface WalletAuthState {
  user: WalletUser | null;
  balance: number;
  login: (email: string, name: string) => void;
  logout: () => void;
  redeem: (amount: number) => void;
  addCashback: (amount: number) => void;
}

const KEY = "jk_demo_wallet";
const DEFAULT_BALANCE = 3.05;

const WalletAuthContext = createContext<WalletAuthState | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw) as { user: WalletUser | null; balance: number };
        setUser(d.user ?? null);
        setBalance(d.balance ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (u: WalletUser | null, b: number) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ user: u, balance: b }));
    } catch {
      /* ignore */
    }
  };

  const login = (email: string, name: string) => {
    const u = { email: email.trim(), name: name.trim() || "Guest" };
    const b = balance || DEFAULT_BALANCE;
    setUser(u);
    setBalance(b);
    persist(u, b);
  };

  const logout = () => {
    setUser(null);
    setBalance(0);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const redeem = (amount: number) =>
    setBalance((b) => {
      const nb = Math.max(0, Number((b - amount).toFixed(2)));
      persist(user, nb);
      return nb;
    });

  const addCashback = (amount: number) =>
    setBalance((b) => {
      const nb = Number((b + amount).toFixed(2));
      persist(user, nb);
      return nb;
    });

  return (
    <WalletAuthContext.Provider value={{ user, balance, login, logout, redeem, addCashback }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => {
  const ctx = useContext(WalletAuthContext);
  if (!ctx) throw new Error("useWalletAuth must be used within a WalletAuthProvider");
  return ctx;
};
