import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, GripVertical, BookOpen, Edit3, ArrowUp, ArrowDown } from "lucide-react";
import { QuestEditorDialog } from "@/components/admin/QuestEditorDialog";
import { AiQuestGeneratorDialog } from "@/components/admin/AiQuestGeneratorDialog";
import { SHOW_AI_QUEST_DRAFT } from "@/lib/featureFlags";
import { createCreatorQuest, updateCreatorQuest, reorderCreatorPathQuests, fetchCreatorQuestDetail } from "@/api/backend";
import { motion } from "framer-motion";
import {
  generateCreatorQuestDraft,
  fetchCreatorLearningPaths,
  fetchCreatorPathQuests,
  fetchQuests,
  removeCreatorQuestFromPath,
  type AdminLearningPathDto,
  type AdminPathQuestDto,
  type QuestSummaryDto,
} from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

const CreatorDashboard = () => {
  const { toast } = useToast();
  const [paths, setPaths] = useState<AdminLearningPathDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [pathQuests, setPathQuests] = useState<Record<string, AdminPathQuestDto[]>>({});
  const [availableQuests, setAvailableQuests] = useState<QuestSummaryDto[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>("");
  const [draftPrefill, setDraftPrefill] = useState<any | null>(null);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiDraftLanguage, setAiDraftLanguage] = useState<string | null>(null);
  const [preselectedPathId, setPreselectedPathId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any | null>(null);

  const loadPaths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCreatorLearningPaths();
      setPaths(data);
    } catch (e) {
      toast({
        title: "Failed to load creator paths",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  useEffect(() => {
    // keep available quests cached when needed elsewhere
    fetchQuests().then((q) => setAvailableQuests(q)).catch(() => setAvailableQuests([]));
  }, []);

  const loadPathQuests = async (pathId: string) => {
    try {
      const data = await fetchCreatorPathQuests(pathId);
      setPathQuests((prev) => ({ ...prev, [pathId]: data }));
    } catch {
      setPathQuests((prev) => ({ ...prev, [pathId]: [] }));
    }
  };

  const handleExpand = (pathId: string) => {
    if (expandedPathId === pathId) {
      setExpandedPathId(null);
    } else {
      setExpandedPathId(pathId);
      loadPathQuests(pathId);
    }
  };

  // add-existing-quest-to-path flow removed; creators should create quests inside a path

  const handleRemoveQuest = async (pathId: string, questId: string) => {
    try {
      await removeCreatorQuestFromPath(pathId, questId);
      await loadPathQuests(pathId);
      await loadPaths();
      toast({ title: "Quest removed from path" });
    } catch (e) {
      toast({
        title: "Failed to remove quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const questLookup = useMemo(() => new Map(availableQuests.map((quest) => [quest.id, quest])), [availableQuests]);
  const assignedPathCount = paths.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary/80">Manage</p>
            <h1 className="text-3xl font-bold">Assigned learning paths</h1>
            <p className="text-muted-foreground mt-1">
              Manage the quests inside the learning paths assigned to you.
            </p>
          </div>

          <Card className="bg-card/50 border-border/50 shadow-xl">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Assigned path count</p>
                <p className="text-sm text-muted-foreground">
                  You can only edit the paths listed below.
                </p>
              </div>
              <Badge variant="outline" className="w-fit bg-primary/10 text-primary border-primary/20">
                {assignedPathCount} path{assignedPathCount === 1 ? "" : "s"}
              </Badge>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paths.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>You do not have any assigned paths yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {paths.map((path) => {
                const quests = pathQuests[path.id] ?? [];
                return (
                  <motion.div key={path.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-card/50 border-border/50 shadow-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="icon" onClick={() => handleExpand(path.id)}>
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{path.title}</h3>
                              <Badge variant="outline">Level {path.level}</Badge>
                              <Badge variant="outline">{(path.language ?? "python").toUpperCase()}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{path.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {SHOW_AI_QUEST_DRAFT ? (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPreselectedPathId(path.id);
                                  setAiDraftLanguage(path.language ?? "python");
                                  setAiDraftOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                AI Draft
                              </Button>
                            ) : null}
                            <Button variant="ghost" onClick={() => { setEditingQuest(null); setPreselectedPathId(path.id); setEditorOpen(true); }}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Quest
                            </Button>
                          </div>
                        </div>

                        {expandedPathId === path.id && (
                          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                            {quests.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No quests in this path yet.</p>
                            ) : (
                              quests.map((quest, idx) => (
                                <div key={quest.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3">
                                  <div>
                                    <p className="font-medium">{quest.quest_title}</p>
                                    <p className="text-xs text-muted-foreground">Order {quest.order_rank}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={async () => {
                                      // open editor in edit mode
                                      try {
                                        const q = await fetchCreatorQuestDetail(quest.quest_id);
                                        setEditingQuest(q);
                                        setEditorOpen(true);
                                      } catch (e) {
                                        toast({ title: "Failed to load quest for edit", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
                                      }
                                    }}>
                                      <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleRemoveQuest(path.id, quest.quest_id)}>
                                      Remove
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={async () => {
                                      if (idx === 0) return;
                                      const arr = [...quests];
                                      const target = idx - 1;
                                      const newArr = arr.slice();
                                      // swap order_ranks
                                      const a = newArr[idx];
                                      const b = newArr[target];
                                      const tmp = a.order_rank;
                                      a.order_rank = b.order_rank;
                                      b.order_rank = tmp;
                                      try {
                                        await reorderCreatorPathQuests(path.id, newArr.map((r) => ({ quest_id: r.quest_id, order_rank: r.order_rank })));
                                        await loadPathQuests(path.id);
                                        await loadPaths();
                                        toast({ title: "Reordered" });
                                      } catch (e) {
                                        toast({ title: "Failed to reorder", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
                                      }
                                    }}>
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={async () => {
                                      if (idx === quests.length - 1) return;
                                      const arr = [...quests];
                                      const target = idx + 1;
                                      const newArr = arr.slice();
                                      const a = newArr[idx];
                                      const b = newArr[target];
                                      const tmp = a.order_rank;
                                      a.order_rank = b.order_rank;
                                      b.order_rank = tmp;
                                      try {
                                        await reorderCreatorPathQuests(path.id, newArr.map((r) => ({ quest_id: r.quest_id, order_rank: r.order_rank })));
                                        await loadPathQuests(path.id);
                                        await loadPaths();
                                        toast({ title: "Reordered" });
                                      } catch (e) {
                                        toast({ title: "Failed to reorder", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
                                      }
                                    }}>
                                      <ArrowDown className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* Add-existing-quest flow removed for creators — quests must be created inside a path */}
      <QuestEditorDialog
        open={editorOpen}
        onOpenChange={(open) => setEditorOpen(open)}
        quest={editingQuest}
        nextOrderRank={availableQuests.length ? Math.max(...availableQuests.map((q) => q.order_rank)) + 1 : 1}
        onSaved={async () => {
          setEditorOpen(false);
          if (preselectedPathId) {
            await loadPathQuests(preselectedPathId);
          }
          setDraftPrefill(null);
          setPreselectedPathId(null);
          await loadPaths();
        }}
        createQuestFn={createCreatorQuest}
        updateQuestFn={updateCreatorQuest}
        prefill={draftPrefill}
        preselectedPathId={preselectedPathId}
      />

      {SHOW_AI_QUEST_DRAFT ? (
        <AiQuestGeneratorDialog
          open={aiDraftOpen}
          onOpenChange={setAiDraftOpen}
          language={aiDraftLanguage}
          generateDraft={generateCreatorQuestDraft}
          onDraft={(draft) => {
            setDraftPrefill({
              title: draft.title,
              description: draft.description,
              level: draft.level,
              initial_code: draft.initial_code,
              solution_code: draft.solution_code,
              explanation: draft.explanation,
              tags: draft.tags,
              expected_output: draft.expected_output,
            });
            setEditingQuest(null);
            setEditorOpen(true);
          }}
        />
      ) : null}
    </div>
  );
};

export default CreatorDashboard;