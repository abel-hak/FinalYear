import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, Pause, Play, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Mascot from './Mascot';

interface TimeoutNotificationProps {
  timeLimit: number; // in seconds
  onTimeout: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExtend?: () => void;
  isPaused?: boolean;
  warningThreshold?: number; // percentage of time remaining to show warning
  criticalThreshold?: number; // percentage for critical warning
}

const TimeoutNotification: React.FC<TimeoutNotificationProps> = ({
  timeLimit,
  onTimeout,
  onPause,
  onResume,
  onExtend,
  isPaused = false,
  warningThreshold = 30,
  criticalThreshold = 10
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'warning' | 'critical' | 'timeout'>('warning');
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownCritical, setHasShownCritical] = useState(false);

  const percentageRemaining = (timeRemaining / timeLimit) * 100;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setNotificationType('timeout');
          setShowNotification(true);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeout]);

  useEffect(() => {
    if (percentageRemaining <= criticalThreshold && percentageRemaining > 0 && !hasShownCritical) {
      setNotificationType('critical');
      setShowNotification(true);
      setHasShownCritical(true);
    } else if (percentageRemaining <= warningThreshold && percentageRemaining > criticalThreshold && !hasShownWarning) {
      setNotificationType('warning');
      setShowNotification(true);
      setHasShownWarning(true);
    }
  }, [percentageRemaining, warningThreshold, criticalThreshold, hasShownCritical, hasShownWarning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (percentageRemaining <= criticalThreshold) return 'bg-destructive';
    if (percentageRemaining <= warningThreshold) return 'bg-warning';
    return 'bg-primary';
  };

  const getMascotMood = () => {
    if (notificationType === 'timeout') return 'sad';
    if (notificationType === 'critical') return 'encouraging';
    return 'thinking';
  };

  return (
    <>
      {/* Timer Display */}
      <motion.div
        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${
          percentageRemaining <= criticalThreshold
            ? 'bg-destructive/10 border-destructive/30'
            : percentageRemaining <= warningThreshold
            ? 'bg-warning/10 border-warning/30'
            : 'bg-secondary/50 border-border'
        }`}
        animate={percentageRemaining <= criticalThreshold ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Clock className={`w-5 h-5 ${
          percentageRemaining <= criticalThreshold
            ? 'text-destructive'
            : percentageRemaining <= warningThreshold
            ? 'text-warning'
            : 'text-muted-foreground'
        }`} />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-mono font-bold ${
              percentageRemaining <= criticalThreshold
                ? 'text-destructive'
                : percentageRemaining <= warningThreshold
                ? 'text-warning'
                : 'text-foreground'
            }`}>
              {formatTime(timeRemaining)}
            </span>
            <div className="flex gap-1">
              {onPause && onResume && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={isPaused ? onResume : onPause}
                >
                  {isPaused ? (
                    <Play className="w-3 h-3" />
                  ) : (
                    <Pause className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor()}`}
              initial={{ width: '100%' }}
              animate={{ width: `${percentageRemaining}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative max-w-md w-full rounded-2xl border overflow-hidden shadow-2xl ${
                notificationType === 'timeout'
                  ? 'bg-destructive/5 border-destructive/30'
                  : notificationType === 'critical'
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-warning/5 border-warning/30'
              }`}
            >
              {/* Close button */}
              {notificationType !== 'timeout' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setShowNotification(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <div className="p-6 text-center">
                {/* Mascot */}
                <div className="flex justify-center mb-4">
                  <Mascot 
                    mood={getMascotMood()} 
                    message={
                      notificationType === 'timeout' 
                        ? "Time's up! 😢" 
                        : notificationType === 'critical'
                        ? "Hurry! ⏰"
                        : "Almost there! 💪"
                    }
                    size="md"
                  />
                </div>

                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    notificationType === 'timeout' || notificationType === 'critical'
                      ? 'bg-destructive/20'
                      : 'bg-warning/20'
                  }`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {notificationType === 'timeout' ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : (
                    <Clock className={`w-8 h-8 ${
                      notificationType === 'critical' ? 'text-destructive' : 'text-warning'
                    }`} />
                  )}
                </motion.div>

                {/* Title */}
                <h2 className={`text-2xl font-bold mb-2 ${
                  notificationType === 'timeout' || notificationType === 'critical'
                    ? 'text-destructive'
                    : 'text-warning'
                }`}>
                  {notificationType === 'timeout'
                    ? "Time's Up!"
                    : notificationType === 'critical'
                    ? 'Running Out of Time!'
                    : 'Time Warning'}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground mb-6">
                  {notificationType === 'timeout'
                    ? "Don't worry! You can try this quest again."
                    : notificationType === 'critical'
                    ? `Only ${formatTime(timeRemaining)} remaining. Focus on your solution!`
                    : `You have ${formatTime(timeRemaining)} left. Keep going!`}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  {notificationType === 'timeout' ? (
                    <>
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button variant="hero" onClick={() => setShowNotification(false)}>
                        Review Solution
                      </Button>
                    </>
                  ) : (
                    <>
                      {onExtend && (
                        <Button variant="outline" onClick={() => {
                          setTimeRemaining(prev => prev + 60);
                          setShowNotification(false);
                          setHasShownWarning(false);
                          setHasShownCritical(false);
                          onExtend();
                        }}>
                          <Clock className="w-4 h-4 mr-2" />
                          Add Time
                        </Button>
                      )}
                      <Button 
                        variant="hero" 
                        onClick={() => setShowNotification(false)}
                      >
                        Keep Coding!
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TimeoutNotification;
