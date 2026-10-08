"use client";

import type { ReactNode } from "react";
import { BambamChatProvider, BambamLauncher, type BambamChatConfig } from "@/components/shared/bambam-chat";
import { CUSTOMER_PROMPTS, customerReply } from "@/lib/chat-responder";
import { useDemoStore } from "@/lib/store";

/** Customer-side Bambam: one conversation shared by every customer page */
export function CustomerBambam({ children }: { children: ReactNode }) {
  const store = useDemoStore();
  const config: BambamChatConfig = {
    scope: `customer:${store.customerSession?.customerId ?? "guest"}`,
    subtitle: "Ask me about the menu, your order, or recommendations.",
    greeting: "Hi! How can I help you today?",
    prompts: CUSTOMER_PROMPTS,
    respond: (q) => customerReply(q, store),
    variant: "customer",
  };
  return (
    <BambamChatProvider key={config.scope} config={config}>
      {children}
      {/* Sits above the mobile bottom navigation; hidden on the full chat page */}
      <BambamLauncher hideOn={["/customer/ai"]} className="right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6" />
    </BambamChatProvider>
  );
}
