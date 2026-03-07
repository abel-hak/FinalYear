import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Search,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchAdminQuests,
  createAdminQuest,
  updateAdminQuest,
  deleteAdminQuest,
  type AdminQuestDto,
} from "@/api/backend";
import { QuestEditorDialog } from "./QuestEditorDialog";
import { useToast } from "@/components/ui/use-toast";

const levelLabels: Record<number, string> = {
  1: "easy",
  2: "medium",
  3: "hard",
  4: "expert",
  5: "master",
};

const levelColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-600 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-600 border-red-500/20",
  expert: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  master: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export const ContentManagement = () => {
  const { toast } = useToast();
  const [quests, setQuests] = useState<AdminQuestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<AdminQuestDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminQuestDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminQuests();
      setQuests(data);
    } catch (e) {
      toast({
        title: "Failed to load quests",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const activeQuests = quests.filter((q) => !q.is_deleted);
  const filteredQuests = activeQuests.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const nextOrderRank =
    activeQuests.length > 0
      ? Math.max(...activeQuests.map((q) => q.order_rank)) + 1
      : 1;

  const handleCreate = () => {
    setEditingQuest(null);
    setEditorOpen(true);
  };

  const handleEdit = (quest: AdminQuestDto) => {
    setEditingQuest(quest);
    setEditorOpen(true);
  };

  const handleDuplicate = async (quest: AdminQuestDto) => {
    try {
      const created = await createAdminQuest({
        title: `${quest.title} (Copy)`,
        description: quest.description,
        level: quest.level,
        order_rank: nextOrderRank,
        initial_code: quest.initial_code,
        solution_code: quest.solution_code,
        explanation: quest.explanation ?? "",
      });
      setQuests((prev) => [...prev, created]);
      toast({ title: "Quest duplicated" });
    } catch (e) {
      toast({
        title: "Failed to duplicate quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminQuest(deleteTarget.id);
      setQuests((prev) =>
        prev.map((q) =>
          q.id === deleteTarget.id ? { ...q, is_deleted: true } : q
        )
      );
      toast({ title: "Quest deleted" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Failed to delete quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const levelLabel = (level: number) =>
    levelLabels[level] ?? `level ${level}`;
  const levelColor = (level: number) =>
    levelColors[levelLabel(level)] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Quest
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium truncate">{quest.title}</h3>
                        <Badge
                          variant="outline"
                          className={levelColor(quest.level)}
                        >
                          {levelLabel(quest.level)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Order: {quest.order_rank}</span>
                        <span>Level {quest.level}</span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleEdit(quest)}
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleDuplicate(quest)}
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(quest)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            {searchQuery
              ? "No quests found matching your search."
              : "No quests yet. Create your first quest!"}
          </p>
        </div>
      )}

      <QuestEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        quest={editingQuest}
        nextOrderRank={nextOrderRank}
        onSaved={loadQuests}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quest?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete &quot;{deleteTarget?.title}&quot;. You can
              restore it later from the database if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
