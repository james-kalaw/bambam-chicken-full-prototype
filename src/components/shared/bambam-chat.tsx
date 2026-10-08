"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { ChatAnswer } from "@/lib/chat-responder";
import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";

// ─────────────────────────────────────────────────────────────────────────────
// BAMBAM CHAT (simulated)
// One conversation per side (customer, or each staff account) lives in
// <BambamChatProvider>, which sits in the shared layout. That's why the chat
// keeps its messages while you move between pages, and why the floating
// button and the full chat page show the same conversation.
//
// Avatar state machine:
//   message sent → "chatbot-thinking" mascot → short delay → "chatbot-answering" + reply
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  answer?: ChatAnswer;
}

export interface BambamChatConfig {
  /** Separate conversation per scope, e.g. "customer:CUS-000428" or "staff:emp-owner" */
  scope: string;
  subtitle: string;
  greeting: string;
  prompts: string[];
  respond: (question: string) => ChatAnswer;
  variant: "customer" | "admin";
}

interface ChatContextValue {
  config: BambamChatConfig;
  messages: ChatMessage[];
  thinking: boolean;
  ask: (question: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function useBambamChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("Bambam chat must be inside <BambamChatProvider>");
  return ctx;
}

const storageKey = (scope: string) => `bambam-chat:${scope}`;

function loadMessages(scope: string, greeting: string): ChatMessage[] {
  try {
    const saved = window.sessionStorage.getItem(storageKey(scope));
    if (saved) return JSON.parse(saved) as ChatMessage[];
  } catch {
    /* ignore */
  }
  return [{ id: 0, from: "bot", text: greeting }];
}

/** Put this in a layout. Give it key={config.scope} so a role switch starts a fresh chat. */
export function BambamChatProvider({ config, children }: { config: BambamChatConfig; children: ReactNode }) {
  // The app only renders in the browser (see DemoStoreProvider), so sessionStorage is available here
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(config.scope, config.greeting));
  const [thinking, setThinking] = useState(false);
  const [open, setOpen] = useState(false);
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  // Keep the conversation for this browser session (survives page changes and refreshes)
  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey(config.scope), JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages, config.scope]);

  const ask = useCallback((question: string) => {
    const text = question.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: Date.now(), from: "user", text }]);
    setThinking(true);
    // Simulated processing time; the answer uses the LATEST demo data
    setTimeout(() => {
      const answer = configRef.current.respond(text);
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: answer.text, answer }]);
      setThinking(false);
    }, 1100);
  }, []);

  return <ChatContext.Provider value={{ config, messages, thinking, ask, open, setOpen }}>{children}</ChatContext.Provider>;
}

/** The chat window. Used inside the floating sheet and on the full chat pages. */
export function ChatPanel({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { config, messages, thinking, ask } = useBambamChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;

  return (
    <section className={cn("flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-3xl border bg-white shadow-sm", className)} aria-label="Chat with Bambam">
      <header className={cn("flex items-center gap-3 border-b p-4", config.variant === "customer" ? "bg-bambam-cream" : "bg-muted/50")}>
        <Mascot mood={thinking ? "chatbot-thinking" : "chatbot-answering"} size="sm" alt="Bambam" />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">Bambam</h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden /> Online · {config.subtitle}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) =>
          m.from === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-bambam-brown px-4 py-2 text-sm text-white">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              {/* Only the latest answer shows the avatar, to keep the chat clean */}
              {m.id === lastBotId && !thinking ? <Mascot mood="chatbot-answering" size="xs" /> : <span className="w-8 shrink-0" />}
              <div className="max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm">
                <p>{m.text}</p>
                {m.answer?.bullets && m.answer.bullets.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5">
                    {m.answer.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                )}
                {m.answer?.link && (
                  <Link href={m.answer.link.href} onClick={onNavigate} className="inline-block font-semibold text-bambam-red underline-offset-2 hover:underline">
                    {m.answer.link.label} →
                  </Link>
                )}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-2" role="status">
            <Mascot mood="chatbot-thinking" size="xs" />
            <p className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
              Bambam is thinking<span className="animate-pulse">…</span>
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-3 border-t p-3">
        <div className="-mx-3 overflow-x-auto px-3">
          <div className="flex w-max gap-2">
            {config.prompts.map((p) => (
              <Button key={p} variant="outline" size="sm" className="rounded-full" disabled={thinking} onClick={() => ask(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (thinking) return;
            ask(input);
            setInput("");
          }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Bambam…" aria-label="Message Bambam" className="h-11" />
          <Button type="submit" size="icon-lg" className="size-11" disabled={!input.trim() || thinking} aria-label="Send">
            <Send />
          </Button>
        </form>
        <p className="text-center text-[11px] text-muted-foreground">Prototype: answers are pre-scripted. No AI service is connected.</p>
      </div>
    </section>
  );
}

/** Bottom sheet on phones, side drawer on larger screens */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Floating "Bambam" button. Opens the chat as an overlay — you never leave
 * the page you're on. Hidden on the full chat pages (they already show the chat).
 */
export function BambamLauncher({ hideOn = [], className }: { hideOn?: string[]; className?: string }) {
  const { open, setOpen, thinking } = useBambamChat();
  const pathname = usePathname();
  const mobile = useIsMobile();
  if (hideOn.includes(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat with Bambam"
        aria-haspopup="dialog"
        className={cn(
          "fixed z-40 flex items-center gap-2 rounded-full border-2 border-bambam-orange bg-white p-1 shadow-lg transition hover:scale-105 focus-visible:outline-3 focus-visible:outline-ring md:pr-4",
          className,
        )}
      >
        <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-bambam-cream">
          <Mascot mood={thinking ? "chatbot-thinking" : "chatbot-answering"} size="xs" />
        </span>
        <span className="hidden font-display text-base font-bold text-bambam-brown md:inline">Bambam</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={mobile ? "bottom" : "right"}
          className={cn("gap-0 p-0", mobile ? "h-[88dvh] rounded-t-2xl" : "w-full sm:max-w-md")}
        >
          <SheetTitle className="sr-only">Chat with Bambam</SheetTitle>
          <SheetDescription className="sr-only">Ask Bambam a question without leaving this page.</SheetDescription>
          <ChatPanel className="h-full min-h-0 rounded-none border-0 shadow-none" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
