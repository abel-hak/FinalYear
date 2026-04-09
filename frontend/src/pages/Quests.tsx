import React from "react";
import Header from "@/components/Header";
import QuestCard, { Quest } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import DailyActivityBanner from "@/components/DailyActivityBanner";
import { Filter, Sparkles, Trophy, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProgress } from "@/api/backend";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Quests: React.FC = () => {
  const [filter, setFilter] = React.useState<string>("all");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = React.useState<
    string | null | undefined
  >(undefined);
  const [dismissedBanner, setDismissedBanner] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const progress = await fetchProgress();
        if (cancelled) return;
        const mapped: Quest[] = progress.quests.map((q) => {
          // Map backend status to frontend status
          const status =
            q.status === "completed"
              ? "completed"
              : q.status === "current"
                ? "in-progress"
                : "locked";
          // Rough difficulty & category mapping for UI only
          const difficulty: Quest["difficulty"] =
            q.level <= 1
              ? "beginner"
              : q.level === 2
                ? "intermediate"
                : "advanced";
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
        setQuests(mapped);
        setLastActivityDate(progress.last_activity_date ?? null);
        setError(null);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "Failed to load quests");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = quests.filter((q) => q.status === "completed").length;
  const totalXP = quests
    .filter((q) => q.status === "completed")
    .reduce((sum, q) => sum + q.xp, 0);

  // Collect all unique tags for filter options
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    quests.forEach((q) => (q.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [quests]);

  const filteredQuests = React.useMemo(() => {
    let result = quests;
    if (filter !== "all")
      result = result.filter((q) => q.difficulty === filter);
    if (tagFilter !== "all")
      result = result.filter((q) => (q.tags ?? []).includes(tagFilter));
    return result;
  }, [quests, filter, tagFilter]);

  const getCosineOffset = React.useCallback((index: number) => {
    const amplitude = 170;
    const frequency = 0.9;
    return Math.round(Math.cos(index * frequency) * amplitude);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Daily activity reminder (US-013) */}
        {!dismissedBanner && lastActivityDate !== undefined && (
          <div className="mb-6">
            <DailyActivityBanner
              lastActivityDate={lastActivityDate}
              onDismiss={() => setDismissedBanner(true)}
            />
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 rounded-2xl border border-primary/20 bg-card/60 p-6 shadow-[0_10px_30px_hsl(var(--primary)/0.12)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
                Quest Map
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Choose your next debugging challenge and build momentum with
                focused practice.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 text-success" />
                  Completed
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {completedCount}/{quests.length || 0}
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--accent)/0.3)] bg-gradient-to-br from-[hsl(var(--accent)/0.18)] via-[hsl(var(--accent)/0.08)] to-transparent px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-gold" />
                  Total XP
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalXP}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-r from-secondary/45 via-secondary/25 to-background/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground sm:text-base">
                Overall Progress
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {quests.length > 0
                  ? `${Math.round((completedCount / quests.length) * 100)}% complete`
                  : "0% complete"}
              </span>
            </div>
            <ProgressBar
              value={completedCount}
              max={quests.length || 1}
              size="lg"
              variant="success"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-primary/20 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Quest Filters
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Refine the quest list by difficulty or concept.
              </p>
            </div>

            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 bg-background/60 md:w-auto"
                >
                  <Filter className="h-4 w-4" />
                  Open filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-border bg-background/95 backdrop-blur-xl sm:rounded-2xl">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-foreground">
                    Filter quests
                  </DialogTitle>
                  <DialogDescription>
                    Choose difficulty and concept filters to narrow down the
                    quest list.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-card/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Difficulty
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Select a difficulty level.
                        </p>
                      </div>
                      {filter !== "all" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 text-muted-foreground"
                          onClick={() => setFilter("all")}
                        >
                          <X className="h-3.5 w-3.5" />
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["all", "beginner", "intermediate", "advanced"].map(
                        (level) => (
                          <Button
                            key={level}
                            variant={filter === level ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(level)}
                            className="capitalize"
                          >
                            {level}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Concepts
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Filter quests by topic tags.
                        </p>
                      </div>
                      {tagFilter !== "all" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 text-muted-foreground"
                          onClick={() => setTagFilter("all")}
                        >
                          <X className="h-3.5 w-3.5" />
                          Clear
                        </Button>
                      )}
                    </div>
                    {allTags.length > 0 ? (
                      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                        <Button
                          variant={tagFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTagFilter("all")}
                        >
                          All
                        </Button>
                        {allTags.map((tag) => (
                          <Button
                            key={tag}
                            variant={tagFilter === tag ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTagFilter(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No concept tags available yet.
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFilter("all");
                      setTagFilter("all");
                    }}
                  >
                    Reset all filters
                  </Button>
                  <Button onClick={() => setFiltersOpen(false)}>
                    Apply filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                Difficulty:{" "}
                <span className="font-medium text-foreground capitalize">
                  {filter}
                </span>
              </span>
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                Concept:{" "}
                <span className="font-medium text-foreground">
                  {tagFilter === "all" ? "All" : tagFilter}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quest Grid */}
        {loading ? (
          <div className="flex flex-col items-center gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-44 rounded-full border border-border bg-card/70 animate-pulse"
              >
                <div className="h-full w-full rounded-full border-[10px] border-transparent" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm text-center">{error}</p>
        ) : (
          <div className="relative w-full overflow-x-clip py-2">
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-full md:block">
              <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/20 to-primary/10" />
              <div className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center gap-8">
              {filteredQuests.map((quest, index) => (
                <div
                  key={quest.id}
                  className="relative w-full flex justify-center md:translate-x-[var(--wave-x)]"
                  style={
                    {
                      "--wave-x": `${getCosineOffset(index)}px`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-[4.5rem] hidden h-16 w-[min(24rem,55vw)] -translate-x-1/2 -translate-y-1/2 md:block"
                  >
                    <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 shadow-none backdrop-blur-md ring-1 ring-primary/10" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[2px]" />
                  </div>

                  <Link
                    to={quest.status !== "locked" ? `/quest/${quest.id}` : "#"}
                    className="w-full max-w-[560px]"
                  >
                    <QuestCard quest={quest} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Quests;
