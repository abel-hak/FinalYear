import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import QuestCard, { Quest } from '@/components/QuestCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Trophy, Zap, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Mascot from '@/components/Mascot';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { fetchProgress } from '@/api/backend';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [featuredQuests, setFeaturedQuests] = useState<Quest[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('codequest-onboarding-complete');
    if (!seen) {
      setShowOnboarding(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const progress = await fetchProgress();
        setTotalXP(progress.total_points);
        const completed = progress.quests.filter((q) => q.status === 'completed').length;
        setCompletedCount(completed);
        const mapped: Quest[] = progress.quests.slice(0, 3).map((q) => {
          const difficulty: Quest['difficulty'] =
            q.level <= 1 ? 'beginner' : q.level === 2 ? 'intermediate' : 'advanced';
          const status: Quest['status'] =
            q.status === 'completed'
              ? 'completed'
              : q.status === 'current'
              ? 'in-progress'
              : 'locked';
          return {
            id: q.id,
            title: q.title,
            description: q.description,
            difficulty,
            category: `Level ${q.level}`,
            status,
            xp: 50,
            estimatedTime: '5 min',
          };
        });
        setFeaturedQuests(mapped);
      } catch {
        // if not logged in or fails, keep defaults (no featured quests)
      }
    }
    load();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('codequest-onboarding-complete', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Onboarding Tutorial for new users */}
      {showOnboarding && (
        <OnboardingTutorial 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
      
      {/* Floating Mascot */}
      <div className="fixed bottom-6 right-6 z-40">
        <Mascot 
          mood={hasSeenOnboarding ? "happy" : "celebrating"}
          message={hasSeenOnboarding ? "Ready for a new quest?" : undefined}
        />
      </div>
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Featured Quests Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="accent" className="mb-4">Featured Quests</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Start Your Journey
              </h2>
            </div>
            <Link to="/quests" className="mt-4 md:mt-0">
              <Button variant="outline" className="group">
                View All Quests
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredQuests.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Log in to see your personalized quests.
              </p>
            ) : (
              featuredQuests.map((quest) => (
                <Link key={quest.id} to={quest.status !== 'locked' ? `/quest/${quest.id}` : '#'}>
                  <QuestCard quest={quest} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Quests Completed</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{totalXP}</div>
              <div className="text-sm text-muted-foreground">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {featuredQuests.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Quests</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="glass" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Debug. Learn. Level Up.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Find the Bug"
              description="Read the broken code and identify what's causing the error. Use the error message as your first clue."
            />
            <StepCard
              step={2}
              title="Fix the Code"
              description="Apply your fix and run the code. Get hints if you're stuck - they reveal gradually without giving away the answer."
            />
            <StepCard
              step={3}
              title="Unlock Knowledge"
              description="After fixing the bug, unlock a concept explanation that connects your practical fix to programming theory."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-pink-500/20" />
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Break Free from Tutorial Hell?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are mastering debugging skills through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/quests">
              <Button variant="hero" size="xl">
                Start Learning Now
              </Button>
            </Link>
            <Link to="/prototype">
              <Button variant="outline" size="xl">
                View Prototype Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 CodeQuest. Built to help programmers debug with confidence.</p>
        </div>
      </footer>
    </div>
  );
};

const StepCard: React.FC<{ step: number; title: string; description: string }> = ({
  step,
  title,
  description
}) => (
  <div className="relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group">
    <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
      {step}
    </div>
    <h3 className="text-xl font-bold text-foreground mt-4 mb-3 group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="text-muted-foreground">
      {description}
    </p>
  </div>
);

export default Index;
