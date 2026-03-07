import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
    const total = q.completed + q.failed;
    const completedPct = total > 0 ? Math.round((q.completed / total) * 100) : 0;
    const failedPct = total > 0 ? Math.round((q.failed / total) * 100) : 0;
    return {
      name: q.quest_title,
      completed: completedPct,
      failed: failedPct,
      total,
    };
  });

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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Quest Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quest Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Completed %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card>
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
              <p className="text-sm text-muted-foreground">No quests yet</p>
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
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};
