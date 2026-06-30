import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditLogEventTag from './audit-log-event-tag.component';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));

describe('AuditLogEventTag', () => {
  it('renders "Created" for ADD event', () => {
    render(<AuditLogEventTag eventType="ADD" />);
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders "Updated" for MOD event', () => {
    render(<AuditLogEventTag eventType="MOD" />);
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('renders "Deleted" for DEL event', () => {
    render(<AuditLogEventTag eventType="DEL" />);
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('renders raw value for unknown event type', () => {
    render(<AuditLogEventTag eventType="UNKNOWN_TYPE" />);
    expect(screen.getByText('UNKNOWN_TYPE')).toBeInTheDocument();
  });
});
