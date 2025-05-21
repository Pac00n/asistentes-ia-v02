module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Optional: setupFilesAfterEnv: ['./tests/setupTests.ts'] // for global mocks
  // Asegurarse que Jest puede encontrar los tests
  roots: ['<rootDir>/tests'], 
  // ModuleNameMapper para resolver alias de rutas como '@/' si se usan en los tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
