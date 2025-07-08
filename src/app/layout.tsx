import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { SnackbarClientProvider } from "@/components/snackbar-provider";

export const metadata: Metadata = {
  title: "CAPEX POC",
  description: "AI-powered agent to instantly search and retrieve real-estate information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SnackbarClientProvider>
            <Providers>{children}</Providers>
          </SnackbarClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
