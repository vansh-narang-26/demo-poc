"use client";

import React from "react";
import { Moon, SearchIcon, SquarePen, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/store/useChat";

function NewCase({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { clearMessages } = useChat();

  return (
    <Button
      data-sidebar="new-case"
      data-slot="chat-new-case"
      variant="outline"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        clearMessages();
      }}
      {...props}
    >
      <SquarePen />
      <span className="sr-only">New Case</span>
    </Button>
  );
}

function ChatSearch({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-sidebar="search"
      data-slot="chat-search"
      variant="outline"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      <SearchIcon />
      <span className="sr-only">Chat Search</span>
    </Button>
  );
}

function ThemeToggle({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      data-sidebar="theme-toggle"
      data-slot="theme-toggle"
      variant="outline"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        setTheme(theme === "dark" ? "light" : "dark");
      }}
      {...props}
    >
      {mounted ? theme === "dark" ? <Sun /> : <Moon /> : null}
      <span className="sr-only">Theme Toggle</span>
    </Button>
  );
}

function LanguageToggle({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-sidebar="language-toggle"
      data-slot="language-toggle"
      variant="outline"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
      }}
      {...props}
    >
      <span className="text-sm font-medium">En</span>
      <span className="sr-only">Language Toggle</span>
    </Button>
  );
}

export { NewCase, ChatSearch, ThemeToggle, LanguageToggle };
