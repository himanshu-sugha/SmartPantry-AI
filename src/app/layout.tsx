
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AgentSidebarWrapper } from "@/components/agent/AgentSidebarWrapper";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartPantry AI",
  description: "Autonomous home shopping agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body className={cn(inter.className, "h-full bg-gray-50 dark:bg-gray-950")}>
        <div className="flex h-full">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden pr-80">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
          </div>
          <AgentSidebarWrapper />
        </div>
      </body>
    </html>
  );
}



