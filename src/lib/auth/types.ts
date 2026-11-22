export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "customer" | "admin";
}

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

export interface Address {
  id: string;
  line1: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
}

export type NewAddress = Omit<Address, "id" | "isDefault">;
