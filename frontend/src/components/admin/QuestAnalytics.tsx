import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const completionData = [
  { name: 'Variables', completed: 85, failed: 15 },
  { name: 'Loops', completed: 72, failed: 28 },
  { name: 'Functions', completed: 68, failed: 32 },
  { name: 'Arrays', completed: 55, failed: 45 },
  { name: 'Objects', completed: 48, failed: 52 },
  { name: 'Classes', completed: 35, failed: 65 },
];

const difficultyData = [
  { name: 'Easy', value: 45, color: 'hsl(142, 76%, 36%)' },
  { name: 'Medium', value: 35, color: 'hsl(45, 93%, 47%)' },
  { name: 'Hard', value: 20, color: 'hsl(0, 84%, 60%)' },
];

const weeklyActivityData = [
  { day: 'Mon', users: 120, quests: 340 },
  { day: 'Tue', users: 145, quests: 420 },
  { day: 'Wed', users: 132, quests: 380 },
  { day: 'Thu', users: 168, quests: 510 },
  { day: 'Fri', users: 155, quests: 470 },
  { day: 'Sat', users: 89, quests: 220 },
  { day: 'Sun', users: 95, quests: 250 },
];

const chartConfig = {
  completed: { label: 'Completed', color: 'hsl(var(--primary))' },
  failed: { label: 'Failed', color: 'hsl(var(--destructive))' },
  users: { label: 'Active Users', color: 'hsl(var(--primary))' },
  quests: { label: 'Quests Attempted', color: 'hsl(var(--accent))' },
};

export const QuestAnalytics = () => {
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
              <BarChart data={completionData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
          </div>
          <div className="flex justify-center gap-6 mt-2">
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
              <LineChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quests" 
                  stroke="hsl(var(--accent-foreground))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent-foreground))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
