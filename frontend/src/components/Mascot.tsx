import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  mood?: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'sad' | 'encouraging';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showMessage?: boolean;
  onClick?: () => void;
}

const Mascot: React.FC<MascotProps> = ({ 
  mood = 'idle', 
  message,
  size = 'md',
  className = '',
  showMessage = true,
  onClick
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);

  // Blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    setCurrentMessage(message);
  }, [message]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const getMoodColor = () => {
    switch (mood) {
      case 'happy':
      case 'celebrating':
        return 'from-success/20 to-accent/20';
      case 'sad':
        return 'from-destructive/20 to-warning/20';
      case 'thinking':
        return 'from-warning/20 to-gold/20';
      case 'encouraging':
        return 'from-primary/20 to-accent/20';
      default:
        return 'from-primary/20 to-secondary/20';
    }
  };

  const getEyeExpression = () => {
    if (isBlinking) return { height: '2px', borderRadius: '50%' };
    
    switch (mood) {
      case 'happy':
      case 'celebrating':
        return { height: '8px', borderRadius: '50% 50% 0 0', transform: 'scaleY(0.6)' };
      case 'sad':
        return { height: '10px', borderRadius: '0 0 50% 50%' };
      case 'thinking':
        return { height: '10px', borderRadius: '50%', transform: 'translateY(-2px)' };
      default:
        return { height: '10px', borderRadius: '50%' };
    }
  };

  const getMouthExpression = () => {
    switch (mood) {
      case 'happy':
      case 'celebrating':
        return (
          <motion.path
            d="M 8 2 Q 12 8 16 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ['M 8 2 Q 12 8 16 2', 'M 8 3 Q 12 10 16 3', 'M 8 2 Q 12 8 16 2'] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          />
        );
      case 'sad':
        return (
          <path
            d="M 8 6 Q 12 2 16 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        );
      case 'thinking':
        return (
          <motion.ellipse
            cx="12"
            cy="5"
            rx="3"
            ry="2"
            fill="currentColor"
            animate={{ rx: [3, 4, 3], ry: [2, 3, 2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        );
      default:
        return (
          <path
            d="M 9 4 L 15 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
    }
  };

  const bodyAnimation = {
    idle: {
      y: [0, -5, 0],
      rotate: [0, 1, 0, -1, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
    },
    happy: {
      y: [0, -8, 0],
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity }
    },
    celebrating: {
      y: [0, -15, 0],
      rotate: [-5, 5, -5],
      scale: [1, 1.1, 1],
      transition: { duration: 0.3, repeat: Infinity }
    },
    thinking: {
      rotate: [-3, 3, -3],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
    },
    sad: {
      y: [0, 2, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
    },
    encouraging: {
      scale: [1, 1.05, 1],
      y: [0, -3, 0],
      transition: { duration: 1, repeat: Infinity }
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Speech bubble */}
      <AnimatePresence>
        {showMessage && currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground whitespace-nowrap shadow-lg z-10"
          >
            {currentMessage}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot body */}
      <motion.div
        className={`${sizeClasses[size]} relative cursor-pointer`}
        animate={bodyAnimation[mood]}
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getMoodColor()} blur-xl opacity-50`} />
        
        {/* Main body - bug/robot hybrid */}
        <motion.div className="relative w-full h-full">
          {/* Body */}
          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg overflow-hidden">
            {/* Shine effect */}
            <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white/30" />
            <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Antennae */}
          <motion.div 
            className="absolute -top-2 left-1/3 w-1 h-4 bg-accent rounded-full origin-bottom"
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute -top-1.5 -left-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
          </motion.div>
          <motion.div 
            className="absolute -top-2 right-1/3 w-1 h-4 bg-accent rounded-full origin-bottom"
            animate={{ rotate: [10, -10, 10] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            <div className="absolute -top-1.5 -left-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
          </motion.div>

          {/* Face */}
          <div className="absolute inset-4 flex flex-col items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-3 mb-2">
              <motion.div 
                className="w-3 bg-white"
                style={getEyeExpression()}
                animate={mood === 'thinking' ? { x: [-2, 2, -2] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="w-3 bg-white"
                style={getEyeExpression()}
                animate={mood === 'thinking' ? { x: [-2, 2, -2] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* Mouth */}
            <svg width="24" height="12" className="text-white">
              {getMouthExpression()}
            </svg>
          </div>

          {/* Celebration particles */}
          {mood === 'celebrating' && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ['hsl(var(--gold))', 'hsl(var(--accent))', 'hsl(var(--success))'][i % 3],
                    top: '50%',
                    left: '50%'
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 60],
                    y: [0, -40 - Math.random() * 30],
                    opacity: [1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15
                  }}
                />
              ))}
            </>
          )}

          {/* Thinking bubbles */}
          {mood === 'thinking' && (
            <>
              <motion.div
                className="absolute -right-2 top-0 w-2 h-2 rounded-full bg-muted-foreground/50"
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -right-4 -top-2 w-3 h-3 rounded-full bg-muted-foreground/40"
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="absolute -right-7 -top-5 w-4 h-4 rounded-full bg-muted-foreground/30"
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;
