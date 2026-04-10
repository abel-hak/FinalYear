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
  Bug,
  Wrench,
  BrainCircuit,
  Clock3,
  TrendingUp,
  Target,
  Flame,
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

  const nextMilestone = Math.max(250, Math.ceil((totalXP + 1) / 250) * 250);
  const xpToMilestone = Math.max(nextMilestone - totalXP, 0);
  const milestoneProgress =
    nextMilestone > 0 ? Math.min((totalXP / nextMilestone) * 100, 100) : 0;

  const howItWorksSteps = [
    {
      step: 1,
      title: "Find the Bug",
      description:
        "Read the broken code and identify what's causing the error. Use the error message as your first clue.",
      detail: "Inspect stack traces and failing output",
      duration: "~2 min",
      Icon: Bug,
    },
    {
      step: 2,
      title: "Fix the Code",
      description:
        "Apply your fix and run the code. Get hints if you're stuck - they reveal gradually without giving away the answer.",
      detail: "Hints unlock progressively when needed",
      duration: "~3 min",
      Icon: Wrench,
    },
    {
      step: 3,
      title: "Unlock Knowledge",
      description:
        "After fixing the bug, unlock a concept explanation that connects your practical fix to programming theory.",
      detail: "Turn each fix into reusable intuition",
      duration: "~2 min",
      Icon: BrainCircuit,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      <Header />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[28rem] -left-24 h-[22rem] w-[22rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

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
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Start Your Journey
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl">
                Hand-picked coding quests designed to sharpen debugging skills
                step by step.
              </p>
            </div>
            <div className="flex flex-col items-center sm:flex-row gap-2 mt-4 md:mt-0">
              <Link to="/quests">
                <Button
                  variant="outline"
                  className="group border-primary/30 hover:bg-primary/10 text-sm px-4 py-2"
                >
                  View All Quests
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/learning-paths">
                <Button
                  variant="ghost"
                  className="group hover:bg-primary/10 text-sm px-4 py-2"
                >
                  <BookMarked className="w-4 h-4 mr-2" />
                  Learning Paths
                </Button>
              </Link>
            </div>
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
      <section className="py-16 border-y border-primary/20 bg-gradient-to-b from-secondary/45 via-secondary/25 to-background relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 left-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-8 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="container">
          <div className="max-w-5xl mx-auto rounded-2xl border border-primary/25 bg-card/75 backdrop-blur-sm p-6 sm:p-8 shadow-[0_14px_42px_hsl(var(--primary)/0.16)]">
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Badge
                  variant="glass"
                  className="mb-3 border border-primary/30 inline-flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Your Progress Snapshot
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Keep your momentum going
                </h2>
                <p className="text-muted-foreground mt-3 max-w-2xl">
                  Real practice compounds fast. Track your wins and keep your
                  streak moving with focused daily quests.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Flame className="h-3.5 w-3.5" />
                    {completedCount > 0
                      ? "Momentum is building"
                      : "Ready for your first win"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    {xpToMilestone} XP to next milestone
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card/90 to-card/70 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Next milestone
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {nextMilestone} XP
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-[hsl(var(--accent))]"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(milestoneProgress)}% of target reached
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5">
                <div className="pointer-events-none absolute -right-6 -bottom-8 text-[90px] leading-none font-black text-primary/10">
                  1
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-4 border border-primary/30">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 relative z-10">
                  {completedCount}
                </div>
                <div className="text-sm font-medium text-muted-foreground relative z-10">
                  Quests Completed
                </div>
                <div className="mt-3 text-xs text-primary font-medium relative z-10">
                  Every completed quest sharpens debugging instinct
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--accent)/0.35)] bg-gradient-to-br from-[hsl(var(--accent)/0.2)] via-[hsl(var(--accent)/0.1)] to-transparent p-5">
                <div className="pointer-events-none absolute -right-6 -bottom-8 text-[90px] leading-none font-black text-[hsl(var(--accent)/0.2)]">
                  2
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--accent)/0.2)] text-[hsl(var(--accent))] mb-4 border border-[hsl(var(--accent)/0.35)]">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 relative z-10">
                  {totalXP}
                </div>
                <div className="text-sm font-medium text-muted-foreground relative z-10">
                  XP Earned
                </div>
                <div className="mt-3 text-xs text-[hsl(var(--accent))] font-medium relative z-10">
                  Skill growth quantified through consistent practice
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--gold)/0.35)] bg-gradient-to-br from-[hsl(var(--gold)/0.2)] via-[hsl(var(--gold)/0.1)] to-transparent p-5 sm:col-span-2 lg:col-span-1">
                <div className="pointer-events-none absolute -right-6 -bottom-8 text-[90px] leading-none font-black text-[hsl(var(--gold)/0.2)]">
                  3
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] mb-4 border border-[hsl(var(--gold)/0.35)]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 relative z-10">
                  {featuredQuests.length}
                </div>
                <div className="text-sm font-medium text-muted-foreground relative z-10">
                  Active Quests
                </div>
                <div className="mt-3 text-xs text-[hsl(var(--gold))] font-medium relative z-10">
                  Keep at least one quest active to stay in flow
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="container">
          <div className="text-center mb-14">
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
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-primary" />
                ~7 minutes per quest cycle
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                3-step guided workflow
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-0 right-0 top-10 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((stepData) => (
                <StepCard
                  key={stepData.step}
                  step={stepData.step}
                  title={stepData.title}
                  description={stepData.description}
                  detail={stepData.detail}
                  duration={stepData.duration}
                  Icon={stepData.Icon}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10" />
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto rounded-2xl border border-primary/25 bg-card/75 backdrop-blur-sm px-6 py-10 sm:px-10 sm:py-12 text-center shadow-[0_16px_44px_hsl(var(--primary)/0.16)]">
            <Badge
              variant="glass"
              className="mb-4 border border-primary/30 text-xs tracking-wide"
            >
              Launch Your Next Debugging Session
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Break Free from Tutorial Hell?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners mastering debugging through structured,
              hands-on practice.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/quests">
                <Button variant="hero" size="xl" className="group min-w-52">
                  Start Learning Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link to="/learning-paths">
                <Button
                  variant="outline"
                  size="xl"
                  className="min-w-52 border-primary/30 bg-background/40 hover:bg-primary/10"
                >
                  Explore Learning Paths
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs sm:text-sm text-muted-foreground">
              Practical quests, instant feedback, and concept explanations in
              one focused workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/20 bg-secondary/15">
        <div className="container flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
          <p className="text-center">
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
  detail: string;
  duration: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = ({ step, title, description, detail, duration, Icon }) => (
  <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/85 p-6 transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_40px_hsl(var(--primary)/0.2)]">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

    <div className="relative z-10 flex items-start justify-between gap-3 mb-5">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-background/70 px-2.5 py-1 text-xs font-semibold text-primary">
        Step {step}
      </span>
    </div>

    <h3 className="relative z-10 text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="relative z-10 text-muted-foreground">{description}</p>

    <div className="relative z-10 mt-5 flex items-center justify-between gap-2 border-t border-primary/15 pt-4">
      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        {detail}
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {duration}
      </span>
    </div>
  </div>
);

export default Index;
