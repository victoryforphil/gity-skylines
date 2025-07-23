# GitHub API Utilities

This directory contains utilities for interacting with the GitHub API to fetch repository commits.

## Files

- `github.ts` - Main GitHub API client and utilities
- `../types/github.ts` - TypeScript interfaces for GitHub API responses

## Features

- ✅ Full TypeScript support with proper types
- ✅ Raw REST API calls using native `fetch`
- ✅ React hook for easy integration
- ✅ Error handling and loading states
- ✅ Pagination support
- ✅ Optional GitHub token authentication
- ✅ Rate limiting awareness

## Usage

### Basic Usage (Promise-based)

```typescript
import { getRepositoryCommits } from './utils/github';

// Fetch commits without authentication
const commits = await getRepositoryCommits('facebook', 'react', {
  per_page: 10
});

// Fetch commits with GitHub token (higher rate limits)
const commits = await getRepositoryCommits('facebook', 'react', {
  token: 'ghp_your_token_here',
  per_page: 20,
  since: '2024-01-01T00:00:00Z'
});
```

### React Hook Usage

```typescript
import { useGitHubCommits } from './utils/github';

function MyComponent() {
  const { commits, loading, error, refetch } = useGitHubCommits('facebook', 'react', {
    token: 'ghp_your_token_here', // optional
    per_page: 10,
    since: '2024-01-01T00:00:00Z'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {commits.map(commit => (
        <div key={commit.sha}>
          <h3>{commit.commit.message}</h3>
          <p>by {commit.commit.author.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Advanced Usage with Client

```typescript
import { GitHubApiClient } from './utils/github';

const client = new GitHubApiClient('ghp_your_token_here');

// Get commits with custom parameters
const commits = await client.getCommits({
  owner: 'facebook',
  repo: 'react',
  sha: 'main',
  path: 'src/',
  author: 'gaearon',
  per_page: 50
});

// Get multiple pages of commits
const allCommits = await client.getCommitsPaginated({
  owner: 'facebook',
  repo: 'react',
  per_page: 100
}, 3); // Fetch up to 3 pages
```

## API Parameters

All functions support the following parameters based on the [GitHub API documentation](https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#list-commits):

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | string | Repository owner (required) |
| `repo` | string | Repository name (required) |
| `sha` | string | SHA or branch to start listing commits from |
| `path` | string | Only commits containing this file path will be returned |
| `author` | string | GitHub username or email address |
| `committer` | string | GitHub username or email address |
| `since` | string | ISO 8601 date format: YYYY-MM-DDTHH:MM:SSZ |
| `until` | string | ISO 8601 date format: YYYY-MM-DDTHH:MM:SSZ |
| `per_page` | number | Number of results per page (max 100) |
| `page` | number | Page number of the results to fetch |

## Authentication

While authentication is optional, providing a GitHub Personal Access Token will:

- Increase rate limits from 60 to 5,000 requests per hour
- Allow access to private repositories (if token has appropriate permissions)

To create a token:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with appropriate permissions
3. Use the token in your requests

## Rate Limiting

The GitHub API has rate limits:

- **Unauthenticated requests**: 60 per hour per IP
- **Authenticated requests**: 5,000 per hour per user

The utilities will throw descriptive errors when rate limits are exceeded.

## Error Handling

All functions properly handle and throw descriptive errors:

```typescript
try {
  const commits = await getRepositoryCommits('owner', 'repo');
} catch (error) {
  console.error('Failed to fetch commits:', error.message);
  // Handle specific error cases
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('404')) {
    // Handle repository not found
  }
}
```

## Example Component

See `../components/GitHubCommitsExample.tsx` for a complete React component demonstrating all features.