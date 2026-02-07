import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ListTodo } from "lucide-react";

interface TodoGuardContextType {
  /** Call before navigating. Returns true if navigation is allowed. */
  canNavigate: () => boolean;
  /** Call to attempt navigation; shows blocker if incomplete todos exist. */
  requestNavigation: (onProceed: () => void) => void;
}

const TodoGuardContext = createContext<TodoGuardContextType | null>(null);

export function useTodoGuard() {
  const ctx = useContext(TodoGuardContext);
  if (!ctx) throw new Error("useTodoGuard must be used within TodoGuardProvider");
  return ctx;
}

export function TodoGuardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showBlocker, setShowBlocker] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Fetch incomplete critical todos assigned to current user
  const { data: incompleteTodos = [] } = useQuery({
    queryKey: ["todo-guard-incomplete", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("id, title, priority")
        .eq("assigned_to", user!.id)
        .eq("is_completed", false)
        .in("priority", ["critical", "high"])
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const canNavigate = useCallback(() => {
    return incompleteTodos.length === 0;
  }, [incompleteTodos]);

  const requestNavigation = useCallback(
    (onProceed: () => void) => {
      if (incompleteTodos.length === 0) {
        onProceed();
        return;
      }
      setPendingNav(() => onProceed);
      setShowBlocker(true);
    },
    [incompleteTodos]
  );

  const handleProceed = () => {
    setShowBlocker(false);
    pendingNav?.();
    setPendingNav(null);
  };

  const handleStay = () => {
    setShowBlocker(false);
    setPendingNav(null);
  };

  return (
    <TodoGuardContext.Provider value={{ canNavigate, requestNavigation }}>
      {children}

      <AlertDialog open={showBlocker} onOpenChange={setShowBlocker}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ListTodo className="size-5 text-orange-500" />
              Incomplete Tasks
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">You have {incompleteTodos.length} high-priority incomplete task{incompleteTodos.length !== 1 ? "s" : ""}:</p>
                <ul className="space-y-1 text-sm">
                  {incompleteTodos.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {t.title}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">Are you sure you want to leave without completing them?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleStay}>
              Stay & Complete
            </Button>
            <Button variant="destructive" onClick={handleProceed}>
              Leave Anyway
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TodoGuardContext.Provider>
  );
}
