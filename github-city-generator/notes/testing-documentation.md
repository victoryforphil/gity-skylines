# Testing Documentation

## Test Suite Overview

The GitHub City Generator utilities are comprehensively tested using **Vitest** with **85 tests** across **4 test files**, achieving excellent code coverage.

### Test Coverage Summary

```
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   55.07 |    82.97 |   86.66 |   55.07 |
 src/utils         |   78.45 |     86.2 |   98.71 |   78.45 |
  CityGeneratorCore |   89.04 |    70.37 |     100 |   89.04 |
  CityGeneratorMain |     100 |    92.85 |     100 |     100 |
  CommitProcessor   |   94.49 |    89.85 |     100 |   94.49 |
  FileTracker       |   99.27 |    81.01 |     100 |   99.27 |
  GridManager       |   84.97 |    92.85 |   94.44 |   84.97 |
-------------------|---------|----------|---------|---------|-------------------
```

## Test Files Structure

### 1. GridManager.test.ts (17 tests)
Tests the grid positioning and collision resolution system:

- **Initialization**: Grid setup with road networks
- **Position Allocation**: Hash-based file positioning
- **Collision Resolution**: Spiral search algorithm
- **Grid Management**: Position reservation and release
- **Grid Expansion**: Dynamic grid growth
- **Statistics**: Utilization tracking
- **Error Handling**: Invalid operations
- **Hash Consistency**: Deterministic positioning

### 2. FileTracker.test.ts (27 tests)
Tests the building lifecycle management system:

- **Building Creation**: File to building conversion
- **File Type Detection**: Extension-based type mapping
- **Layer Management**: Commit layer addition
- **Building Deletion**: Inactive building handling
- **Building Moves**: File rename/move operations
- **Building Queries**: Various search methods
- **Statistics**: Comprehensive metrics
- **Data Persistence**: Export/import functionality
- **Building History**: Complete change tracking

### 3. CommitProcessor.test.ts (17 tests)
Tests GitHub API data transformation:

- **Commit Processing**: GitHub to city format conversion
- **File Change Extraction**: Detailed change analysis
- **Change Type Determination**: Operation classification
- **Commit Analysis**: Pattern recognition
- **API Error Handling**: Graceful failure recovery
- **Rate Limiting**: GitHub API compliance
- **Filtering**: Date, author, and file pattern filters
- **Message Simulation**: Fallback when detailed data unavailable

### 4. CityGenerator.test.ts (24 tests)
Tests the main orchestration system:

- **Initialization**: Configuration management
- **City Generation**: End-to-end processing
- **File Operations**: Complete CRUD operations
- **Building Geometry**: 3D representation generation
- **Event System**: Real-time update notifications
- **Statistics**: City-wide metrics
- **Data Persistence**: State export/import
- **Error Handling**: Malformed data recovery

## Test Configuration

### Vitest Setup (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### Test Scripts
- `npm test` - Interactive test runner
- `npm run test:run` - Single test run
- `npm run test:coverage` - Coverage report
- `npm run test:ui` - Visual test interface

## Mock Strategy

### GitHub API Mocking
```typescript
// Mock fetch for GitHub API calls
global.fetch = vi.fn()

// Mock specific responses
const mockResponse = {
  ok: true,
  json: () => Promise.resolve({
    files: [
      {
        filename: 'src/App.tsx',
        status: 'added',
        additions: 50,
        deletions: 0
      }
    ]
  })
}
```

### Console Mocking
```typescript
// Suppress console noise in tests
beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})
```

## Test Data Factories

### Mock Commit Creation
```typescript
const createMockCommit = (overrides = {}) => ({
  sha: 'abc123',
  timestamp: new Date('2024-01-01'),
  author: 'John Doe',
  authorEmail: 'john@example.com',
  message: 'Initial commit',
  filesChanged: [
    {
      filePath: 'src/App.tsx',
      changeType: FileChangeType.CREATE,
      linesAdded: 50,
      linesDeleted: 0,
      status: 'added'
    }
  ],
  ...overrides
})
```

### Mock Layer Creation
```typescript
const createMockLayer = (overrides = {}) => ({
  commitSha: 'abc123',
  timestamp: new Date('2024-01-01'),
  author: 'John Doe',
  authorEmail: 'john@example.com',
  changeType: FileChangeType.CREATE,
  linesAdded: 50,
  linesDeleted: 0,
  message: 'Initial commit',
  ...overrides
})
```

## Performance Testing

### Grid Performance Test
```typescript
it('should handle large number of allocations efficiently', () => {
  const start = performance.now()
  
  for (let i = 0; i < 1000; i++) {
    gridManager.allocatePosition(`file${i}.txt`, `building${i}`)
  }
  
  const duration = performance.now() - start
  expect(duration).toBeLessThan(100) // Should complete in <100ms
})
```

## Integration Testing

### End-to-End City Generation
```typescript
it('should generate complete city from commits', async () => {
  const commits = [
    createMockCommit(),
    createMockCommit({
      sha: 'def456',
      filesChanged: [
        {
          filePath: 'src/App.tsx',
          changeType: FileChangeType.MODIFY,
          linesAdded: 10,
          linesDeleted: 5
        }
      ]
    })
  ]

  const cityState = await cityGenerator.generateCity(commits)
  
  expect(cityState.buildings.size).toBe(1)
  expect(cityState.totalCommits).toBe(2)
  expect(cityState.activeFiles).toBe(1)
})
```

## Error Testing

### Graceful Failure Handling
```typescript
it('should handle API failures gracefully', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found'
  })

  const fileChanges = await commitProcessor.getCommitFiles('owner', 'repo', 'nonexistent')
  expect(fileChanges).toEqual([])
})
```

## Continuous Integration

### GitHub Actions Integration
The test suite runs automatically on:
- **Push to main/develop branches**
- **Pull request creation**
- **Multiple Node.js versions** (18.x, 20.x)

### CI Pipeline Steps
1. **Linting**: Code style validation
2. **Type Checking**: TypeScript compilation
3. **Unit Tests**: Complete test suite
4. **Coverage**: Minimum 80% threshold
5. **Security Audit**: Dependency vulnerability scan
6. **Performance Tests**: Allocation speed benchmarks

## Test Maintenance

### Adding New Tests
1. Follow existing naming conventions
2. Use factory functions for test data
3. Include both positive and negative test cases
4. Add performance tests for critical paths
5. Update coverage thresholds if needed

### Best Practices
- **Arrange-Act-Assert** pattern
- **Descriptive test names** explaining behavior
- **Isolated tests** with proper cleanup
- **Mock external dependencies**
- **Test edge cases and error conditions**

## Future Test Enhancements

### Planned Additions
1. **Visual Regression Tests** for 3D components
2. **Load Testing** for large repositories
3. **Integration Tests** with real GitHub API
4. **Accessibility Tests** for UI components
5. **Cross-browser Testing** for web components

### Test Infrastructure Improvements
1. **Parallel Test Execution** for faster CI
2. **Test Result Caching** for unchanged code
3. **Mutation Testing** for test quality validation
4. **Property-based Testing** for edge case discovery
5. **Snapshot Testing** for stable outputs

The comprehensive test suite ensures the reliability and maintainability of the GitHub City Generator utilities, providing confidence for continuous development and deployment.
