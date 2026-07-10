"use client";

import { useEffect, useRef } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";

interface OnboardingTourProps {
  boardId?: string;
}

const TOUR_STEPS = [
  {
    element: "#sidebar-workspaces",
    popover: {
      title: "Your workspaces",
      description:
        "Workspaces group your boards and team. Each workspace has its own members and permissions.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "#board-columns",
    popover: {
      title: "Your board",
      description:
        "Tasks move through columns as work progresses. Drag and drop, or use the context menu.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#create-task-btn",
    popover: {
      title: "Create your first task",
      description:
        "Add a task to any column. Each task gets a unique AX-XXXX identifier.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#axiom-intelligence-panel",
    popover: {
      title: "Axiom Intelligence",
      description:
        "Open any task to access AI-powered suggestions: priority, estimation, blocker detection, and more.",
      side: "left" as const,
      align: "start" as const,
    },
  },
  {
    element: "#invite-team-link",
    popover: {
      title: "Invite your team",
      description:
        "Go to Settings → Members to invite colleagues. Set roles: Owner, Admin, Member, or Viewer.",
      side: "right" as const,
      align: "start" as const,
    },
  },
];

export function OnboardingTour({ boardId }: OnboardingTourProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void (async () => {
      const { driver } = await import("driver.js");
      await import("driver.js/dist/driver.css");

      const existingSteps = TOUR_STEPS.filter((step) => {
        if (step.element === "#board-columns" && !boardId) return false;
        if (step.element === "#axiom-intelligence-panel") return false;
        return true;
      });

      const driverObj = driver({
        showProgress: true,
        steps: existingSteps,
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        progressText: "{{current}} of {{total}}",
        popoverClass: "axiom-driver-popover",
        onDestroyed: () => {
          void completeOnboarding();
        },
      });

      setTimeout(() => {
        driverObj.drive();
      }, 800);
    })();
  }, [boardId]);

  return null;
}
