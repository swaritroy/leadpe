import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "business" | "developer" | "vibe_coder";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  whatsapp_number: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  subscription_plan: string | null;
  trial_code: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  preferred_language: string | null;
  upi_id: string | null;
  city: string | null;
  total_earned: number | null;
  total_sites_built: number | null;
  total_sites_live: number | null;
  monthly_passive: number | null;
  onboarding_complete: boolean | null;
  business_name: string | null;
  business_type: string | null;
  website_status: string | null;
  site_url: string | null;
  plan_status: string | null;
  plan_renewal_date: string | null;
  avatar_url: string | null;
  plan_type: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  authReady: false,
  signOut: async () => {},
  refreshRole: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      const r = (data?.role as AppRole) ?? null;
      setRole(r);
      return r;
    } catch {
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setProfile(data as Profile | null);
      return data;
    } catch {
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    await Promise.all([fetchRole(userId), fetchProfile(userId)]);
  }, [fetchRole, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // 1. Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to prevent Supabase client deadlock
          setTimeout(() => {
            if (mounted) loadUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
        setAuthReady(true);
      }
    );

    // 2. THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id).then(() => {
          if (mounted) {
            setLoading(false);
            setAuthReady(true);
          }
        });
      } else {
        setLoading(false);
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refreshRole = useCallback(async () => {
    if (user) await fetchRole(user.id);
  }, [user, fetchRole]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, authReady, signOut, refreshRole, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
