import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "admin" | "hr_manager" | "recruiter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: { id: string; full_name: string; email: string; phone: string | null; avatar_url: string | null } | null;
  hasMinRole: (minRole: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const roleLevel: Record<AppRole, number> = {
  super_admin: 4,
  admin: 3,
  hr_manager: 2,
  recruiter: 1,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const fetchUserData = (userId: string) => {
    // Fetch roles
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) setRoles(data.map((r) => r.role as AppRole));
      });

    // Fetch profile
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasMinRole = (minRole: AppRole): boolean => {
    const minLevel = roleLevel[minRole];
    return roles.some((r) => roleLevel[r] >= minLevel);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, profile, hasMinRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
