import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BarChart3, 
  FileText, 
  Settings,
  TrendingUp,
  Trophy,
  Clock,
  Target
} from "lucide-react";
import Header from "@/components/Header";
import { UserProgressTable } from "@/components/admin/UserProgressTable";
import { QuestAnalytics } from "@/components/admin/QuestAnalytics";
import { ContentManagement } from "@/components/admin/ContentManagement";

const statsData = [
  { label: 'Total Users', value: '1,247', change: '+12%', icon: Users, color: 'text-blue-500' },
  { label: 'Quests Completed', value: '8,432', change: '+24%', icon: Trophy, color: 'text-yellow-500' },
  { label: 'Avg. Session Time', value: '18m', change: '+5%', icon: Clock, color: 'text-green-500' },
  { label: 'Completion Rate', value: '67%', change: '+8%', icon: Target, color: 'text-purple-500' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor learner progress and manage content
              </p>
            </div>
            <Button variant="outline" className="gap-2 w-fit">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      <div className="flex items-center gap-1 text-sm text-green-500">
                        <TrendingUp className="w-3 h-3" />
                        {stat.change}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">User Progress</h2>
                  <UserProgressTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <QuestAnalytics />
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Quest Management</h2>
                  <ContentManagement />
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
