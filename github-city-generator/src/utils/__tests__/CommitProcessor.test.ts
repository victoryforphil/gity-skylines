import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommitProcessor } from '../CommitProcessor'
import { FileChangeType } from '../../types/city'
import type { GitHubCommit } from '../../types/github'

describe('CommitProcessor', () => {
  let commitProcessor: CommitProcessor

  beforeEach(() => {
    commitProcessor = new CommitProcessor()
    vi.clearAllMocks()
  })

  const createMockGitHubCommit = (overrides = {}): GitHubCommit => ({
    sha: 'abc123',
    node_id: 'node123',
    commit: {
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: '2024-01-01T10:00:00Z'
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: '2024-01-01T10:00:00Z'
      },
      message: 'Initial commit',
      tree: {
        sha: 'tree123',
        url: 'https://api.github.com/tree/123'
      },
      url: 'https://api.github.com/commit/123',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null
      }
    },
    url: 'https://api.github.com/commit/123',
    html_url: 'https://github.com/owner/repo/commit/123',
    comments_url: 'https://api.github.com/commit/123/comments',
    author: {
      login: 'johndoe',
      id: 123,
      node_id: 'user123',
      avatar_url: 'https://github.com/avatar.jpg',
      gravatar_id: '',
      url: 'https://api.github.com/users/johndoe',
      html_url: 'https://github.com/johndoe',
      followers_url: 'https://api.github.com/users/johndoe/followers',
      following_url: 'https://api.github.com/users/johndoe/following{/other_user}',
      gists_url: 'https://api.github.com/users/johndoe/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/johndoe/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/johndoe/subscriptions',
      organizations_url: 'https://api.github.com/users/johndoe/orgs',
      repos_url: 'https://api.github.com/users/johndoe/repos',
      events_url: 'https://api.github.com/users/johndoe/events{/privacy}',
      received_events_url: 'https://api.github.com/users/johndoe/received_events',
      type: 'User',
      site_admin: false
    },
    committer: null,
    parents: [],
    ...overrides
  })

  describe('commit processing', () => {
    it('should process a single GitHub commit', () => {
      const gitHubCommit = createMockGitHubCommit()
      const processed = commitProcessor.processCommit(gitHubCommit)

      expect(processed.sha).toBe('abc123')
      expect(processed.author).toBe('John Doe')
      expect(processed.authorEmail).toBe('john@example.com')
      expect(processed.message).toBe('Initial commit')
      expect(processed.timestamp).toEqual(new Date('2024-01-01T10:00:00Z'))
      expect(processed.filesChanged).toEqual([])
    })

    it('should process multiple commits in chronological order', () => {
      const commits = [
        createMockGitHubCommit({
          sha: 'commit2',
          commit: {
            ...createMockGitHubCommit().commit,
            author: {
              ...createMockGitHubCommit().commit.author,
              date: '2024-01-02T10:00:00Z'
            }
          }
        }),
        createMockGitHubCommit({
          sha: 'commit1',
          commit: {
            ...createMockGitHubCommit().commit,
            author: {
              ...createMockGitHubCommit().commit.author,
              date: '2024-01-01T10:00:00Z'
            }
          }
        })
      ]

      const processed = commitProcessor.processCommits(commits)

      expect(processed).toHaveLength(2)
      expect(processed[0].sha).toBe('commit1') // Earlier date should come first
      expect(processed[1].sha).toBe('commit2')
    })
  })

  describe('file change extraction', () => {
    it('should extract file changes from commit details', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          files: [
            {
              filename: 'src/App.tsx',
              status: 'added',
              additions: 50,
              deletions: 0,
              changes: 50
            },
            {
              filename: 'src/Header.tsx',
              status: 'modified',
              additions: 10,
              deletions: 5,
              changes: 15
            }
          ]
        })
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const fileChanges = await commitProcessor.getCommitFiles('owner', 'repo', 'abc123')

      expect(fileChanges).toHaveLength(2)
      expect(fileChanges[0]).toEqual({
        filePath: 'src/App.tsx',
        previousPath: undefined,
        changeType: FileChangeType.CREATE,
        linesAdded: 50,
        linesDeleted: 0,
        status: 'added'
      })
      expect(fileChanges[1]).toEqual({
        filePath: 'src/Header.tsx',
        previousPath: undefined,
        changeType: FileChangeType.MODIFY,
        linesAdded: 10,
        linesDeleted: 5,
        status: 'modified'
      })
    })

    it('should handle renamed files', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          files: [
            {
              filename: 'src/NewApp.tsx',
              previous_filename: 'src/App.tsx',
              status: 'renamed',
              additions: 5,
              deletions: 2,
              changes: 7
            }
          ]
        })
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const fileChanges = await commitProcessor.getCommitFiles('owner', 'repo', 'abc123')

      expect(fileChanges[0]).toEqual({
        filePath: 'src/NewApp.tsx',
        previousPath: 'src/App.tsx',
        changeType: FileChangeType.RENAME,
        linesAdded: 5,
        linesDeleted: 2,
        status: 'renamed'
      })
    })

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const fileChanges = await commitProcessor.getCommitFiles('owner', 'repo', 'nonexistent')

      expect(fileChanges).toEqual([])
    })

    it('should include authorization header when token provided', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ files: [] })
      }

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await commitProcessor.getCommitFiles('owner', 'repo', 'abc123', 'test-token')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/commits/abc123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

     describe('change type determination', () => {
     it('should correctly determine file change types', () => {
       const testCases = [
         { status: 'added', expected: FileChangeType.CREATE },
         { status: 'modified', expected: FileChangeType.MODIFY },
         { status: 'removed', expected: FileChangeType.DELETE },
         { status: 'renamed', expected: FileChangeType.MOVE }, // CommitProcessor maps renamed to MOVE
         { status: 'unknown', expected: FileChangeType.MODIFY }
       ]

       testCases.forEach(({ status, expected }) => {
         const fileData = {
           filename: 'test.txt',
           status,
           additions: 10,
           deletions: 5
         }

         const result = commitProcessor['parseFileChange'](fileData)
         expect(result.changeType).toBe(expected)
       })
     })
   })

  describe('commits with files processing', () => {
    it('should process commits with detailed file information', async () => {
      const commits = [createMockGitHubCommit()]
      
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

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const processed = await commitProcessor.processCommitsWithFiles(
        commits,
        'owner',
        'repo',
        'token'
      )

      expect(processed).toHaveLength(1)
      expect(processed[0].filesChanged).toHaveLength(1)
      expect(processed[0].filesChanged[0].filePath).toBe('src/App.tsx')
    })

    it('should call progress callback', async () => {
      const commits = [
        createMockGitHubCommit({ sha: 'commit1' }),
        createMockGitHubCommit({ sha: 'commit2' })
      ]
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: [] })
      })

      const progressCallback = vi.fn()

      await commitProcessor.processCommitsWithFiles(
        commits,
        'owner',
        'repo',
        'token',
        progressCallback
      )

      expect(progressCallback).toHaveBeenCalledWith(1, 2)
      expect(progressCallback).toHaveBeenCalledWith(2, 2)
    })

    it('should handle individual commit failures gracefully', async () => {
      const commits = [
        createMockGitHubCommit({ sha: 'good-commit' }),
        createMockGitHubCommit({ sha: 'bad-commit' })
      ]
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ files: [{ filename: 'test.txt', status: 'added', additions: 1, deletions: 0 }] })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })

      const processed = await commitProcessor.processCommitsWithFiles(
        commits,
        'owner',
        'repo',
        'token'
      )

      expect(processed).toHaveLength(2)
      expect(processed[0].filesChanged).toHaveLength(1)
      expect(processed[1].filesChanged).toHaveLength(0) // Failed commit should have empty files
    })
  })

  describe('commit message simulation', () => {
    it('should simulate file changes from commit messages', () => {
      const commit = {
        sha: 'abc123',
        timestamp: new Date(),
        author: 'John Doe',
        authorEmail: 'john@example.com',
        message: 'Add new App.tsx component',
        filesChanged: []
      }

      const changes = commitProcessor.simulateFileChangesFromMessage(commit)

      expect(changes).toHaveLength(1)
      expect(changes[0].changeType).toBe(FileChangeType.CREATE)
      expect(changes[0].filePath).toBe('App.tsx')
    })

    it('should detect different change types from messages', () => {
      const testCases = [
        { message: 'Delete old file.js', expectedType: FileChangeType.DELETE },
        { message: 'Update existing component.tsx', expectedType: FileChangeType.MODIFY },
        { message: 'Fix bug in handler.ts', expectedType: FileChangeType.MODIFY },
        { message: 'Create new service.py', expectedType: FileChangeType.CREATE }
      ]

      testCases.forEach(({ message, expectedType }) => {
        const commit = {
          sha: 'abc123',
          timestamp: new Date(),
          author: 'John Doe',
          authorEmail: 'john@example.com',
          message,
          filesChanged: []
        }

        const changes = commitProcessor.simulateFileChangesFromMessage(commit)
        expect(changes[0].changeType).toBe(expectedType)
      })
    })

    it('should extract multiple files from commit message', () => {
      const commit = {
        sha: 'abc123',
        timestamp: new Date(),
        author: 'John Doe',
        authorEmail: 'john@example.com',
        message: 'Update App.tsx and Header.tsx components',
        filesChanged: []
      }

      const changes = commitProcessor.simulateFileChangesFromMessage(commit)

      expect(changes).toHaveLength(2)
      expect(changes.map(c => c.filePath)).toContain('App.tsx')
      expect(changes.map(c => c.filePath)).toContain('Header.tsx')
    })
  })

  describe('commit analysis', () => {
    it('should analyze commit patterns', () => {
      const commits = [
        {
          sha: 'commit1',
          timestamp: new Date('2024-01-01'),
          author: 'John Doe',
          authorEmail: 'john@example.com',
          message: 'Initial commit',
          filesChanged: [
            { filePath: 'src/App.tsx', changeType: FileChangeType.CREATE, linesAdded: 50, linesDeleted: 0, status: 'added' as const },
            { filePath: 'src/utils.ts', changeType: FileChangeType.CREATE, linesAdded: 30, linesDeleted: 0, status: 'added' as const }
          ]
        },
        {
          sha: 'commit2',
          timestamp: new Date('2024-01-02'),
          author: 'Jane Smith',
          authorEmail: 'jane@example.com',
          message: 'Update App',
          filesChanged: [
            { filePath: 'src/App.tsx', changeType: FileChangeType.MODIFY, linesAdded: 10, linesDeleted: 5, status: 'modified' as const }
          ]
        }
      ]

      const analysis = commitProcessor.analyzeCommitPatterns(commits)

      expect(analysis.mostActiveFiles).toHaveLength(2)
      expect(analysis.mostActiveFiles[0].filePath).toBe('src/App.tsx')
      expect(analysis.mostActiveFiles[0].commitCount).toBe(2)

      expect(analysis.authorActivity).toHaveLength(2)
      expect(analysis.authorActivity[0].author).toBe('John Doe')
      expect(analysis.authorActivity[0].commitCount).toBe(1)
      expect(analysis.authorActivity[0].filesChanged).toBe(2)

      expect(analysis.fileTypeActivity).toContainEqual({ extension: 'tsx', commitCount: 2 })
      expect(analysis.fileTypeActivity).toContainEqual({ extension: 'ts', commitCount: 1 })

      expect(analysis.timelineActivity).toHaveLength(2)
    })
  })

  describe('filtering', () => {
    const commits = [
      {
        sha: 'commit1',
        timestamp: new Date('2024-01-01'),
        author: 'John Doe',
        authorEmail: 'john@example.com',
        message: 'Initial commit',
        filesChanged: [
          { filePath: 'src/App.tsx', changeType: FileChangeType.CREATE, linesAdded: 50, linesDeleted: 0, status: 'added' as const }
        ]
      },
      {
        sha: 'commit2',
        timestamp: new Date('2024-01-15'),
        author: 'Jane Smith',
        authorEmail: 'jane@example.com',
        message: 'Update styles',
        filesChanged: [
          { filePath: 'styles/main.css', changeType: FileChangeType.MODIFY, linesAdded: 10, linesDeleted: 5, status: 'modified' as const }
        ]
      }
    ]

    it('should filter commits by date range', () => {
      const filtered = commitProcessor.filterCommitsByDateRange(
        commits,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].sha).toBe('commit1')
    })

    it('should filter commits by author', () => {
      const filtered = commitProcessor.filterCommitsByAuthor(commits, 'Jane')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].author).toBe('Jane Smith')
    })

    it('should filter commits by file pattern', () => {
      const filtered = commitProcessor.filterCommitsByFilePattern(commits, /\.tsx$/)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].sha).toBe('commit1')
    })
  })
})