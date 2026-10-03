import React from 'react';
import { render } from '@testing-library/react-native';
import { SleepTrackerCard } from '../sleep/SleepTrackerCard';
import { useSleepTrackerStore } from '../../store/sleepTrackerStore';

describe('SleepTrackerCard', () => {
  it('renders in awake state with Going to Bed CTA', () => {
    useSleepTrackerStore.setState({ isSleeping: false });
    const { getByText } = render(<SleepTrackerCard />);
    expect(getByText('Going to Bed')).toBeTruthy();
  });

  it('renders in sleeping state with Sleep in Progress and Tap when awake CTA', () => {
    useSleepTrackerStore.setState({
      isSleeping: true,
      activeSleepStart: new Date(Date.now() - 3600000).toISOString(),
    });
    const { getByText } = render(<SleepTrackerCard />);
    expect(getByText('Sleep in Progress')).toBeTruthy();
    expect(getByText("Tap when you're awake")).toBeTruthy();
  });
});
