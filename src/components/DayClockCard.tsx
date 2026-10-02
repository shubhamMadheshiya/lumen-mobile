/**
 * DayClockCard
 * Re-exports the enhanced SleepTrackerCard for backward compatibility.
 * Features live sleep tracking from "Going to bed" to "Tap when you're awake",
 * compulsory 7–8 hour progress tracking for autoimmune disease recovery,
 * and 1-tap sleep quality check-in.
 */
import React from 'react';
import { SleepTrackerCard, SleepTrackerCardProps } from './sleep/SleepTrackerCard';

export function DayClockCard(props: SleepTrackerCardProps): React.ReactElement {
  return <SleepTrackerCard {...props} />;
}

export { SleepTrackerCard };
