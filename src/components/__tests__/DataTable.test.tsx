import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DataTable } from '../DataTable';

describe('DataTable', () => {
  it('renders trending table correctly', () => {
    const { getByText } = render(<DataTable type="trending" />);

    expect(getByText('Trending Tokens')).toBeInTheDocument();
  });

  it('renders new tokens table correctly', () => {
    const { getByText } = render(<DataTable type="new" />);

    expect(getByText('New Tokens')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    const { getByText } = render(<DataTable type="trending" />);

    expect(getByText('Token')).toBeInTheDocument();
    expect(getByText('Price')).toBeInTheDocument();
    expect(getByText('Age')).toBeInTheDocument();
  });
});
