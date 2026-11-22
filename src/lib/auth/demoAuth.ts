"use client";

import { createLocalStore } from "@/lib/utils/localStore";
import { hashPassword, verifyPassword, validatePassword } from "./password";
import type { AuthResult, AuthUser } from "./types";

/**
 * DEMO-MODE accounts. They exist only in this browser (localStorage) and passwords are
 * salted + hashed with PBKDF2, never stored in plain text. This is NOT a substitute for a
 * real auth service: configure Supabase and the app uses Supabase Auth instead.
 */
export interface DemoUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "customer" | "admin";
  salt: string;
  hash: string;
  iterations: number;
}

const EMPTY_USERS: Record<string, DemoUser> = {};
export const demoUsers = createLocalStore<Record<string, DemoUser>>("threadify-demo-users-v1", EMPTY_USERS);
export const demoSession = createLocalStore<string | null>("threadify-demo-session-v1", null); // user id

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const toAuthUser = (u: DemoUser): AuthUser => ({ id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role });

export async function demoRegister(name: string, email: string, password: string): Promise<AuthResult> {
  const e = normalizeEmail(email);
  if (name.trim().length < 2) return { ok: false, error: "Enter your full name." };
  if (!EMAIL.test(e)) return { ok: false, error: "Enter a valid email address." };
  const pwError = validatePassword(password);
  if (pwError) return { ok: false, error: pwError };
  const users = demoUsers.getSnapshot();
  if (users[e]) return { ok: false, error: "An account with this email already exists. Try logging in." };
  const rec = await hashPassword(password);
  const user: DemoUser = { id: crypto.randomUUID(), email: e, name: name.trim(), phone: "", role: "customer", ...rec };
  demoUsers.set({ ...demoUsers.getSnapshot(), [e]: user });
  demoSession.set(user.id);
  return { ok: true };
}

export async function demoLogin(email: string, password: string): Promise<AuthResult> {
  const user = demoUsers.getSnapshot()[normalizeEmail(email)];
  // Same message and similar work whether the email exists or not (no account enumeration).
  const rec = user ?? { salt: "AAAAAAAAAAAAAAAAAAAAAA==", hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", iterations: 210_000 };
  const ok = await verifyPassword(password, rec);
  if (!user || !ok) return { ok: false, error: "Incorrect email or password." };
  demoSession.set(user.id);
  return { ok: true };
}

export function demoLogout() {
  demoSession.set(null);
}

export function demoUpdateProfile(userId: string, patch: { name: string; phone: string }) {
  const users = demoUsers.getSnapshot();
  const entry = Object.entries(users).find(([, u]) => u.id === userId);
  if (!entry) return;
  demoUsers.set({ ...users, [entry[0]]: { ...entry[1], ...patch } });
}

/**
 * DEMO MODE ONLY: a built-in admin so the dashboard can be shown without Supabase.
 * The credentials are public (they're printed on the admin sign-in screen in demo mode),
 * so this is NOT security — the demo admin guard only exists in the browser.
 * With Supabase configured this account is never created; admins are promoted in SQL.
 */
export const DEMO_ADMIN = { email: "admin@threadify.example", password: "Admin@12345" };

export async function ensureDemoAdmin() {
  if (demoUsers.getSnapshot()[DEMO_ADMIN.email]) return;
  const rec = await hashPassword(DEMO_ADMIN.password);
  const users = demoUsers.getSnapshot();
  if (users[DEMO_ADMIN.email]) return;
  demoUsers.set({
    ...users,
    [DEMO_ADMIN.email]: { id: "demo-admin", email: DEMO_ADMIN.email, name: "Demo Admin", phone: "", role: "admin", ...rec },
  });
}
