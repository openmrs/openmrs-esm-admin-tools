import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConceptSearchInput from './concept-search-input.component';

// Mock the dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  useDebounce: jest.fn((value) => value),
}));

jest.mock('./concept-search-results', () => {
  return function MockConceptSearchResults({ searchTerm, onConceptSelect }: any) {
    if (!searchTerm) return null;

    return (
      <div data-testid="concept-search-results">
        <div
          data-testid="concept-result"
          onClick={() => onConceptSelect({ uuid: 'test-uuid', display: 'Test Concept' })}
        >
          Test Concept
        </div>
      </div>
    );
  };
});

describe('ConceptSearchInput', () => {
  const mockOnConceptSelect = jest.fn();
  const defaultProps = {
    parameterName: 'testParameter',
    onConceptSelect: mockOnConceptSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input with default placeholder', () => {
    render(<ConceptSearchInput {...defaultProps} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Search for a concept' })).toBeInTheDocument();
  });

  it('should render search input with custom placeholder and label', () => {
    render(<ConceptSearchInput {...defaultProps} placeholder="Custom placeholder" labelText="Custom label" />);

    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Custom placeholder');
    expect(screen.getByRole('search', { name: 'Custom placeholder' })).toBeInTheDocument();
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });

  it('should show search results when typing', async () => {
    render(<ConceptSearchInput {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('concept-search-results')).toBeInTheDocument();
    });
  });

  it('should call onConceptSelect when a concept is selected', async () => {
    render(<ConceptSearchInput {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('concept-search-results')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('concept-result'));

    expect(mockOnConceptSelect).toHaveBeenCalledWith('test-uuid', 'Test Concept');
  });

  it('should hide search results after concept selection', async () => {
    render(<ConceptSearchInput {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('concept-search-results')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('concept-result'));

    await waitFor(() => {
      expect(screen.queryByTestId('concept-search-results')).not.toBeInTheDocument();
    });
  });

  it('should update input value with selected concept display name', async () => {
    render(<ConceptSearchInput {...defaultProps} />);

    const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('concept-search-results')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('concept-result'));

    await waitFor(() => {
      expect(searchInput.value).toBe('Test Concept');
    });
  });
});
