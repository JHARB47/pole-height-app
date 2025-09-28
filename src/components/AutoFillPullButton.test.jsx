import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AutoFillPullButton from './AutoFillPullButton.jsx';

describe('AutoFillPullButton', () => {
  it('computes and updates PULL_ft on click', () => {
    const pole = { id: 'p1', incomingBearingDeg: 350, outgoingBearingDeg: 10 };
    const onUpdatePole = vi.fn();
    render(<AutoFillPullButton pole={pole} onUpdatePole={onUpdatePole} />);
    const btn = screen.getByRole('button', { name: /autofill pull/i });
    fireEvent.click(btn);
    expect(onUpdatePole).toHaveBeenCalledTimes(1);
    const updated = onUpdatePole.mock.calls[0][0];
    expect(updated.PULL_ft).toBeGreaterThan(0);
    expect(updated.PULL_ft).toBeLessThanOrEqual(100);
  });
});
