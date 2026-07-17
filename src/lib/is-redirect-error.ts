/**
 * next/navigation's `redirect()` works by throwing a special error that the
 * framework catches at a higher boundary. Any try/catch wrapping a server
 * action call that may `redirect()` must re-throw this instead of treating
 * it as a real failure — otherwise the thrown error's message ("NEXT_REDIRECT")
 * gets surfaced to the user as if something broke, even though the redirect
 * itself still goes through.
 */
export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
