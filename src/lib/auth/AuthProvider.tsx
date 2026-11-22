"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/supabase/config";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useHydrated, useStore } from "@/lib/utils/localStore";
import { validatePassword } from "./password";
import { demoLogin, demoLogout, ensureDemoAdmin, demoRegister, demoSession, demoUpdateProfile, demoUsers, toAuthUser } from "./demoAuth";
import type { AuthResult, AuthUser } from "./types";

interface AuthApi {
  user: AuthUser | null;
  ready: boolean; // false until we know whether someone is signed in
  mode: "demo" | "supabase";
  register(name: string, email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  updateProfile(patch: { name: string; phone: string }): Promise<AuthResult>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

async function loadSupabaseUser(session: Session | null): Promise<AuthUser | null> {
  if (!session) return null;
  const sb = getBrowserSupabase()!;
  const { data } = await sb.from("profiles").select("full_name, phone, role").eq("id", session.user.id).maybeSingle();
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: data?.full_name ?? (session.user.user_metadata?.full_name as string | undefined) ?? "",
    phone: data?.phone ?? "",
    role: data?.role === "admin" ? "admin" : "customer",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const users = useStore(demoUsers);
  const sessionId = useStore(demoSession);
  const [remote, setRemote] = useState<{ ready: boolean; user: AuthUser | null }>({ ready: false, user: null });

  useEffect(() => {
    if (isDemoMode) {
      void ensureDemoAdmin();
      return;
    }
    const sb = getBrowserSupabase()!;
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      // Defer: calling Supabase from inside this callback can deadlock the auth lock.
      setTimeout(() => {
        loadSupabaseUser(session)
          .then((user) => setRemote({ ready: true, user }))
          .catch(() => setRemote({ ready: true, user: null }));
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const demoUser = useMemo(() => {
    const u = sessionId ? Object.values(users).find((x) => x.id === sessionId) : undefined;
    return u ? toAuthUser(u) : null;
  }, [users, sessionId]);

  const register = useCallback<AuthApi["register"]>(async (name, email, password) => {
    if (isDemoMode) return demoRegister(name, email, password);
    const pwError = validatePassword(password);
    if (pwError) return { ok: false, error: pwError };
    if (name.trim().length < 2) return { ok: false, error: "Enter your full name." };
    const { data, error } = await getBrowserSupabase()!.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, needsConfirmation: !data.session };
  }, []);

  const login = useCallback<AuthApi["login"]>(async (email, password) => {
    if (isDemoMode) return demoLogin(email, password);
    const { error } = await getBrowserSupabase()!.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return { ok: true };
    if (/confirm/i.test(error.message)) return { ok: false, error: "Please confirm your email first — check your inbox." };
    return { ok: false, error: "Incorrect email or password." };
  }, []);

  const logout = useCallback(async () => {
    if (isDemoMode) return demoLogout();
    await getBrowserSupabase()!.auth.signOut();
  }, []);

  const updateProfile = useCallback<AuthApi["updateProfile"]>(
    async (patch) => {
      const name = patch.name.trim();
      const phone = patch.phone.trim();
      if (name.length < 2) return { ok: false, error: "Enter your full name." };
      if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))) {
        return { ok: false, error: "Enter a 10-digit Indian mobile number, or leave it blank." };
      }
      if (isDemoMode) {
        if (demoUser) demoUpdateProfile(demoUser.id, { name, phone });
        return { ok: true };
      }
      const current = remote.user;
      if (!current) return { ok: false, error: "You're signed out." };
      const { error } = await getBrowserSupabase()!.from("profiles").update({ full_name: name, phone }).eq("id", current.id);
      if (error) return { ok: false, error: "Couldn't save your profile. Please try again." };
      setRemote({ ready: true, user: { ...current, name, phone } });
      return { ok: true };
    },
    [demoUser, remote.user]
  );

  const value: AuthApi = {
    user: isDemoMode ? demoUser : remote.user,
    ready: isDemoMode ? hydrated : remote.ready,
    mode: isDemoMode ? "demo" : "supabase",
    register,
    login,
    logout,
    updateProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
