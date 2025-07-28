import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DataView from '../data-view/DataView.jsx';

describe('DataView', () => {
  it('renders and switches views', async () => {
    render(<DataView />);
    expect(screen.getByLabelText(/Data Type/i)).toBeInTheDocument();
    // Wait for loading to finish
    expect(await screen.findByText(/triple/i)).toBeInTheDocument();
    // Switch to table view
    fireEvent.click(screen.getByText('Table'));
    expect(screen.getByRole('table')).toBeInTheDocument();
    // Switch to raw view
    fireEvent.click(screen.getByText('Raw'));
    expect(screen.getByText(/No data found|\{/)).toBeInTheDocument();
  });
});
