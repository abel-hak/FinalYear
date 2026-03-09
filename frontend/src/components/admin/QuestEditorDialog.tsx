import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  createAdminQuest,
  updateAdminQuest,
  fetchTestCases,
  createTestCase,
  deleteTestCase,
  type AdminQuestDto,
  type TestCaseDto,
} from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

interface QuestEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: AdminQuestDto | null;
  nextOrderRank: number;
  onSaved: () => void;
  prefill?: Partial<{
    title: string;
    description: string;
    level: number;
    order_rank: number;
    initial_code: string;
    solution_code: string;
    explanation: string;
    tags: string[];
    expected_output: string;
  }> | null;
  suggestedExpectedOutput?: string;
  clearSuggestedExpectedOutput?: () => void;
}

export function QuestEditorDialog({
  open,
  onOpenChange,
  quest,
  nextOrderRank,
  onSaved,
  prefill = null,
  suggestedExpectedOutput,
  clearSuggestedExpectedOutput,
}: QuestEditorDialogProps) {
  const { toast } = useToast();
  const isEdit = !!quest;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(1);
  const [orderRank, setOrderRank] = useState(1);
  const [initialCode, setInitialCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [testCases, setTestCases] = useState<TestCaseDto[]>([]);
  const [testCasesOpen, setTestCasesOpen] = useState(false);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [newExpectedOutput, setNewExpectedOutput] = useState("");
  const [newIsHidden, setNewIsHidden] = useState(false);

  useEffect(() => {
    if (open) {
      if (quest) {
        setTitle(quest.title);
        setDescription(quest.description);
        setLevel(quest.level);
        setOrderRank(quest.order_rank);
        setInitialCode(quest.initial_code);
        setSolutionCode(quest.solution_code);
        setExplanation(quest.explanation ?? "");
        setTags((quest.tags ?? []).join(", "));
        loadTestCases(quest.id);
      } else {
        setTitle(prefill?.title ?? "");
        setDescription(prefill?.description ?? "");
        setLevel(prefill?.level ?? 1);
        setOrderRank(prefill?.order_rank ?? nextOrderRank);
        setInitialCode(prefill?.initial_code ?? "");
        setSolutionCode(prefill?.solution_code ?? "");
        setExplanation(prefill?.explanation ?? "");
        setTags((prefill?.tags ?? []).join(", "));
        setTestCases([]);
      }
      setNewExpectedOutput(suggestedExpectedOutput ?? prefill?.expected_output ?? "");
      setNewIsHidden(false);
    }
  }, [open, quest, nextOrderRank, prefill, suggestedExpectedOutput]);

  const parsedTags = () =>
    tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

  const loadTestCases = async (questId: string) => {
    setLoadingTestCases(true);
    try {
      const data = await fetchTestCases(questId);
      setTestCases(data);
    } catch (e) {
      toast({
        title: "Failed to load test cases",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // If user has entered expected output but didn't click +, add it now
      if (isEdit && quest && newExpectedOutput.trim()) {
        try {
          const tc = await createTestCase(quest.id, {
            expected_output: newExpectedOutput.trim(),
            is_hidden: newIsHidden,
          });
          setTestCases((prev) => [...prev, tc]);
          setNewExpectedOutput("");
          setNewIsHidden(false);
        } catch (e) {
          toast({
            title: "Failed to add test case",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      if (isEdit && quest) {
        await updateAdminQuest(quest.id, {
          title: title.trim(),
          description: description.trim(),
          level,
          order_rank: orderRank,
          initial_code: initialCode.trim(),
          solution_code: solutionCode.trim(),
          explanation: explanation.trim(),
          tags: parsedTags(),
        });
        toast({ title: "Quest updated successfully" });
      } else {
        const created = await createAdminQuest({
          title: title.trim(),
          description: description.trim(),
          level,
          order_rank: orderRank,
          initial_code: initialCode.trim(),
          solution_code: solutionCode.trim(),
          explanation: explanation.trim(),
          tags: parsedTags(),
        });
        // If expected output is filled, create first test case for the new quest.
        if (newExpectedOutput.trim()) {
          try {
            await createTestCase(created.id, {
              expected_output: newExpectedOutput.trim(),
              is_hidden: newIsHidden,
            });
          } catch (e) {
            toast({
              title: "Quest created, but test case failed",
              description: e instanceof Error ? e.message : "Unknown error",
              variant: "destructive",
            });
          }
        }
        toast({ title: "Quest created successfully" });
      }
      onSaved();
      onOpenChange(false);
      clearSuggestedExpectedOutput?.();
    } catch (e) {
      toast({
        title: isEdit ? "Failed to update quest" : "Failed to create quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestCase = async () => {
    if (!quest || !newExpectedOutput.trim()) return;
    try {
      const tc = await createTestCase(quest.id, {
        expected_output: newExpectedOutput.trim(),
        is_hidden: newIsHidden,
      });
      setTestCases((prev) => [...prev, tc]);
      setNewExpectedOutput("");
      setNewIsHidden(false);
      toast({ title: "Test case added" });
    } catch (e) {
      toast({
        title: "Failed to add test case",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestCase = async (tc: TestCaseDto) => {
    try {
      await deleteTestCase(tc.id);
      setTestCases((prev) => prev.filter((t) => t.id !== tc.id));
      toast({ title: "Test case deleted" });
    } catch (e) {
      toast({
        title: "Failed to delete test case",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Quest" : "Create Quest"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quest title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quest description"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. loops, range, conditions"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                min={1}
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orderRank">Order rank</Label>
              <Input
                id="orderRank"
                type="number"
                min={1}
                value={orderRank}
                onChange={(e) => setOrderRank(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initialCode">Initial code</Label>
            <Textarea
              id="initialCode"
              value={initialCode}
              onChange={(e) => setInitialCode(e.target.value)}
              placeholder="# Starter code for the learner"
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="solutionCode">Solution code</Label>
            <Textarea
              id="solutionCode"
              value={solutionCode}
              onChange={(e) => setSolutionCode(e.target.value)}
              placeholder="# Reference solution"
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="explanation">Explanation</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explanation shown after completion"
              rows={4}
            />
          </div>

          {isEdit && quest && (
            <Collapsible open={testCasesOpen} onOpenChange={setTestCasesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Test cases ({testCases.length})</span>
                  {testCasesOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {loadingTestCases ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {testCases.map((tc) => (
                        <div
                          key={tc.id}
                          className="flex items-center justify-between gap-2 rounded border p-3 bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <code className="text-sm break-all">
                              {tc.expected_output || "(empty)"}
                            </code>
                            {tc.is_hidden && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (hidden)
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTestCase(tc)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Add expected output, then click + to add each test case.
                      </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Expected output (e.g. Hello World)"
                        value={newExpectedOutput}
                        onChange={(e) => setNewExpectedOutput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTestCase();
                          }
                        }}
                      />
                      <label className="flex items-center gap-2 shrink-0">
                        <Checkbox
                          checked={newIsHidden}
                          onCheckedChange={(c) => setNewIsHidden(!!c)}
                        />
                        <span className="text-sm">Hidden</span>
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddTestCase}
                        disabled={!newExpectedOutput.trim()}
                        title="Add test case"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="sr-only">Add test case</span>
                      </Button>
                    </div>
                    </div>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
