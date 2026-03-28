import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Search, Loader2, UserMinus } from "lucide-react";
import { fetchAdminUsers, removeAdminUser, type AdminUserProgressDto } from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export const UserProgressTable = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<AdminUserProgressDto | null>(null);
  const [removing, setRemoving] = useState(false);

  const refreshUsers = () => {
    fetchAdminUsers()
      .then(setUsers)
      .catch((e) => {
        toast({ title: "Failed to load users", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      });
  };

  useEffect(() => {
    let cancelled = false;
    fetchAdminUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((e) => {
        if (!cancelled) {
          toast({ title: "Failed to load users", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeAdminUser(removeTarget.id);
      toast({ title: "Learner removed", description: `${removeTarget.username} has been removed.` });
      setRemoveTarget(null);
      refreshUsers();
    } catch (e) {
      toast({ title: "Failed to remove learner", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
            <div className="h-12 border-b border-border bg-muted/20" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center h-16 border-b border-border/50 px-4 gap-4 animate-pulse bg-card/50">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="w-32 h-2 bg-muted rounded-full" />
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="md:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg border bg-card p-4 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const pct = user.total_quests > 0 ? (user.quests_completed / user.total_quests) * 100 : 0;
                  return (
                    <TableRow key={user.id} className="hover:bg-primary/5 transition-colors border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-foreground">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 w-[200px]">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{user.quests_completed}/{user.total_quests} quests</span>
                            <span className="font-medium">{Math.round(pct)}%</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-secondary" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-500">{user.xp_earned.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{formatLastActive(user.last_active)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => setRemoveTarget(user)}
                          title="Remove learner"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => {
              const pct = user.total_quests > 0 ? (user.quests_completed / user.total_quests) * 100 : 0;
              return (
                <div key={user.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{user.quests_completed}/{user.total_quests} ({Math.round(pct)}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{user.xp_earned.toLocaleString()} XP</span>
                    <span className="text-muted-foreground">{formatLastActive(user.last_active)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => setRemoveTarget(user)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{searchQuery ? "No users match your search." : "No learners yet."}</p>
        </div>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove learner?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `This will remove ${removeTarget.username} (${removeTarget.email}) from the platform. They will no longer be able to log in. This action can be reversed by an administrator.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveConfirm();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
