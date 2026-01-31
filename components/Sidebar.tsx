"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logout } from "@/lib/helpers";
import clsx from "clsx";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const data = await getCurrentUser();
      if (data) setCurrentUser(data);
    })();
  }, []);

  const links = [
    { to: "/", icon: LayoutDashboard, label: "Pipeline" },
    { to: "/clients", icon: Users, label: "Clients" },
    { to: "/analytics", icon: TrendingUp, label: "Analytics" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-50 h-screen flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>

        {!collapsed && (
          <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">
            SalesPro
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.to;
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              href={link.to}
              className={clsx(
                "sidebar-link",
                isActive && "active",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium text-sidebar-foreground">
              {currentUser?.name}
            </div>
            <div className="text-xs text-sidebar-foreground/60 capitalize">
              {currentUser?.role}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={clsx(
            "sidebar-link w-full",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-4 top-20 w-8 h-8 rounded-full bg-card border shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>
    </aside>
  );
};

export default Sidebar;
