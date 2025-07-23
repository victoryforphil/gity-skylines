import React, { useState } from 'react';
import { useGitHubCommits, getRepositoryCommits } from '../utils/github';
import type { GitHubCommit } from '../types/github';

interface CommitItemProps {
  commit: GitHubCommit;
}

const CommitItem: React.FC<CommitItemProps> = ({ commit }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {commit.commit.message.split('\n')[0]}
          </h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <span className="font-medium">Author:</span> {commit.commit.author.name}
              {commit.author && (
                <span className="ml-1">(@{commit.author.login})</span>
              )}
            </p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              {new Date(commit.commit.author.date).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">SHA:</span>{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">
                {commit.sha.substring(0, 8)}
              </code>
            </p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </div>
  );
};

const GitHubCommitsExample: React.FC = () => {
  const [owner, setOwner] = useState('facebook');
  const [repo, setRepo] = useState('react');
  const [token, setToken] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [manualCommits, setManualCommits] = useState<GitHubCommit[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Using the React hook
  const { commits, loading, error, refetch } = useGitHubCommits(owner, repo, {
    token: token || undefined,
    per_page: perPage,
  });

  // Manual fetch example
  const handleManualFetch = async () => {
    setManualLoading(true);
    setManualError(null);
    
    try {
      const result = await getRepositoryCommits(owner, repo, {
        token: token || undefined,
        per_page: perPage,
      });
      setManualCommits(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setManualError(errorMessage);
      setManualCommits([]);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        GitHub Commits Fetcher
      </h1>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
              Repository Owner
            </label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., facebook"
            />
          </div>
          <div>
            <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1">
              Repository Name
            </label>
            <input
              id="repo"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., react"
            />
          </div>
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token (Optional)
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ghp_..."
            />
          </div>
          <div>
            <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">
              Commits per Page
            </label>
            <input
              id="perPage"
              type="number"
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value) || 10)}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Using React Hook */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Using React Hook</h2>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refetch'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="text-gray-600">Loading commits...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {!loading && !error && commits.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Found {commits.length} commits for {owner}/{repo}
            </p>
            <div className="space-y-3">
              {commits.map((commit) => (
                <CommitItem key={commit.sha} commit={commit} />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && commits.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No commits found
          </div>
        )}
      </div>

      {/* Manual Fetch Example */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manual Fetch Example</h2>
          <button
            onClick={handleManualFetch}
            disabled={manualLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {manualLoading ? 'Loading...' : 'Fetch Manually'}
          </button>
        </div>

        {manualLoading && (
          <div className="text-center py-4">
            <div className="text-gray-600">Loading commits...</div>
          </div>
        )}

        {manualError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-800 text-sm">
              <strong>Error:</strong> {manualError}
            </div>
          </div>
        )}

        {!manualLoading && !manualError && manualCommits.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Found {manualCommits.length} commits for {owner}/{repo}
            </p>
            <div className="space-y-3">
              {manualCommits.map((commit) => (
                <CommitItem key={commit.sha} commit={commit} />
              ))}
            </div>
          </div>
        )}

        {!manualLoading && !manualError && manualCommits.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Click "Fetch Manually" to load commits
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubCommitsExample;