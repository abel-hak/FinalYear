import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code2, Map, Trophy, User, Sparkles, Menu, X, HelpCircle, Shield } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { fetchProgress, getToken } from '@/api/backend';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUserXP(0);
      setUserLevel(0);
      setXpToNextLevel(100);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const progress = await fetchProgress();
        if (cancelled) return;
        setUserXP(progress.total_points);
        setUserLevel(progress.current_level);
        // Simple next-level curve: 100 XP per level
        setXpToNextLevel(progress.current_level * 100 || 100);
      } catch {
        if (!cancelled) {
          setUserXP(0);
          setUserLevel(0);
          setXpToNextLevel(100);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Code2 },
    { to: '/quests', label: 'Quests', icon: Map },
    { to: '/achievements', label: 'Achievements', icon: Trophy },
    { to: '/faq', label: 'Help', icon: HelpCircle },
    { to: '/access-control-security', label: 'Docs', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Code2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text hidden sm:block">
            CodeQuest
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  size="sm"
                  className={cn(isActive && "bg-secondary")}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        
        {/* User Stats */}
        <div className="hidden md:flex items-center gap-4">
          {/* XP Progress */}
          <div className="flex items-center gap-3">
            <Badge variant="gold" className="flex items-center gap-1 px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-bold">{userXP} XP</span>
            </Badge>
            <div className="w-24">
              <ProgressBar value={userXP} max={xpToNextLevel} size="sm" variant="gold" />
            </div>
            <Badge variant="glass" className="font-bold">
              Lv. {userLevel}
            </Badge>
          </div>
          
          {/* User Avatar */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Mobile Menu Toggle */}
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border animate-slide-up">
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
                    className="w-full justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            
            {/* Mobile XP */}
            <div className="pt-4 border-t border-border flex items-center gap-3">
              <Badge variant="gold" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {userXP} XP
              </Badge>
              <Badge variant="glass">Lv. {userLevel}</Badge>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
