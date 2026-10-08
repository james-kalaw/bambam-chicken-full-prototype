"use client";

import { ChatPanel } from "@/components/shared/bambam-chat";

/** Full-page chat. Shares the same conversation as the floating Bambam button. */
export default function CustomerAssistantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <ChatPanel />
    </div>
  );
}
