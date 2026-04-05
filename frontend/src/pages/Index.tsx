import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import QuestCard, { Quest } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Trophy,
  Zap,
  BookOpen,
  RefreshCw,
  BookMarked,
} from "lucide-react";
import { Link } from "react-router-dom";
import Mascot from "@/components/Mascot";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import DailyActivityBanner from "@/components/DailyActivityBanner";
import {
  fetchProgress,
  fetchReviewSuggestions,
  type ReviewSuggestionDto,
} from "@/api/backend";

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [featuredQuests, setFeaturedQuests] = useState<Quest[]>([]);
  const [reviewSuggestions, setReviewSuggestions] = useState<
    ReviewSuggestionDto[]
  >([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<
    string | null | undefined
  >(undefined);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("codequest-onboarding-complete");
    if (!seen) {
      setShowOnboarding(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [progress, suggestions] = await Promise.all([
          fetchProgress(),
          fetchReviewSuggestions(),
        ]);
        setTotalXP(progress.total_points);
        setLastActivityDate(progress.last_activity_date ?? null);
        const completed = progress.quests.filter(
          (q) => q.status === "completed",
        ).length;
        setCompletedCount(completed);
        const mapped: Quest[] = progress.quests.slice(0, 3).map((q) => {
          const difficulty: Quest["difficulty"] =
            q.level <= 1
              ? "beginner"
              : q.level === 2
                ? "intermediate"
                : "advanced";
          const status: Quest["status"] =
            q.status === "completed"
              ? "completed"
              : q.status === "current"
                ? "in-progress"
                : "locked";
          return {
            id: q.id,
            title: q.title,
            description: q.description,
            difficulty,
            category: `Level ${q.level}`,
            status,
            xp: 50,
            estimatedTime: "5 min",
            tags: q.tags ?? [],
          };
        });
        setFeaturedQuests(mapped);
        setReviewSuggestions(suggestions);
      } catch {
        // if not logged in or fails, keep defaults (no featured quests, no banner)
      }
    }
    load();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("codequest-onboarding-complete", "true");
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[28rem] -left-24 h-[22rem] w-[22rem] rounded-full bg-accent/10 blur-3xl" />
      </div>
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

      {/* Daily activity reminder (US-013) - only when logged in and haven't practiced today */}
      {!dismissedBanner && lastActivityDate !== undefined && (
        <div className="container py-4">
          <DailyActivityBanner
            lastActivityDate={lastActivityDate}
            onDismiss={() => setDismissedBanner(true)}
          />
        </div>
      )}

      {/* Featured Quests Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-6 sm:p-8">
            <div>
              <Badge variant="glass" className="mb-4 border border-primary/30">
                Featured Quests
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Start Your Journey
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl">
                Hand-picked coding quests designed to sharpen debugging skills
                step by step.
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Link to="/quests">
                <Button
                  variant="outline"
                  className="group border-primary/30 hover:bg-primary/10"
                >
                  View All Quests
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/learning-paths">
                <Button variant="ghost" className="group hover:bg-primary/10">
                  <BookMarked className="w-4 h-4 mr-2" />
                  Learning Paths
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredQuests.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Log in to see your personalized quests.
              </p>
            ) : (
              featuredQuests.map((quest) => (
                <Link
                  key={quest.id}
                  to={quest.status !== "locked" ? `/quest/${quest.id}` : "#"}
                >
                  <QuestCard quest={quest} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Spaced repetition: suggest revisiting quests completed 7+ days ago */}
      {reviewSuggestions.length > 0 && (
        <section className="py-16 border-y border-primary/20 bg-gradient-to-b from-secondary/35 via-secondary/20 to-background/60">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
              {/* stat display section*/}
              <div>
                <Badge
                  variant="glass"
                  className="mb-4 flex items-center gap-1 w-fit border border-primary/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Practice for reinforcement
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Time to review
                </h2>
                <p className="text-muted-foreground mt-4">
                  You completed these quests 7+ days ago. Revisit them to
                  reinforce concepts.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewSuggestions.map((s) => (
                <Link key={s.id} to={`/quest/${s.id}`}>
                  <div className="p-4 rounded-xl bg-card/85 border border-primary/20 hover:border-primary/55 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-[0_10px_30px_hsl(var(--primary)/0.2)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Completed {s.days_since_completion} days ago
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {s.description}
                    </p>
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {s.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 border-y border-primary/20 bg-gradient-to-b from-secondary/45 via-secondary/25 to-background">
        <div className="container">
          <div className="max-w-5xl mx-auto rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-[0_12px_40px_hsl(var(--primary)/0.15)]">
            <div className="text-center mb-8">
              <Badge variant="glass" className="mb-3 border border-primary/30">
                Your Progress Snapshot
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Keep your momentum going
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-4">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {completedCount}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Quests Completed
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--accent)/0.35)] bg-gradient-to-br from-[hsl(var(--accent)/0.2)] via-[hsl(var(--accent)/0.1)] to-transparent p-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--accent)/0.2)] text-[hsl(var(--accent))] mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {totalXP}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  XP Earned
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--gold)/0.35)] bg-gradient-to-br from-[hsl(var(--gold)/0.2)] via-[hsl(var(--gold)/0.1)] to-transparent p-5 text-center sm:col-span-2 lg:col-span-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {featuredQuests.length}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Active Quests
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="glass" className="mb-4 border border-primary/30">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Debug. Learn. Level Up.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              A simple flow designed to keep practice focused, measurable, and
              genuinely engaging.
            </p>
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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-primary/10 to-accent/10" />
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Break Free from Tutorial Hell?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are mastering debugging skills
            through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/quests">
              <Button variant="hero" size="xl">
                Start Learning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/20 bg-secondary/20">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            © 2025 CodeQuest. Built to help programmers debug with confidence.
          </p>
        </div>
      </footer>
    </div>
  );
};

const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
}> = ({ step, title, description }) => (
  <div className="relative p-6 rounded-xl bg-card/85 border border-primary/20 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_14px_34px_hsl(var(--primary)/0.2)]">
    <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary to-[hsl(var(--accent))] flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
      {step}
    </div>
    <h3 className="text-xl font-bold text-foreground mt-4 mb-3 group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
