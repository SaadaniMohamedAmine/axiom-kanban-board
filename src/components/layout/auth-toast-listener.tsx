"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/contexts/toast-context";

interface AuthToastListenerProps {
  userName: string;
}

// notifyLogin()/the signup-hook already write the DB notification row (bell
// dropdown), but that's silent until the user opens it. Login/sign-up
// redirect here with `?authToast=login|signup` so we can also surface it as
// an immediate top-right toast — consumed once, then stripped from the URL.
function AuthToastListenerInner({ userName }: AuthToastListenerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const t = useTranslations("notificationMessages");

  useEffect(() => {
    const authToast = searchParams.get("authToast");
    if (authToast !== "login" && authToast !== "signup") return;

    const key = authToast === "signup" ? "welcome" : "welcome_back";
    notify({
      type: key,
      title: t(`${key}.title`),
      message: t(`${key}.message`, { name: userName }),
    });

    const params = new URLSearchParams(searchParams);
    params.delete("authToast");
    router.replace(params.size ? `?${params.toString()}` : window.location.pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export function AuthToastListener(props: AuthToastListenerProps) {
  return (
    <Suspense fallback={null}>
      <AuthToastListenerInner {...props} />
    </Suspense>
  );
}
