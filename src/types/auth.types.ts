export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  providerId: string;
  accountId: string;
  password?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export type AuthProvider = "google" | "github" | "credential";

export interface AuthConflictError {
  code: "EMAIL_ALREADY_LINKED";
  message: string;
  existingProvider: AuthProvider;
}
