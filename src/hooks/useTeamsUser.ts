import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export function useTeamsUser() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamsUser() {
      try {
        await microsoftTeams.app.initialize();
        const context = await microsoftTeams.app.getContext();
        const email = context?.user?.userPrincipalName || context?.user?.id || null;
        setUserEmail(email);
      } catch (error) {
        console.error("Microsoft Teams SDK error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamsUser();
  }, []);

  return { userEmail, loading };
}

