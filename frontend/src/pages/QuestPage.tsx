import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Sparkles, 
  BookOpen,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Mascot from '@/components/Mascot';
import KnowledgeScroll from '@/components/KnowledgeScroll';
import ErrorExplanation from '@/components/ErrorExplanation';
import TimeoutNotification from '@/components/TimeoutNotification';
import { fetchQuestDetail, submitQuestSolution, requestAiHint, fetchHintRemaining } from '@/api/backend';

// Static hint/concept metadata keyed by backend quest id (or fallback)
const localQuestMeta: Record<
  string,
  {
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

type FeedbackState = 'none' | 'success' | 'error' | 'timeout';
type MascotMood = 'idle' | 'thinking' | 'celebrating' | 'sad' | 'encouraging' | 'happy';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [initialCode, setInitialCode] = useState<string>('');
  const [backendExplanation, setBackendExplanation] = useState<string | null>(null);
  const [backendExplanationUnlocked, setBackendExplanationUnlocked] = useState(false);
  const meta = id ? localQuestMeta[id] : undefined;

  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [output, setOutput] = useState('');
  const [showConcept, setShowConcept] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHintsRemaining, setAiHintsRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setAiHint(null);
        setAiHintsRemaining(null);
        const quest = await fetchQuestDetail(id);
        if (cancelled) return;
        setTitle(quest.title);
        setDescription(quest.description);
        setInitialCode(quest.initial_code);
        setCode(quest.initial_code);
        setBackendExplanation(quest.explanation ?? null);
        setBackendExplanationUnlocked(quest.explanation_unlocked);
        setLoadError(null);
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
      } else {
        setFeedback('error');
      }
      setOutput((result.stdout || '') + (result.stderr || ''));
      setIsTimerRunning(false);
    } catch (e: any) {
      setFeedback('error');
      setOutput(e.message ?? 'Submission failed');
    }
  };
  
  const handleReset = () => {
    setCode(initialCode);
    setFeedback('none');
    setOutput('');
    setAiHint(null);
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
      setAiHint(resp.hint);
      setAiHintsRemaining(resp.remaining);
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
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading quest...</p>
        </div>
      ) : loadError ? (
        <div className="container py-20 text-center">
          <p className="text-red-500 text-sm mb-4">{loadError}</p>
          <Link to="/quests">
            <Button variant="outline">Back to Quests</Button>
          </Link>
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
        {/* Back button */}
        <Link to="/quests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Quests
        </Link>
        
        {/* Quest Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            {meta && (
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant={
                    meta.difficulty === 'beginner'
                      ? 'success'
                      : meta.difficulty === 'intermediate'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {meta.difficulty}
                </Badge>
                <Badge variant="outline">{meta.category}</Badge>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h1>
          </div>
          {meta && (
            <Badge variant="gold" className="flex items-center gap-2 text-base px-4 py-2">
              <Sparkles className="w-4 h-4" />
              {meta.xp} XP
            </Badge>
          )}
        </div>
        
        <p className="text-muted-foreground mb-8 max-w-3xl">
          {description}
        </p>
        
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Code Editor - takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <CodeEditor
              code={code}
              onChange={setCode}
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
                
                {(meta || backendExplanation) && !showConcept && (
                  <Button 
                    variant="gold" 
                    className="w-full"
                    onClick={() => setShowConcept(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Unlock Knowledge Scroll
                  </Button>
                )}
                
                {showConcept && (meta || backendExplanation) && (
                  <KnowledgeScroll
                    concept={meta ? meta.category : "Quest concept"}
                    title={meta ? meta.conceptExplanation.title : "How this solution works"}
                    description={
                      meta
                        ? meta.conceptExplanation.content
                        : backendExplanation || "Here is an overview of what this code is supposed to do and why the correct solution works."
                    }
                    difficulty={meta ? meta.difficulty : "beginner"}
                    sections={[
                      {
                        title: "Understanding the Concept",
                        content:
                          meta
                            ? meta.conceptExplanation.content
                            : backendExplanation || "Review the problem description and compare it with your fixed code.",
                        codeExamples: [
                          {
                            title: "Example solution",
                            code: initialCode,
                            explanation: "One possible starting point or solution for this quest."
                          }
                        ]
                      }
                    ]}
                    relatedConcepts={['Python Basics', 'Error Handling', 'Best Practices']}
                  />
                )}
              </div>
            )}
            
            {feedback === 'error' && (
              <div className="space-y-4">
                <FeedbackPanel
                  type="error"
                  title="Not Quite Right"
                  message="The code still has issues. Check the output below and try again."
                  output={output}
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
                aiHint={aiHint}
                aiLoading={aiLoading}
                aiHintsRemaining={aiHintsRemaining}
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
