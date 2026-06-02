import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BarChart3, 
  FileText, 
  Trophy,
  Target,
  Loader2,
  BookOpen
} from "lucide-react";
import Header from "@/components/Header";
import { UserProgressTable } from "@/components/admin/UserProgressTable";
import { QuestAnalytics } from "@/components/admin/QuestAnalytics";
import { PathManagement } from "@/components/admin/PathManagement";
import { fetchAdminStats, type AdminStatsDto } from "@/api/backend";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.total_users.toLocaleString(),
          icon: Users,
          gradient: 'from-sky-500/15 via-cyan-500/10 to-transparent',
          accent: 'text-cyan-500',
          border: 'border-cyan-500/25',
        },
        {
          label: 'Quests Completed',
          value: stats.quests_completed.toLocaleString(),
          icon: Trophy,
          gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
          accent: 'text-amber-500',
          border: 'border-amber-500/25',
        },
        {
          label: 'Total Quests',
          value: stats.total_quests.toLocaleString(),
          icon: FileText,
          gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
          accent: 'text-emerald-500',
          border: 'border-emerald-500/25',
        },
        {
          label: 'Completion Rate',
          value: `${stats.completion_rate_pct}%`,
          icon: Target,
          gradient: 'from-fuchsia-500/15 via-pink-500/10 to-transparent',
          accent: 'text-fuchsia-500',
          border: 'border-fuchsia-500/25',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor learner progress and manage content
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden ${stat.border} bg-card/60 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-100`} />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-foreground/5 backdrop-blur-sm border border-border/60">
                          <stat.icon className={`w-6 h-6 ${stat.accent}`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-3xl font-bold tracking-tight text-foreground mb-1">{stat.value}</p>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="paths" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Paths</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">User Progress</h2>
                  <UserProgressTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 focus-visible:outline-none">
              <QuestAnalytics />
            </TabsContent>

            <TabsContent value="paths" className="space-y-4 focus-visible:outline-none">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Learning Paths
                  </h2>
                  <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                    Create and maintain paths here. Quest changes happen only inside a path, and you can invite a creator by email while editing the path details.
                  </p>
                  <PathManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
