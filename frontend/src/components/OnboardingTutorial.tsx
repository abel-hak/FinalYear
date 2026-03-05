import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Code2, Bug, Trophy, Lightbulb, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Mascot from './Mascot';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  mascotMood: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'encouraging';
  mascotMessage: string;
  animation: 'bounce' | 'slide' | 'fade' | 'scale';
}

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to CodeQuest!",
    description: "Get ready to become a debugging master. I'm Bugsy, your coding companion, and I'll help you learn to squash bugs like a pro!",
    icon: <Sparkles className="w-12 h-12" />,
    mascotMood: 'celebrating',
    mascotMessage: "Let's go! 🚀",
    animation: 'bounce'
  },
  {
    title: "Find the Bugs",
    description: "Each quest presents you with broken code. Your mission is to identify what's wrong and fix it. Don't worry - I'll give you hints if you get stuck!",
    icon: <Bug className="w-12 h-12" />,
    mascotMood: 'thinking',
    mascotMessage: "Bugs beware! 🔍",
    animation: 'slide'
  },
  {
    title: "Write Your Fix",
    description: "Use the code editor to make your changes. It's just like a real coding environment - syntax highlighting and all!",
    icon: <Code2 className="w-12 h-12" />,
    mascotMood: 'encouraging',
    mascotMessage: "You've got this! 💪",
    animation: 'fade'
  },
  {
    title: "Use Hints Wisely",
    description: "Stuck? Use hints to get guidance. But remember - using fewer hints earns you more XP! Try to solve it yourself first.",
    icon: <Lightbulb className="w-12 h-12" />,
    mascotMood: 'thinking',
    mascotMessage: "Think first! 🤔",
    animation: 'scale'
  },
  {
    title: "Earn Rewards",
    description: "Complete quests to earn XP, level up, and unlock achievements. The more you practice, the better you'll become!",
    icon: <Trophy className="w-12 h-12" />,
    mascotMood: 'happy',
    mascotMessage: "Shiny rewards! ✨",
    animation: 'bounce'
  },
  {
    title: "Ready to Start?",
    description: "You're all set! Your first quest awaits. Remember, every bug you fix makes you a better programmer. Let's begin!",
    icon: <Rocket className="w-12 h-12" />,
    mascotMood: 'celebrating',
    mascotMessage: "Adventure awaits! 🎮",
    animation: 'scale'
  }
];

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getAnimationVariants = (animation: string) => {
    switch (animation) {
      case 'bounce':
        return {
          initial: { scale: 0, y: 50 },
          animate: { scale: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.5 } },
          exit: { scale: 0, y: -50 }
        };
      case 'slide':
        return {
          initial: { x: 100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -100, opacity: 0 }
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'scale':
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.5, opacity: 0 }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-2xl w-full bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Progress bar */}
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
              Skip Tutorial
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={getAnimationVariants(step.animation)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center"
            >
              {/* Mascot */}
              <div className="flex justify-center mb-6">
                <Mascot 
                  mood={step.mascotMood} 
                  message={step.mascotMessage}
                  size="lg"
                />
              </div>

              {/* Icon */}
              <motion.div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary mb-6"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {step.icon}
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-border bg-secondary/20 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted'
                }`}
                whileHover={{ scale: 1.3 }}
              />
            ))}
          </div>

          <Button
            variant="hero"
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingTutorial;
