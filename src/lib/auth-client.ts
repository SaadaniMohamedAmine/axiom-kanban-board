import { createAuthClient } from "better-auth/react";

// No baseURL: this app serves its auth API from the same origin as the
// frontend, so same-origin relative requests work everywhere (dev, preview,
// prod) with zero config. An explicit baseURL here is a footgun — process.env
// vars without the NEXT_PUBLIC_ prefix are never inlined into the browser
// bundle, so a fallback like "http://localhost:3000" would silently apply in
// every environment, including production (undetectable in local dev, since
// the dev server happens to also run on localhost:3000).
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
