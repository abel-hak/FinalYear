import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import HintPanel from '@/components/HintPanel';
import FeedbackPanel from '@/components/FeedbackPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Sparkles, 
  BookOpen,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Mascot from '@/components/Mascot';
import KnowledgeScroll from '@/components/KnowledgeScroll';
import ErrorExplanation from '@/components/ErrorExplanation';
import TimeoutNotification from '@/components/TimeoutNotification';
import { fetchQuestDetail, submitQuestSolution, requestAiHint, fetchHintRemaining, explainFailure } from '@/api/backend';
import confetti from 'canvas-confetti';

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    
    // Quick C major arpeggio
    osc.frequency.setValueAtTime(523.25, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.frequency.setValueAtTime(659.25, now + 0.15);
    gainNode.gain.setValueAtTime(0.3, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.frequency.setValueAtTime(783.99, now + 0.3);
    gainNode.gain.setValueAtTime(0.3, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {
    // Ignore audio errors
  }
};

const playErrorSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sawtooth';
    const now = audioCtx.currentTime;
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // Ignore audio errors
  }
};

// Static hint/concept metadata keyed by backend quest id (or fallback)
const localQuestMeta: Record<
  string,
  {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    xp: number;
    errorMessage: string;
    errorLine: number;
    hints: string[];
    conceptExplanation: { title: string; content: string };
  }
> = {
  '1': {
    title: 'The Missing Variable',
    description: 'A variable is referenced before being defined. Find and fix the NameError to make the program run correctly.',
    difficulty: 'beginner' as const,
    category: 'Variables',
    xp: 50,
    errorLine: 3,
    errorMessage: "NameError: name 'price' is not defined",
    hints: [
      "Look at the order in which variables are used and defined.",
      "In Python, you must define a variable before you can use it.",
      "The variable 'price' is used on line 3, but where is it defined?"
    ],
    conceptExplanation: {
      title: "Variable Declaration Order",
      content: "In Python, variables must be defined before they are used. Unlike some other languages, Python doesn't 'hoist' variable declarations. When the interpreter reaches line 3, it tries to evaluate 'price * (1 + tax_rate)', but 'price' hasn't been defined yet, causing a NameError."
    }
  },
  '2': {
    title: 'Loop Gone Wrong',
    description: 'An infinite loop is crashing the program. Debug the while condition to fix the logic.',
    difficulty: 'beginner' as const,
    category: 'Loops',
    xp: 75,
    errorLine: 6,
    errorMessage: "TimeoutError: Code execution exceeded 5 seconds (infinite loop detected)",
    hints: [
      "What happens to 'count' each time the loop runs?",
      "For a countdown, should count increase or decrease?",
      "The loop condition checks if count > 0. Will this ever become false with the current update?"
    ],
    conceptExplanation: {
      title: "Infinite Loops",
      content: "An infinite loop occurs when the loop's termination condition can never become false. In this case, 'count' was increasing instead of decreasing, so 'count > 0' would always be true. Always ensure your loop's body modifies variables in a way that eventually makes the condition false."
    }
  }
};

