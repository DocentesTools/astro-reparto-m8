"use client";

import { RepartoClassroomStagesView } from "@mano8/astro-reparto-m8/default-ui";
import { ToastNotificationHost } from "@/components/m8-ui/toast-notification";

export function RepartoClassroomStagesRegistryView(
  props: Parameters<typeof RepartoClassroomStagesView>[0]
) {
  return (
    <>
      <ToastNotificationHost />
      <RepartoClassroomStagesView {...props} />
    </>
  );
}
