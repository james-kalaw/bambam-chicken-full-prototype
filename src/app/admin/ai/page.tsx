"use client";

import { ChatPanel } from "@/components/shared/bambam-chat";
import { ROLE_LABELS } from "@/lib/permissions";
import { useCurrentEmployee } from "@/lib/store";

/** Full-page staff chat. Same conversation as the floating Bambam button. */
export default function AdminAssistantPage() {
  const employee = useCurrentEmployee();
  if (!employee) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground">
        Signed in as <strong>{ROLE_LABELS[employee.role]}</strong>. Bambam only answers with data your role is allowed to see, and never performs sensitive actions on its own.
      </p>
      <ChatPanel />
    </div>
  );
}
