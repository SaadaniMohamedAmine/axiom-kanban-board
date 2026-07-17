"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/contexts/toast-context";

interface NotificationToastListenerProps {
  userName: string;
}

const VALID_KEYS = ["welcome_back", "welcome", "workspace_deleted", "workspace_created"] as const;
type NotifyKey = (typeof VALID_KEYS)[number];

// Some notification-worthy actions (login, sign-up, deleting a workspace)
// end with a server-side redirect() — there's no client-side "success"
// moment left to hook a toast into once the page has already navigated.
// The redirect target carries `?notify=<key>` (+ optional `name`) so we can
// consume it once here, then strip it from the URL.
function NotificationToastListenerInner({ userName }: NotificationToastListenerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();
  const t = useTranslations("notificationMessages");

  useEffect(() => {
    const key = searchParams.get("notify") as NotifyKey | null;
    if (!key || !VALID_KEYS.includes(key)) return;

    const name = searchParams.get("name") ?? userName;
    notify({
      type: key,
      title: t(`${key}.title`),
      message: t(`${key}.message`, { name }),
    });

    const params = new URLSearchParams(searchParams);
    params.delete("notify");
    params.delete("name");
    router.replace(params.size ? `?${params.toString()}` : window.location.pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export function NotificationToastListener(props: NotificationToastListenerProps) {
  return (
    <Suspense fallback={null}>
      <NotificationToastListenerInner {...props} />
    </Suspense>
  );
}
