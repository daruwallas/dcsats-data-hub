import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // Show warning 2 minutes before logout

export function IdleDetector() {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(120);

    if (!user) return;

    // Show warning after (IDLE_TIMEOUT - WARNING_BEFORE)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_BEFORE / 1000);

      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    // Auto logout after IDLE_TIMEOUT
    idleTimer.current = setTimeout(() => {
      signOut();
    }, IDLE_TIMEOUT);
  }, [user, signOut, clearAllTimers]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleActivity = () => {
      if (!showWarning) resetTimers();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
  }, [user, resetTimers, clearAllTimers, showWarning]);

  const handleStayActive = () => {
    resetTimers();
  };

  const handleLogout = () => {
    clearAllTimers();
    signOut();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="size-5 text-orange-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve been idle for a while. Your session will expire in{" "}
            <span className="font-bold text-foreground">{formatTime(countdown)}</span>.
            Click &quot;Stay Active&quot; to continue working.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleLogout}>
            Logout Now
          </Button>
          <Button onClick={handleStayActive}>Stay Active</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
