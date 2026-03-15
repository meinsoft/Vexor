import { Bell, LayoutDashboard, LogOut, Search, Settings, Shield, Target } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analyze", label: "Analyze", icon: Search },
  { to: "/drill", label: "Drill", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const initial = user?.email?.[0]?.toUpperCase() ?? "V";

  return (
    <div className="min-h-screen bg-vexor-bg text-vexor-text">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-vexor-border bg-vexor-card">
        <div className="flex h-full flex-col p-5">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-vexor-border bg-white shadow-vexor">
              <Shield className="h-5 w-5 text-[#080808]" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[0.28em] text-white">VEXOR</div>
              <p className="text-xs text-vexor-muted">Threat intelligence</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-[#080808] shadow-vexor"
                      : "text-vexor-muted hover:bg-white/6 hover:text-vexor-text"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4 rounded-2xl border border-vexor-border/70 bg-vexor-bg/70 p-4">
            <div>
              <p className="truncate text-sm font-medium text-vexor-text">{user?.email ?? "anonymous@vexor"}</p>
              <p className="text-xs text-vexor-muted">{user?.company ?? "Free plan"}</p>
            </div>
            <Button variant="outline" className="w-full justify-between" onClick={logout}>
              Logout
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="ml-60 min-h-screen">
        <header className="sticky top-0 z-20 border-b border-vexor-border/70 bg-vexor-bg/90 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Vexor Security Platform</h1>
              <p className="text-sm text-vexor-muted">Monitor phishing risk, review detections, stay ahead.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-vexor-border bg-vexor-card text-vexor-muted transition hover:text-vexor-text">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#080808]">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
