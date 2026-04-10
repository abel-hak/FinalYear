import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flame, Skull } from "lucide-react";

interface WeeklyDayStatus {
  key: string;
  shortLabel: string;
  dateLabel: string;
  active: boolean;
  isToday: boolean;
  isPast: boolean;
}

interface WeeklyStreakSectionProps {
  streakDays: number;
  lastActivityDate: string | null;
}

interface ConnectorSegment {
  x: number;
  y: number;
  angle: number;
  length: number;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FORCE_ALL_DAYS_ACTIVE_FOR_TESTING = false;
const CONNECTOR_OVERLAP_PX = 2;
const CONNECTOR_THICKNESS_PX = 16;

function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function buildWeeklyStreak(
  streakDays: number,
  lastActivityDate: string | null,
): { days: WeeklyDayStatus[]; activeCount: number } {
  const today = new Date();
  const todayIso = toIsoDateUTC(today);
  const weekStart = startOfWeekSunday(today);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDaysUTC(weekStart, i),
  );

  const active = new Set<string>();
  if (
    !FORCE_ALL_DAYS_ACTIVE_FOR_TESTING &&
    streakDays > 0 &&
    lastActivityDate
  ) {
    const end = parseIsoDate(lastActivityDate);
    for (let i = 0; i < streakDays; i += 1) {
      active.add(toIsoDateUTC(addDaysUTC(end, -i)));
    }
  }

  const days = weekDates.map((date, idx) => {
    const iso = toIsoDateUTC(date);
    return {
      key: iso,
      shortLabel: WEEKDAY_SHORT[idx],
      dateLabel: String(date.getUTCDate()),
      active: FORCE_ALL_DAYS_ACTIVE_FOR_TESTING || active.has(iso),
      isToday: iso === todayIso,
      isPast: FORCE_ALL_DAYS_ACTIVE_FOR_TESTING ? false : iso < todayIso,
    };
  });

  return {
    days,
    activeCount: days.filter((d) => d.active).length,
  };
}

