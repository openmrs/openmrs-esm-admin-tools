import '@testing-library/jest-dom/extend-expect';
(window as any).importMapOverrides = {
  getOverrideMap: jest.fn().mockReturnValue({ imports: {} }),
};
