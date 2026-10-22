// Purpose: Test the checker while the application's G1 tooling is still unfinished.
export default {
  test: {
    include: ['tests/tools/**/*.test.ts'],
    environment: 'node',
    expect: { requireAssertions: true },
  },
};
