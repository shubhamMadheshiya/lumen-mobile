import React from 'react';
import { render } from '@testing-library/react-native';
import { LumenLogo, LumenIcon, LumenBadge } from '../common/LumenLogo';

describe('LumenLogo', () => {
  it('renders icon variant', () => {
    const { toJSON } = render(<LumenIcon size={32} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders badge variant', () => {
    const { toJSON } = render(<LumenBadge size={64} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders full brand variant with text', () => {
    const { getByText } = render(<LumenLogo variant="full" size={60} />);
    expect(getByText('Lumen')).toBeTruthy();
    expect(getByText('Autoimmune Health Companion')).toBeTruthy();
  });
});
