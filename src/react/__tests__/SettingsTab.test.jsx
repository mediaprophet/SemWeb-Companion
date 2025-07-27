import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsTab from '../SettingsTab.jsx';
import { SettingsProvider } from '../SettingsContext.jsx';

describe('SettingsTab', () => {
  it('renders language switcher and settings form', () => {
    render(
      <SettingsProvider>
        <SettingsTab />
      </SettingsProvider>
    );
    expect(screen.getByLabelText(/Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/UI Terminology/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred User ID/i)).toBeInTheDocument();
  });
});
