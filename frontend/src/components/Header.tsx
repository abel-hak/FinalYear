import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Map,
  Trophy,
  User,
  Menu,
  X,
  HelpCircle,
  LayoutDashboard,
  Sun,
  Moon,
  BookOpen,
  Flame,
} from "lucide-react";
import { getToken, getRole, clearAuth } from "@/api/backend";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationCenter from "./NotificationCenter";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<"learner" | "admin" | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setRole(null);
      return;
    }
    setRole(getRole());
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Home", icon: Code2 },
    ...(role === "admin"
      ? [{ to: "/admin", label: "Admin", icon: LayoutDashboard }]
      : []),
    { to: "/quests", label: "Quests", icon: Map },
    { to: "/learning-paths", label: "Paths", icon: BookOpen },
    { to: "/achievements", label: "Achievements", icon: Trophy },
    { to: "/leaderboard", label: "Leaderboard", icon: Flame },
    { to: "/faq", label: "Help", icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 shadow-sm transition-colors group-hover:bg-primary/25">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <span className="hidden bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-xl font-bold text-transparent sm:block">
            CodeQuest
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center rounded-full border border-border/70 bg-secondary/30 p-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-full px-4",
                    isActive
                      ? "bg-secondary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Notification center */}
          <NotificationCenter />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-full border border-border/70"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User Avatar / Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border/70"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {role ? `Signed in as ${role}` : "Not signed in"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role ? (
                <DropdownMenuItem
                  onClick={() => {
                    clearAuth();
                    navigate("/login");
                  }}
                >
                  Log out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Log in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-border bg-background shadow-lg animate-slide-up md:hidden">
          <nav className="container py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive
                        ? "bg-secondary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}

            {/* Mobile: Notification center */}
            <div className="pt-2">
              <NotificationCenter />
            </div>

            {/* Mobile: Theme toggle */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start gap-2"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              {role ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    clearAuth();
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Log out
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Log in
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
