import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LanguageToggle,
  NewCase,
  ThemeToggle,
} from "@/components/header-actions";
import XSDark from "@/assets/logos/Logo.svg";
import XSLight from "@/assets/logos/Logo.svg";
import { useChat } from "@/store/useChat";
import * as microsoftTeams from "@microsoft/teams-js";

export default function AppHeader() {
  const { state, isMobile } = useSidebar();
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isInTeams, setIsInTeams] = useState(false);

  useEffect(() => {
    setMounted(true);

    microsoftTeams.app.initialize().then(() => {
      setIsInTeams(true);
    }).catch(() => {
      setIsInTeams(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    const chatStore = useChat.getState();
    chatStore.cancelOngoingRequest();
    window.dispatchEvent(new Event("logoutTriggered"));
    router.replace("/");
  };

  return (
    <header className="flex shrink-0 justify-between items-center gap-2 px-4 py-5">
      <div className="flex items-center gap-2">
        {(state === "collapsed" || isMobile) && (
          <>
            <SidebarTrigger className="-ml-1" />
            <NewCase />
            <Separator
              orientation="vertical"
              className="mx-1 data-[orientation=vertical]:h-4"
            />
          </>
        )}

        {mounted ? (
          <Image
            src={theme === "dark" ? XSDark : XSLight}
            alt="XS Logo"
            height={32}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <LanguageToggle />
        <ThemeToggle />
        {!isInTeams && (
          <button
            onClick={handleLogout}
            className="border px-4 py-1 rounded-md hover:cursor-pointer hover:bg text-sm"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
