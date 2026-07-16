"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateNotificationPreferences, type NotificationPreferences } from "@/lib/actions/notification.actions";
import { useToast } from "@/contexts/toast-context";
import { NotificationIcon, notificationBadgeClass } from "@/components/layout/notification-icon";

const NOTIFICATION_TYPES = [
  "blocker_detected",
  "task_assigned",
  "comment_added",
  "sprint_started",
  "ai_suggestion",
  "access_requested",
] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferences;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${checked ? "bg-primary" : "bg-surface-container-highest"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

export function NotificationPreferencesForm({ initialPreferences }: NotificationPreferencesFormProps) {
  const t = useTranslations("notificationPrefs");
  const { toast } = useToast();
  const [notify, setNotify] = useState(initialPreferences.notify);
  const [quietHours, setQuietHours] = useState(initialPreferences.quietHours);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateNotificationPreferences({ notify, quietHours });
      toast(t("saved"));
    } catch {
      toast(t("saveFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h3 className="text-h3 text-on-surface">{t("typesTitle")}</h3>
          <p className="text-[13px] text-on-surface-variant mt-0.5">{t("typesDesc")}</p>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${notificationBadgeClass(type)}`}>
                  <NotificationIcon type={type} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] text-on-surface font-medium">{t(type)}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">{t(`${type}Desc` as `${NotificationType}Desc`)}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={notify[type] ?? true}
                onChange={(value) => setNotify((prev) => ({ ...prev, [type]: value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-h3 text-on-surface">{t("quietHours")}</h3>
          <ToggleSwitch
            checked={quietHours.enabled}
            onChange={(value) => setQuietHours((prev) => ({ ...prev, enabled: value }))}
          />
        </div>
        <p className="text-[13px] text-on-surface-variant mb-4">{t("quietHoursDesc")}</p>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label className="block text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              {t("quietHoursStart")}
            </label>
            <input
              type="time"
              value={quietHours.start}
              onChange={(e) => setQuietHours((prev) => ({ ...prev, start: e.target.value }))}
              disabled={!quietHours.enabled}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-[13px] text-on-surface disabled:opacity-40 focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              {t("quietHoursEnd")}
            </label>
            <input
              type="time"
              value={quietHours.end}
              onChange={(e) => setQuietHours((prev) => ({ ...prev, end: e.target.value }))}
              disabled={!quietHours.enabled}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-[13px] text-on-surface disabled:opacity-40 focus:outline-none input-glow transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          {isSaving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
