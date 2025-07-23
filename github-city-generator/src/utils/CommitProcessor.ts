import { GitHubCommit } from '../types/github';
import {
  ProcessedCommit,
  FileChange,
  FileChangeType
} from '../types/city';

/**
 * Processes GitHub commit data into city-compatible format
 * Handles commit analysis and file change extraction
 */
export class CommitProcessor {
  /**
   * Process a single GitHub commit into city format
   */
  processCommit(commit: GitHubCommit): ProcessedCommit {
    return {
      sha: commit.sha,
      timestamp: new Date(commit.commit.author.date),
      author: commit.commit.author.name,
      authorEmail: commit.commit.author.email,
      message: commit.commit.message,
      filesChanged: [] // Will be populated by getCommitFiles
    };
  }

  /**
   * Process multiple commits in chronological order
   */
  processCommits(commits: GitHubCommit[]): ProcessedCommit[] {
    return commits
      .map(commit => this.processCommit(commit))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Fetch detailed file changes for a commit using GitHub API
   * Note: This requires an additional API call per commit
   */
  async getCommitFiles(
    owner: string,
    repo: string,
    commitSha: string,
    token?: string
  ): Promise<FileChange[]> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'github-city-generator'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const commitDetails = await response.json();
      return this.extractFileChanges(commitDetails.files || []);
    } catch (error) {
      console.error(`Failed to fetch commit files for ${commitSha}:`, error);
      return [];
    }
  }

  /**
   * Extract file changes from GitHub commit file data
   */
  private extractFileChanges(files: any[]): FileChange[] {
    return files.map(file => this.parseFileChange(file));
  }

  /**
   * Parse a single file change from GitHub API data
   */
  private parseFileChange(file: any): FileChange {
    const changeType = this.determineChangeType(file.status, file.previous_filename);
    
    return {
      filePath: file.filename,
      previousPath: file.previous_filename,
      changeType,
      linesAdded: file.additions || 0,
      linesDeleted: file.deletions || 0,
      status: file.status
    };
  }

  /**
   * Determine the type of file change
   */
  private determineChangeType(status: string, previousFilename?: string): FileChangeType {
    switch (status) {
      case 'added':
        return FileChangeType.CREATE;
      case 'modified':
        return FileChangeType.MODIFY;
      case 'removed':
        return FileChangeType.DELETE;
      case 'renamed':
        return previousFilename ? FileChangeType.RENAME : FileChangeType.MOVE;
      default:
        return FileChangeType.MODIFY;
    }
  }

  /**
   * Process commits with file details (makes additional API calls)
   */
  async processCommitsWithFiles(
    commits: GitHubCommit[],
    owner: string,
    repo: string,
    token?: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<ProcessedCommit[]> {
    const processedCommits: ProcessedCommit[] = [];
    
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const processedCommit = this.processCommit(commit);
      
      try {
        processedCommit.filesChanged = await this.getCommitFiles(
          owner,
          repo,
          commit.sha,
          token
        );
      } catch (error) {
        console.error(`Failed to process commit ${commit.sha}:`, error);
        processedCommit.filesChanged = [];
      }

      processedCommits.push(processedCommit);
      
      if (onProgress) {
        onProgress(i + 1, commits.length);
      }

      // Add small delay to avoid rate limiting
      if (i < commits.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return processedCommits.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Simulate file changes from commit messages (when detailed API data unavailable)
   * This is a fallback method that makes educated guesses
   */
  simulateFileChangesFromMessage(commit: ProcessedCommit): FileChange[] {
    const message = commit.message.toLowerCase();
    const changes: FileChange[] = [];

    // Simple heuristics based on commit message patterns
    const createPatterns = ['add', 'create', 'new', 'initial'];
    const modifyPatterns = ['update', 'fix', 'change', 'modify', 'improve'];
    const deletePatterns = ['delete', 'remove', 'drop'];

    let changeType = FileChangeType.MODIFY; // default

    if (createPatterns.some(pattern => message.includes(pattern))) {
      changeType = FileChangeType.CREATE;
    } else if (deletePatterns.some(pattern => message.includes(pattern))) {
      changeType = FileChangeType.DELETE;
    }

    // Extract potential file names from commit message
    const fileExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.css', '.html', '.md'];
    const fileMatches = commit.message.match(/\b\w+\.(js|ts|tsx|jsx|py|java|css|html|md|json|yml|yaml)\b/gi);

    if (fileMatches) {
      fileMatches.forEach(filename => {
        changes.push({
          filePath: filename,
          changeType,
          linesAdded: Math.floor(Math.random() * 50) + 1,
          linesDeleted: changeType === FileChangeType.DELETE ? Math.floor(Math.random() * 100) : 0,
          status: this.changeTypeToStatus(changeType)
        });
      });
    } else {
      // Generate a generic file change
      changes.push({
        filePath: `src/unknown_${commit.sha.substring(0, 8)}.js`,
        changeType,
        linesAdded: Math.floor(Math.random() * 20) + 1,
        linesDeleted: Math.floor(Math.random() * 10),
        status: this.changeTypeToStatus(changeType)
      });
    }

    return changes;
  }

  /**
   * Convert FileChangeType to GitHub status string
   */
  private changeTypeToStatus(changeType: FileChangeType): 'added' | 'modified' | 'removed' | 'renamed' {
    switch (changeType) {
      case FileChangeType.CREATE:
        return 'added';
      case FileChangeType.DELETE:
        return 'removed';
      case FileChangeType.RENAME:
      case FileChangeType.MOVE:
        return 'renamed';
      default:
        return 'modified';
    }
  }

  /**
   * Analyze commit patterns to identify file operations
   */
  analyzeCommitPatterns(commits: ProcessedCommit[]): {
    mostActiveFiles: { filePath: string; commitCount: number }[];
    authorActivity: { author: string; commitCount: number; filesChanged: number }[];
    fileTypeActivity: { extension: string; commitCount: number }[];
    timelineActivity: { date: string; commitCount: number }[];
  } {
    const fileActivity = new Map<string, number>();
    const authorActivity = new Map<string, { commitCount: number; filesChanged: Set<string> }>();
    const fileTypeActivity = new Map<string, number>();
    const timelineActivity = new Map<string, number>();

    commits.forEach(commit => {
      // Track file activity
      commit.filesChanged.forEach(file => {
        fileActivity.set(file.filePath, (fileActivity.get(file.filePath) || 0) + 1);
        
        // Track file type activity
        const extension = file.filePath.split('.').pop()?.toLowerCase() || 'unknown';
        fileTypeActivity.set(extension, (fileTypeActivity.get(extension) || 0) + 1);
      });

      // Track author activity
      const author = commit.author;
      if (!authorActivity.has(author)) {
        authorActivity.set(author, { commitCount: 0, filesChanged: new Set() });
      }
      const authorData = authorActivity.get(author)!;
      authorData.commitCount++;
      commit.filesChanged.forEach(file => authorData.filesChanged.add(file.filePath));

      // Track timeline activity
      const dateKey = commit.timestamp.toISOString().split('T')[0];
      timelineActivity.set(dateKey, (timelineActivity.get(dateKey) || 0) + 1);
    });

    return {
      mostActiveFiles: Array.from(fileActivity.entries())
        .map(([filePath, commitCount]) => ({ filePath, commitCount }))
        .sort((a, b) => b.commitCount - a.commitCount)
        .slice(0, 20),

      authorActivity: Array.from(authorActivity.entries())
        .map(([author, data]) => ({
          author,
          commitCount: data.commitCount,
          filesChanged: data.filesChanged.size
        }))
        .sort((a, b) => b.commitCount - a.commitCount),

      fileTypeActivity: Array.from(fileTypeActivity.entries())
        .map(([extension, commitCount]) => ({ extension, commitCount }))
        .sort((a, b) => b.commitCount - a.commitCount),

      timelineActivity: Array.from(timelineActivity.entries())
        .map(([date, commitCount]) => ({ date, commitCount }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  /**
   * Filter commits by date range
   */
  filterCommitsByDateRange(
    commits: ProcessedCommit[],
    startDate: Date,
    endDate: Date
  ): ProcessedCommit[] {
    return commits.filter(commit =>
      commit.timestamp >= startDate && commit.timestamp <= endDate
    );
  }

  /**
   * Filter commits by author
   */
  filterCommitsByAuthor(commits: ProcessedCommit[], author: string): ProcessedCommit[] {
    return commits.filter(commit =>
      commit.author.toLowerCase().includes(author.toLowerCase()) ||
      commit.authorEmail.toLowerCase().includes(author.toLowerCase())
    );
  }

  /**
   * Filter commits by file path pattern
   */
  filterCommitsByFilePattern(commits: ProcessedCommit[], pattern: RegExp): ProcessedCommit[] {
    return commits.filter(commit =>
      commit.filesChanged.some(file => pattern.test(file.filePath))
    );
  }
}
