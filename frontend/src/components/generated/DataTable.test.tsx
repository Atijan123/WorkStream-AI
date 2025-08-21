import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './DataTable';

const mockData = [
  { id: 1, name: 'John Doe', status: 'Active', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', status: 'Inactive', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', status: 'Active', email: 'bob@example.com' }
];

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'email', label: 'Email', sortable: false }
];

describe('DataTable', () => {
  it('renders without crashing', () => {
    render(<DataTable />);
  });

  it('displays data correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(<DataTable data={mockData} columns={mockColumns} title="User List" />);
    expect(screen.getByText('User List')).toBeInTheDocument();
  });

  it('shows search input when searchable is true', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters data based on search term', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />);
    const searchInput = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });

  it('sorts data when column header is clicked', () => {
    render(<DataTable data={mockData} columns={mockColumns} sortable={true} />);
    const nameHeader = screen.getByText('Name');
    
    fireEvent.click(nameHeader);
    
    const rows = screen.getAllByRole('row');
    // First row is header, so data rows start from index 1
    expect(rows[1]).toHaveTextContent('Bob Johnson');
    expect(rows[2]).toHaveTextContent('Jane Smith');
    expect(rows[3]).toHaveTextContent('John Doe');
  });

  it('shows no data message when data array is empty', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows no matching results when search returns empty', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable={true} />);
    const searchInput = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No matching results found')).toBeInTheDocument();
  });

  it('displays entry count information', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Showing 3 of 3 entries')).toBeInTheDocument();
  });

  it('uses default columns when none provided', () => {
    const dataWithDefaults = [
      { id: 1, name: 'Test', status: 'Active' }
    ];
    render(<DataTable data={dataWithDefaults} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});