import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Root from './root.component';

describe('Root', () => {
  it('mounts the route shell without crashing', () => {
    // No route matches the default jsdom URL, so the shell mounts but renders
    // no route content; this asserts the wiring (BrowserRouter + Routes) works.
    expect(() => render(<Root />)).not.toThrow();
  });
});
