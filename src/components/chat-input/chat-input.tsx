"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarX,
  CalendarDays,
  Home,
  Gift,
  LucideIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Attachments, SendChat, Suggestion, VoiceChat } from "./chat-actions";
import { useChat } from "@/store/useChat";
import { useTeamsUser } from "@/hooks/useTeamsUser";

type PolicyQueryType =
  | "Leave Policy"
  | "Holiday Calendar"
  | "Work-from-Home Rules"
  | "Employee Benefits";

const QuickSuggestionButtons: { icon: LucideIcon; label: PolicyQueryType }[] = [
  { icon: CalendarX, label: "Leave Policy" },
  { icon: CalendarDays, label: "Holiday Calendar" },
  { icon: Home, label: "Work-from-Home Rules" },
  { icon: Gift, label: "Employee Benefits" },
];

const PROMPT_SUGGESTIONS: Record<PolicyQueryType, string[]> = {
  "Leave Policy": [
    "How many casual leaves can I take in a year",
    "What is the procedure for applying sick leave",
    "Is there a carry-forward limit for unused leaves",
  ],
  "Holiday Calendar": [
    "Show me the list of holidays for this year",
    "What holidays are planned for next month?",
    "How many national holidays are there?",
  ],
  "Work-from-Home Rules": [
    "What is the official remote work policy?",
    "How do I request a work-from-home day?",
    "Is hybrid work allowed for all departments?",
  ],
  "Employee Benefits": [
    "What insurance benefits are provided?",
    "What are the perks for long-tenured employees?",
    "Is there a relocation assistance policy?",
  ],
};

const PLACEHOLDERS: Record<PolicyQueryType, string> = {
  "Leave Policy": "Ask about types of leaves, rules, and limits",
  "Holiday Calendar": "Check upcoming holidays or calendar",
  "Work-from-Home Rules": "Ask about WFH or hybrid policies",
  "Employee Benefits": "Inquire about insurance, perks, or reimbursements",
};


function extractFirstName(email: string) {
  const rawName = email?.split("@")[0] || "";
  const nameParts = rawName.split(/[._-]/);
  const firstName = nameParts[0] || "";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}


export default function ChatInput() {
  const [value, setValue] = React.useState("");
  const [selectedEvent, setSelectedEvent] = React.useState<PolicyQueryType | "">("");
  const { sendMessage, isLoading, addMessage, messages } = useChat();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId: string | null = searchParams?.get("id") ?? null;

  const { userEmail, loading: loadingUser } = useTeamsUser();

  React.useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  React.useEffect(() => {
    if (messages.length === 0 && selectedEvent) {
      setValue(selectedEvent);
    }
  }, [selectedEvent, messages.length]);

  const createChatIfNone = () => {
    if (!chatId) {
      const newChatId = `chat-${Date.now()}`;
      router.push(`/chat?id=${newChatId}`);
      return newChatId;
    }
    return chatId;
  };

  const handleSendMessage = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    createChatIfNone();
    setValue("");

    const userMessage = { role: "user", content: trimmed };
    const response = await sendMessage(trimmed, "text", undefined, userEmail || undefined);

    if (response && typeof response === "string") {
      const assistantMsg = { role: "assistant", content: response };
      addMessage(response, "assistant", "text");
      const history = JSON.parse(sessionStorage.getItem("chatHistory") || "[]");

      const newChat = {
        id: chatId,
        messages: [userMessage, assistantMsg],
        createdAt: new Date().toISOString(),
      };

      const updated = [newChat, ...history.filter((c: any) => c.id !== chatId)];
      sessionStorage.setItem("chatHistory", JSON.stringify(updated));
      window.dispatchEvent(new Event("chatHistoryUpdated"));
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;

    createChatIfNone();
    await sendMessage(suggestion, "text", undefined, userEmail || undefined);
  };

  return (
    <div className="relative">
      {!loadingUser && userEmail && messages.length === 0 && (
        <div className="mb-8 px-2 text-lg font-bold text-center text-gray-800 dark:text-white" style={{ fontSize: "34px" }}>
          Welcome {extractFirstName(userEmail)}, how can I help?
        </div>
      )}

      <div className="flex flex-col gap-6 border-input rounded-2xl border px-5 py-7 shadow-xs dark:bg-input/30 w-full">
        <Textarea
          ref={textareaRef}
          variant="unstyled"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autosize
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          minRows={1}
          maxRows={4}
          className="w-full"
          disabled={isLoading}
          placeholder={
            selectedEvent ? PLACEHOLDERS[selectedEvent] : "Ask Anything"
          }
        />
        <div className="flex justify-between gap-8">
          <div className="flex gap-2">
            <Attachments disabled={isLoading} />
            {messages.length === 0 &&
              QuickSuggestionButtons.map((button) => (
                <Suggestion
                  key={button.label}
                  icon={
                    <button.icon
                      className={
                        selectedEvent === button.label
                          ? "text-blue-600 dark:text-white"
                          : "text-gray-500 dark:text-white"
                      }
                    />
                  }
                  label={button.label}
                  disabled={isLoading}
                  onClick={() => setSelectedEvent(button.label)}
                  className={`rounded-full px-6 py-4 text-sm flex items-center gap-2 ${
                    selectedEvent === button.label
                      ? "bg-blue-100 text-blue-600 dark:text-white border-blue-200"
                      : "bg-white text-gray-700 dark:text-white border border-gray-200"
                  }`}
                />
              ))}
          </div>
          <div className="flex gap-2">
            {value.trim() ? (
              <SendChat onClick={handleSendMessage} disabled={isLoading} />
            ) : (
              <VoiceChat disabled={isLoading} />
            )}
          </div>
        </div>
      </div>

      {!isLoading && messages.length === 0 && selectedEvent && (
        <div
          key={selectedEvent}
          className="absolute top-full left-0 w-full flex flex-col gap-0 mt-2 bg-white dark:bg-background rounded-lg z-10
             opacity-0 translate-y-2 animate-fade-in"
        >
          {(PROMPT_SUGGESTIONS[selectedEvent] || []).map(
            (suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`text-left text-base text-foreground hover:text-primary transition-colors px-4 py-4 w-full ${
                  index !== 0 ? "border-t" : ""
                }`}
                style={{ borderColor: "#f0f0f0" }}
                type="button"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
