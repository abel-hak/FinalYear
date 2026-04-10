// TimerDisplay.tsx
import React from "react";
import TimeoutNotification from "@/components/TimeoutNotification";
interface TimerDisplayProps {
  timeLimit: number;
  onTimeout: () => void;
  onExtend: () => void;
  isPaused?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLimit,
  onTimeout,
  onExtend,
  isPaused = false,
}) => {
  return (
    <div className="fixed top-20 right-6 z-40">
      <TimeoutNotification
        timeLimit={timeLimit}
        onTimeout={onTimeout}
        onExtend={onExtend}
        isPaused={isPaused}
      />
    </div>
  );
};

export default TimerDisplay;
