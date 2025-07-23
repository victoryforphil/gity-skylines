import type { GitHubCommit, GitHubCommitsParams, GitHubApiError } from '../types/github';
import { useState, useEffect, useCallback } from 'react';

const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * GitHub API client for fetching repository commits
 */
export class GitHubApiClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Get the authorization headers for GitHub API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'github-city-generator'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(baseUrl: string, params: Record<string, string | number | undefined>): string {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    return url.toString();
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: GitHubApiError = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      }));
      
      throw new Error(`GitHub API Error: ${errorData.message}`);
    }

    return response.json();
  }

  /**
   * Get commits for a repository
   * @param params - Parameters for the commits API call
   * @returns Promise<GitHubCommit[]> - Array of commits
   */
  async getCommits(params: GitHubCommitsParams): Promise<GitHubCommit[]> {
    const { owner, repo, ...queryParams } = params;
    
    const url = this.buildUrl(
      `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits`,
      queryParams
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<GitHubCommit[]>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch commits: ${error.message}`);
      }
      throw new Error('Failed to fetch commits: Unknown error');
    }
  }

  /**
   * Get commits with pagination support
   * @param params - Parameters for the commits API call
   * @param maxPages - Maximum number of pages to fetch (default: 1)
   * @returns Promise<GitHubCommit[]> - Array of all commits from all pages
   */
  async getCommitsPaginated(
    params: GitHubCommitsParams, 
    maxPages: number = 1
  ): Promise<GitHubCommit[]> {
    const allCommits: GitHubCommit[] = [];
    let currentPage = params.page || 1;
    const perPage = params.per_page || 30;

    for (let page = 0; page < maxPages; page++) {
      const pageParams = {
        ...params,
        page: currentPage + page,
        per_page: perPage
      };

      const commits = await this.getCommits(pageParams);
      
      if (commits.length === 0) {
        break; // No more commits available
      }

      allCommits.push(...commits);

      // If we got fewer commits than requested, we've reached the end
      if (commits.length < perPage) {
        break;
      }
    }

    return allCommits;
  }
}

/**
 * Convenience function to create a GitHub API client
 * @param token - Optional GitHub personal access token
 * @returns GitHubApiClient instance
 */
export function createGitHubClient(token?: string): GitHubApiClient {
  return new GitHubApiClient(token);
}

/**
 * Quick utility function to get commits for a repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param options - Optional parameters
 * @returns Promise<GitHubCommit[]> - Array of commits
 */
export async function getRepositoryCommits(
  owner: string,
  repo: string,
  options: Omit<GitHubCommitsParams, 'owner' | 'repo'> & { token?: string } = {}
): Promise<GitHubCommit[]> {
  const { token, ...params } = options;
  const client = createGitHubClient(token);
  
  return client.getCommits({
    owner,
    repo,
    ...params
  });
}

/**
 * React hook for fetching GitHub repository commits
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param options - Optional parameters including token
 * @returns Object with commits data, loading state, error, and refetch function
 */
export function useGitHubCommits(
  owner: string,
  repo: string,
  options: Omit<GitHubCommitsParams, 'owner' | 'repo'> & { 
    token?: string;
    enabled?: boolean;
  } = {}
) {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token, enabled = true, ...params } = options;

  const fetchCommits = useCallback(async () => {
    if (!enabled || !owner || !repo) return;

    setLoading(true);
    setError(null);

    try {
      const client = createGitHubClient(token);
      const result = await client.getCommits({
        owner,
        repo,
        ...params
      });
      setCommits(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, token, enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return {
    commits,
    loading,
    error,
    refetch: fetchCommits
  };
}