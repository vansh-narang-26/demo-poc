"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatSearch, NewCase } from "./header-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { isToday, isYesterday, subDays, isAfter, parseISO } from "date-fns";
import { useChat } from "@/store/useChat";

type ChatSession = {
  id: string;
  messages: { role: string; content: string }[];
  createdAt: string;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [chatHistory, setChatHistory] = React.useState<ChatSession[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams?.get("id");
  const { loadMessagesForSession, initializeNewSession } = useChat();

  const groupChatsByDate = (history: ChatSession[]) => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      "Last 7 Days": [],
      Older: [],
    };

    history.forEach((chat) => {
      const createdDate = parseISO(chat.createdAt);
      if (isToday(createdDate)) {
        groups["Today"].push(chat);
      } else if (isYesterday(createdDate)) {
        groups["Yesterday"].push(chat);
      } else if (isAfter(createdDate, subDays(new Date(), 7))) {
        groups["Last 7 Days"].push(chat);
      } else {
        groups["Older"].push(chat);
      }
    });

    Object.values(groups).forEach((list) =>
      list.sort(
        (a, b) =>
          parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
      )
    );

    return groups;
  };

  const refreshHistory = () => {
    const stored = sessionStorage.getItem("chatHistory");
    if (stored) {
      try {
        const sessions = JSON.parse(stored || "{}");
        if (sessions && typeof sessions === "object") {
          setChatHistory(Object.values(sessions));
        }
      } catch (err) {
        console.error("Invalid session history", err);
      }
    }
  };

  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return;

    refreshHistory();

    const handler = () => refreshHistory();
    window.addEventListener("chatHistoryUpdated", handler);
    return () => window.removeEventListener("chatHistoryUpdated", handler);
  }, []);

  const handleNewChat = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return;

    initializeNewSession();
    setTimeout(() => {
      const sessionId = useChat.getState().sessionId;
      router.push(`/chat?id=${sessionId}`);
    }, 0);
  };

  const handleSelectChat = (chatId: string) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) return;

    loadMessagesForSession(chatId);
    router.push(`/chat?id=${chatId}`);
  };

  const groupedChats = groupChatsByDate(chatHistory);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <ChatSearch />
          <NewCase onClick={handleNewChat} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {chatHistory.length === 0 && (
          <div className="text-muted-foreground text-sm px-4 mt-2">
            No previous chat history found.
          </div>
        )}
        {Object.entries(groupedChats).map(
          ([label, sessions]) =>
            sessions.length > 0 && (
              <SidebarGroup key={label}>
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sessions.map((session) => {
                      const firstPrompt = session.messages.find(
                        (msg) => msg.role === "user"
                      )?.content;
                      return (
                        <SidebarMenuItem key={session.id}>
                          <SidebarMenuButton
                            onClick={() => handleSelectChat(session.id)}
                          >
                            {firstPrompt
                              ? firstPrompt.length > 40
                                ? firstPrompt.slice(0, 40) + "..."
                                : firstPrompt
                              : "Untitled Chat"}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
