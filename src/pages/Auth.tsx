import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"otp" | "email">("otp");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm shadow-lg border-0 rounded-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={dcsLogo} alt="DCS Logo" className="h-16 w-16 object-contain" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground">DCS ATS</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-Powered Talent Management</p>
          </div>

          {/* Forms */}
          {mode === "otp" ? (
            <OTPForm onSwitchToEmail={() => setMode("email")} />
          ) : (
            <EmailForm onSwitchToOTP={() => setMode("otp")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OTPForm({ onSwitchToEmail }: { onSwitchToEmail: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({ title: "Error", description: "Please enter your mobile number", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } else {
      setStep("verify");
      toast({ title: "OTP Sent", description: "Check your phone for the verification code" });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({ title: "Error", description: "Please enter the OTP", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    }
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Enter OTP</Label>
          <Input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="h-11 rounded-lg border-border"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-muted-foreground hover:bg-muted-foreground/90 text-white font-medium"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("phone")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Change phone number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Mobile Number</Label>
        <Input
          placeholder="Enter your mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11 rounded-lg bg-muted-foreground hover:bg-muted-foreground/90 text-white font-medium"
        disabled={loading}
      >
        {loading ? "Sending..." : "Get OTP"}
      </Button>
      <button
        type="button"
        onClick={onSwitchToEmail}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Login with Email & Password instead
      </button>
    </form>
  );
}

function EmailForm({ onSwitchToOTP }: { onSwitchToOTP: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isSignUp) {
      if (!fullName) {
        toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Check your email to confirm your account." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isSignUp && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Full Name</Label>
          <Input
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-lg border-border"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Email</Label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Password</Label>
        <Input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11 rounded-lg bg-muted-foreground hover:bg-muted-foreground/90 text-white font-medium"
        disabled={loading}
      >
        {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
      </Button>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
        <button
          type="button"
          onClick={onSwitchToOTP}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Login with OTP instead
        </button>
      </div>
    </form>
  );
}
