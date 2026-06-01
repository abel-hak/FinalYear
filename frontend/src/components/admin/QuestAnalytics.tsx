import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { fetchAdminAnalytics, type AdminAnalyticsDto } from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const chartConfig = {
  completed: { label: "Completed", color: "hsl(var(--primary))" },
  failed: { label: "Failed", color: "hsl(var(--destructive))" },
  submissions: { label: "Submissions", color: "hsl(var(--primary))" },
  unique_users: { label: "Active Users", color: "hsl(var(--accent-foreground))" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "hsl(142, 76%, 36%)",
  Medium: "hsl(45, 93%, 47%)",
  Hard: "hsl(0, 84%, 60%)",
  Expert: "hsl(280, 70%, 50%)",
  Master: "hsl(38, 92%, 50%)",
};

export const QuestAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminAnalytics()
      .then((data) => { if (!cancelled) setAnalytics(data); })
      .catch((e) => {
        if (!cancelled) {
          toast({ title: "Failed to load analytics", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
        <div className="h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
        <div className="md:col-span-2 h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load analytics.</p>
      </div>
    );
  }

  const completionData = analytics.quest_completion.map((q) => {
    const attempts = q.completed + q.failed;
    const completedPct = attempts > 0 ? Math.round((q.completed / attempts) * 100) : 0;
    const failedPct = attempts > 0 ? Math.round((q.failed / attempts) * 100) : 0;
    return {
      name: q.quest_title,
      completedCount: q.completed,
      failedCount: q.failed,
      completedPct,
      failedPct,
      attempts,
    };
  }).sort((a, b) => a.completedPct - b.completedPct);

  const totalDifficulty = analytics.difficulty_distribution.reduce((s, d) => s + d.count, 0);
  const difficultyData = analytics.difficulty_distribution.map((d) => ({
    name: d.label,
    value: totalDifficulty > 0 ? Math.round((d.count / totalDifficulty) * 100) : 0,
    color: DIFFICULTY_COLORS[d.label] ?? "hsl(var(--muted-foreground))",
  }));

  const weeklyData = analytics.weekly_activity.map((d) => ({
    day: d.day,
    submissions: d.submissions,
    users: d.unique_users,
  }));

  const hasWeeklyActivity = weeklyData.some((d) => d.submissions > 0 || d.users > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl transition-all hover:bg-card/60">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Quest Breakdown</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Sorted from lowest to highest completion rate for faster triage.
              </p>
            </div>
            <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              {completionData.length} quests
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {completionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No quest attempts yet. Data appears as learners submit solutions.
            </p>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-3">
                {completionData.map((quest) => (
                  <div key={quest.name} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{quest.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{quest.completedCount}/{quest.attempts} attempts passed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">{quest.completedPct}%</div>
                        <p className="text-[11px] text-muted-foreground">{quest.failedPct}% failed</p>
                      </div>
                    </div>
                    <Progress value={quest.completedPct} className="mt-3 h-2 bg-secondary" />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{quest.attempts} attempts</span>
                      <span>{quest.failedCount} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl transition-all hover:bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Quest Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <p className="text-sm font-medium text-foreground">No quests yet</p>
                <p className="text-xs text-muted-foreground">Create quests to see how difficulty is distributed.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {difficultyData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card className="md:col-span-2 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl transition-all hover:bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {hasWeeklyActivity ? (
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="Submissions"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--accent-foreground))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent-foreground))" }}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-foreground">No activity in the last 7 days</p>
              <p className="text-xs text-muted-foreground">
                Submissions and active learners will appear here as people play.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
