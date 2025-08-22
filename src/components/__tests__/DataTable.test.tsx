import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DataTable } from '../DataTable';

describe('DataTable', () => {
  it('renders table headers correctly', () => {
    const { getByText } = render(<DataTable />);

    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
    expect(getByText('Role')).toBeInTheDocument();
  });

  it('renders table data correctly', () => {
    const { getByText } = render(<DataTable />);

    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('jane@example.com')).toBeInTheDocument();
    expect(getByText('Manager')).toBeInTheDocument();
  });

  it('renders the correct number of rows', () => {
    const { getAllByRole } = render(<DataTable />);

    const rows = getAllByRole('row');
    expect(rows).toHaveLength(4);
  });
});