type FeedbackState = 'none' | 'success' | 'error' | 'timeout' | 'system_busy';
type MascotMood = 'idle' | 'thinking' | 'celebrating' | 'sad' | 'encouraging' | 'happy';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [initialCode, setInitialCode] = useState<string>('');
  const [backendExplanation, setBackendExplanation] = useState<string | null>(null);
  const [backendExplanationUnlocked, setBackendExplanationUnlocked] = useState(false);
  const [prevQuestId, setPrevQuestId] = useState<string | null>(null);
  const [nextQuestId, setNextQuestId] = useState<string | null>(null);
  const [questLevel, setQuestLevel] = useState<number>(1);
  const [questTags, setQuestTags] = useState<string[]>([]);
  const meta = id ? localQuestMeta[id] : undefined;

  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [output, setOutput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState<string | null>(null);
  const [actualOutput, setActualOutput] = useState<string | null>(null);
  const [failureExplanation, setFailureExplanation] = useState<{
    what_it_does: string;
    why_wrong: string;
    next_action: string;
  } | null>(null);
  const [failureExplainLoading, setFailureExplainLoading] = useState(false);
  const [failureExplainError, setFailureExplainError] = useState<string | null>(null);
  const [showConcept, setShowConcept] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [aiHints, setAiHints] = useState<{ number: number; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHintsRemaining, setAiHintsRemaining] = useState<number | null>(null);
  const [aiHintLimit, setAiHintLimit] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setAiHints([]);
        setAiHintsRemaining(null);
        const quest = await fetchQuestDetail(id);
        if (cancelled) return;
        setTitle(quest.title);
        setDescription(quest.description);
        setInitialCode(quest.initial_code);
        setCode(quest.initial_code);
        setBackendExplanation(quest.explanation ?? null);
        setBackendExplanationUnlocked(quest.explanation_unlocked);
        setPrevQuestId(quest.prev_id ?? null);
        setNextQuestId(quest.next_id ?? null);
        setQuestLevel(quest.level ?? 1);
        setQuestTags(Array.isArray(quest.tags) ? quest.tags : []);
        setLoadError(null);
        setFeedback('none');
        setOutput('');
        setShowConcept(false);
        const { remaining } = await fetchHintRemaining(id);
        if (!cancelled) setAiHintsRemaining(remaining);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e.message ?? 'Failed to load quest');
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
  }, [id]);

  // Update mascot based on state
  useEffect(() => {
    if (feedback === 'success') {
      setMascotMood('celebrating');
      setMascotMessage("🎉 Amazing! You squashed that bug!");
    } else if (feedback === 'error') {
      setMascotMood('encouraging');
      setMascotMessage("Don't give up! Check the hints if you're stuck.");
    } else if (feedback === 'system_busy') {
      setMascotMood('encouraging');
      setMascotMessage("The system is a bit busy. Try again in a moment!");
    } else if (feedback === 'timeout') {
      setMascotMood('sad');
      setMascotMessage("Time's running short! Need a hint?");
    }
  }, [feedback]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setFeedback('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);
  
  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Quest Not Found</h1>
          <Link to="/quests">
            <Button variant="outline">Back to Quests</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const handleRun = async () => {
    if (!id) return;
    setMascotMood('thinking');
    setMascotMessage("Let me check your code...");
    try {
      const result = await submitQuestSolution(id, code);
      if (result.passed) {
        setFeedback('success');
        playSuccessSound();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#eab308']
        });
        // Refresh quest detail so navigation updates (next quest becomes unlocked/current).
        try {
          const q = await fetchQuestDetail(id);
          setPrevQuestId(q.prev_id ?? null);
          setNextQuestId(q.next_id ?? null);
          setBackendExplanation(q.explanation ?? null);
          setBackendExplanationUnlocked(q.explanation_unlocked);
        } catch {
          // Ignore refresh errors; success state already shown.
        }
      } else {
        setFeedback('error');
        playErrorSound();
      }
      // Show expected vs actual on failure (first non-hidden failing test case)
      if (!result.passed) {
        const firstFail = (result.test_results ?? []).find((t) => !t.passed && !t.is_hidden);
        setExpectedOutput(firstFail?.expected_output ?? null);
        setActualOutput(result.actual_output ?? null);
        setFailureExplanation(null);
        setFailureExplainError(null);
      } else {
        setExpectedOutput(null);
        setActualOutput(null);
        setFailureExplanation(null);
        setFailureExplainError(null);
      }
      setOutput((result.stdout || '') + (result.stderr || ''));
      setIsTimerRunning(false);
    } catch (e: any) {
      const msg = e.message ?? 'Submission failed';
      if (msg.includes('System Busy')) {
        setFeedback('system_busy');
        setOutput(msg);
      } else {
        setFeedback('error');
        setOutput(msg);
      }
    }
  };
  
  const handleReset = () => {
    setCode(initialCode);
    setFeedback('none');
    setOutput('');
    setExpectedOutput(null);
    setActualOutput(null);
    setFailureExplanation(null);
    setFailureExplainError(null);
      setAiHints([]);
    setAiError(null);
    setShowConcept(false);
    setMascotMood('idle');
    setMascotMessage("Fresh start! You've got this!");
    setTimeRemaining(300);
    setIsTimerRunning(true);
  };

  const handleTimeoutContinue = () => {
    setFeedback('none');
    setTimeRemaining(180); // Give 3 more minutes
    setIsTimerRunning(true);
    setMascotMood('encouraging');
    setMascotMessage("Extra time granted! Let's do this!");
  };

  const handleExplainFailure = async () => {
    if (!id || !expectedOutput || !actualOutput) return;
    try {
      setFailureExplainLoading(true);
      setFailureExplainError(null);
      const resp = await explainFailure({
        quest_id: id,
        code,
        expected_output: expectedOutput,
        actual_output: actualOutput,
        stderr: output,
      });
      setFailureExplanation(resp);
    } catch (e: any) {
      setFailureExplainError(e.message ?? "AI explanation failed");
    } finally {
      setFailureExplainLoading(false);
    }
  };

  const handleAskAiHint = async () => {
    if (!id) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const resp = await requestAiHint({
        questId: id,
        code,
        lastOutput: output || null,
      });
      setAiHints((prev) => {
        const next = [...prev];
        next.push({ number: resp.hint_number ?? next.length + 1, text: resp.hint });
        return next;
      });
      setAiHintsRemaining(resp.remaining);
      setAiHintLimit(resp.limit ?? null);
    } catch (e: any) {
      setAiError(e.message ?? "AI hint failed");
      if (e.message?.includes("No hints remaining") || e.message?.includes("limit")) {
        setAiHintsRemaining(0);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {loading ? (
        <div className="container py-8">
          {/* Skeleton loader */}
          <div className="h-5 w-24 rounded-full bg-muted animate-pulse mb-6" />
          <div className="h-8 w-64 rounded-lg bg-muted animate-pulse mb-3" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 rounded-xl bg-muted animate-pulse" />
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      ) : loadError ? (
        <div className="container py-20 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border max-w-sm">
            <XCircle className="w-12 h-12 text-red-400" />
            <p className="text-foreground font-semibold">Couldn't load quest</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Link to="/quests">
              <Button variant="outline" className="gap-2"><ChevronLeft className="w-4 h-4" />Back to Quests</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Animated Mascot */}
          <div className="fixed bottom-6 right-6 z-40">
            <Mascot 
              mood={mascotMood}
              message={mascotMessage}
            />
          </div>
          
          {/* Timer display in header area */}
          <div className="fixed top-20 right-6 z-40">
            <TimeoutNotification
              timeLimit={300}
              onTimeout={() => setFeedback('timeout')}
              onExtend={() => setTimeRemaining(prev => prev + 60)}
            />
          </div>
          
          <main className="container py-6">
        {/* Back button and quest navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/quests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Quests
          </Link>
          {(prevQuestId || nextQuestId) && (
            <div className="flex items-center gap-2">
              {prevQuestId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/quest/${prevQuestId}`)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              {nextQuestId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/quest/${nextQuestId}`)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Quest Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={
                  questLevel <= 1 ? 'success' : questLevel === 2 ? 'warning' : 'destructive'
                }
              >
                {questLevel <= 1 ? 'Beginner' : questLevel === 2 ? 'Intermediate' : 'Advanced'}
              </Badge>
              {questTags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h1>
          </div>
          <Badge variant="gold" className="flex items-center gap-2 text-base px-4 py-2 shrink-0">
            <Sparkles className="w-4 h-4" />
            {questLevel <= 1 ? 50 : questLevel === 2 ? 75 : 100} XP
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-6 max-w-3xl">
          {description}
        </p>
        
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Code Editor - takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <CodeEditor
              code={code}
              onChange={setCode}
              onRun={handleRun}
              errorLine={feedback === 'error' && meta ? meta.errorLine : undefined}
            />
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button variant="hero" onClick={handleRun} className="flex-1 sm:flex-none">
                <Play className="w-4 h-4 mr-2" />
                Run Code
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            {/* Feedback Panel */}
            {feedback === 'success' && (
              <div className="space-y-4">
                <FeedbackPanel
                  type="success"
                  title="Quest Completed!"
                  message="Excellent work! You've successfully fixed the bug."
                  output={output}
                />
                
                {(prevQuestId || nextQuestId) && (
                  <div className="flex items-center gap-3">
                    {prevQuestId && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/quest/${prevQuestId}`)}
                        className="flex-1"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous Quest
                      </Button>
                    )}
                    {nextQuestId && (
                      <Button
                        variant="hero"
                        onClick={() => navigate(`/quest/${nextQuestId}`)}
                        className="flex-1"
                      >
                        Next Quest
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
                
                {!showConcept && (
                  <Button 
                    variant="gold" 
                    className="w-full"
                    onClick={() => setShowConcept(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Unlock Knowledge Scroll
                  </Button>
                )}
                
                {showConcept && (
                  <KnowledgeScroll
                    concept={meta ? meta.category : (questTags[0] ?? `Level ${questLevel}`)}
                    title={meta ? meta.conceptExplanation.title : "What you learned"}
                    description={
                      meta
                        ? meta.conceptExplanation.content
                        : backendExplanation || `You just solved: "${title}". Here's the core idea behind the fix and how to apply it again.`
                    }
                    difficulty={
                      meta
                        ? meta.difficulty
                        : questLevel <= 1
                          ? "beginner"
                          : questLevel === 2
                            ? "intermediate"
                            : "advanced"
                    }
                    sections={[
                      {
                        title: "Understanding the concept",
                        content:
                          meta
                            ? meta.conceptExplanation.content
                            : backendExplanation || "Review the problem description and compare it with your fixed code. Focus on what caused the failure and what change made the program behave correctly.",
                        codeExamples: [
                          {
                            title: "Example solution",
                            code: initialCode,
                            explanation: "One possible starting point or solution for this quest."
                          }
                        ]
                      },
                      ...(meta
                        ? []
                        : [
                            {
                              title: "How to remember it",
                              content:
                                "When debugging, isolate the smallest change that fixes the behavior. Use prints or quick checks to confirm your assumptions, and re-run tests after each change.",
                            },
                          ]),
                    ]}
                    relatedConcepts={
                      questTags.length > 0
                        ? questTags
                        : ['Python Basics', 'Debugging', 'Error Handling', 'Best Practices']
                    }
                  />
                )}
              </div>
            )}
            
            {feedback === 'system_busy' && (
              <FeedbackPanel
                type="info"
                title="System Busy"
                message="We're experiencing high load. Please try again in a moment."
                output={output}
              />
            )}
            {feedback === 'error' && (
              <div className="space-y-4">
                <FeedbackPanel
                  type="error"
                  title="Not Quite Right"
                  message="The code still has issues. Check the output below and try again."
                  output={output}
                  expectedOutput={expectedOutput}
                  actualOutput={actualOutput}
                  extraContent={
                    expectedOutput && actualOutput ? (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExplainFailure}
                          disabled={failureExplainLoading}
                        >
                          {failureExplainLoading ? "Asking AI to explain..." : "Ask AI to explain this failure"}
                        </Button>
                        {failureExplainError && (
                          <p className="text-xs text-red-400">{failureExplainError}</p>
                        )}
                        {failureExplanation && (
                          <div className="p-4 rounded-lg border border-border bg-card space-y-2 text-sm">
                            <p><span className="font-semibold">What your code does now:</span> {failureExplanation.what_it_does}</p>
                            <p><span className="font-semibold">Why this is wrong:</span> {failureExplanation.why_wrong}</p>
                            <p><span className="font-semibold">Next action:</span> {failureExplanation.next_action}</p>
                          </div>
                        )}
                      </div>
                    ) : null
                  }
                />
                {meta && (
                  <ErrorExplanation
                    errorType="Error"
                    errorMessage={meta.errorMessage}
                    lineNumber={meta.errorLine}
                    explanation="This error occurs when your code does not match the expected behavior yet."
                    commonCauses={[
                      "Logic bug in the code",
                      "Variables defined in the wrong order",
                      "Loop condition never becomes false"
                    ]}
                    suggestedFix="Review the hints and adjust the code accordingly."
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar - Hints */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-xl bg-card border border-border space-y-2">
              {aiError && (
                <p className="text-xs text-red-400">{aiError}</p>
              )}
              <HintPanel
                hints={meta?.hints ?? []}
                aiHints={aiHints}
                aiLoading={aiLoading}
                aiHintsRemaining={aiHintsRemaining}
                aiHintLimit={aiHintLimit}
                onAskAiHint={handleAskAiHint}
              />
            </div>
          </div>
        </div>
          </main>
        </>
      )}
    </div>
  );
};

export default QuestPage;
