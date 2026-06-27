import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useWalletAuth } from "@/contexts/WalletAuthContext";

// Inline wallet login (demo OTP) so customers can sign in without leaving the
// page they're on (e.g. from checkout to redeem credits).
export const WalletLoginDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { login } = useWalletAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generated, setGenerated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("email");
    setOtp("");
    setGenerated("");
    setError(null);
  };

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setOtp("");
    setGenerated(String(Math.floor(100000 + Math.random() * 900000)));
    setStep("otp");
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== generated) {
      setError("Incorrect code. Try again.");
      return;
    }
    login(email, name);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{step === "email" ? "Sign in to your wallet" : "Enter your code"}</DialogTitle>
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <p className="text-sm text-muted-foreground">Enter your details and we'll send a one-time code to verify you.</p>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Send code
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium">{email}</span>.
            </p>
            <Input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
              autoFocus
            />
            <p className="text-center text-xs text-muted-foreground">
              Demo code: <span className="font-mono font-semibold">{generated}</span>
            </p>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Verify & continue
            </Button>
            <button type="button" onClick={() => setStep("email")} className="block w-full text-center text-sm text-primary underline">
              Use a different email
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
