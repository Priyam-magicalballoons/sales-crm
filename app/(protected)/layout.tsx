"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Responsive default (OK to keep)
  useEffect(() => {
    const onResize = () => {
      setSidebarCollapsed(window.innerWidth < 900);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen overflow-hidden">
        {/* Sidebar is FIXED — does NOT affect layout */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />

        {/* Main content NEVER moves */}
        <div
          className={`h-full flex flex-col transition-[padding-left] duration-300 ease-in-out
          ${sidebarCollapsed ? "pl-20" : "pl-65"}`}
        >
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