export const WeeklyStreakSection: React.FC<WeeklyStreakSectionProps> = ({
  streakDays,
  lastActivityDate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bubbleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [connectorSegments, setConnectorSegments] = useState<
    ConnectorSegment[]
  >([]);
  const weeklyStreak = useMemo(
    () => buildWeeklyStreak(streakDays, lastActivityDate),
    [streakDays, lastActivityDate],
  );

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const segments: ConnectorSegment[] = [];

      for (let i = 0; i < weeklyStreak.days.length - 1; i += 1) {
        const current = weeklyStreak.days[i];
        const next = weeklyStreak.days[i + 1];
        if (!current.active || !next.active) continue;

        const currentEl = bubbleRefs.current[i];
        const nextEl = bubbleRefs.current[i + 1];
        if (!currentEl || !nextEl) continue;

        const currentRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        const currentCenterX =
          currentRect.left - containerRect.left + currentRect.width / 2;
        const currentCenterY =
          currentRect.top - containerRect.top + currentRect.height / 2;
        const nextCenterX =
          nextRect.left - containerRect.left + nextRect.width / 2;
        const nextCenterY =
          nextRect.top - containerRect.top + nextRect.height / 2;

        const dx = nextCenterX - currentCenterX;
        const dy = nextCenterY - currentCenterY;
        const centerDistance = Math.hypot(dx, dy);
        if (centerDistance === 0) continue;

        const currentRadius =
          Math.min(currentRect.width, currentRect.height) / 2;
        const nextRadius = Math.min(nextRect.width, nextRect.height) / 2;
        const ux = dx / centerDistance;
        const uy = dy / centerDistance;

        // Start/end are measured at circle perimeter with slight overlap to avoid tiny gaps.
        const startX =
          currentCenterX + ux * (currentRadius - CONNECTOR_OVERLAP_PX);
        const startY =
          currentCenterY + uy * (currentRadius - CONNECTOR_OVERLAP_PX);
        const endX = nextCenterX - ux * (nextRadius - CONNECTOR_OVERLAP_PX);
        const endY = nextCenterY - uy * (nextRadius - CONNECTOR_OVERLAP_PX);
        const length = Math.hypot(endX - startX, endY - startY);
        if (length <= 0) continue;

        segments.push({
          x: startX,
          y: startY,
          angle: (Math.atan2(dy, dx) * 180) / Math.PI,
          length,
        });
      }

      setConnectorSegments((current) => {
        const isSameLength = current.length === segments.length;
        const isSame =
          isSameLength &&
          current.every(
            (segment, idx) =>
              segment.x === segments[idx].x &&
              segment.y === segments[idx].y &&
              segment.angle === segments[idx].angle &&
              segment.length === segments[idx].length,
          );

        return isSame ? current : segments;
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [weeklyStreak.days]);

  return (
    <section className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background  p-5 sm:p-6 shadow-sm">
      <style>{`
        @keyframes professional-shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          15% { opacity: 1; }
          35% { transform: translateX(250%) skewX(-15deg); opacity: 1; }
          40% { opacity: 0; }
          100% { transform: translateX(250%) skewX(-15deg); opacity: 0; }
        }

        .weekly-streak-connector-socket {
          /* Concave ends create the socket shape where links visually wrap into circles. */
          clip-path: polygon(
            0% 0%,
            100% 0%,
            94% 24%,
            92% 50%,
            94% 76%,
            100% 100%,
            0% 100%,
            6% 76%,
            8% 50%,
            6% 24%
          );
        }
      `}</style>

      <div className="flex flex-col gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Flame className="h-3.5 w-3.5" />
            Weekly Streak
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
            Sunday to Saturday Momentum
          </h2>
          <p className="text-sm text-muted-foreground">
            {weeklyStreak.activeCount} active day
            {weeklyStreak.activeCount === 1 ? "" : "s"} this week. Current
            streak: {streakDays} day{streakDays === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <div ref={containerRef} className="relative isolate mt-5">
        {/* Connectors Container: Kept at -z-10 to stay behind the z-30 circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-visible"
        >
          {connectorSegments.map((segment, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: segment.x,
                top: segment.y,
                width: segment.length,
                height: CONNECTOR_THICKNESS_PX,
                transform: `translateY(-50%) rotate(${segment.angle}deg)`,
                transformOrigin: "0 50%",
              }}
            >
              <div className="weekly-streak-connector-socket absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/24 via-primary/20 to-primary/24 shadow-[0_0_8px_hsl(var(--primary)/0.16)] ring-1 ring-inset ring-primary/30" />
                <div className="absolute inset-[2px] bg-gradient-to-r from-primary/18 via-primary/14 to-primary/18 opacity-90" />

                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{
                      animation: "professional-shimmer 3s ease-in-out infinite",
                      animationDelay: `${index * 0.15}s`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 grid grid-cols-7 gap-2 sm:gap-3">
          {weeklyStreak.days.map((day) => (
            <div
              key={day.key}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {day.shortLabel}
              </p>
              <div className="relative flex items-center justify-center">
                <div
                  ref={(el) => {
                    const index = weeklyStreak.days.findIndex(
                      (d) => d.key === day.key,
                    );
                    bubbleRefs.current[index] = el;
                  }}
                  className={`relative z-30 flex h-7 w-7  sm:w-14 items-center justify-center rounded-full border transition-all sm:h-16  ${
                    day.active
                      ? "border-primary/70 bg-primary/20 shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_0_18px_hsl(var(--primary)/0.25)]"
                      : day.isPast
                        ? "border-border/60 bg-muted/55"
                        : "border-border/70 bg-card/70"
                  } ${day.isToday ? "ring-2 ring-primary/30" : ""}`}
                >
                  {day.active && (
                    <Flame className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 -translate-y-1/4 text-primary sm:h-10 sm:w-10" />
                  )}
                  {!day.active && day.isPast && (
                    <Skull className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 -translate-y-1/4 text-muted-foreground/80 sm:h-8 sm:w-8 sm:translate-y-0.5" />
                  )}
                  {!day.active && !day.isPast && (
                    <span className="text-sm font-bold text-foreground sm:text-base">
                      {day.dateLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeeklyStreakSection;
