/**
 * GitHub City Generator Utilities
 * 
 * This module provides utility classes for transforming GitHub repository data
 * into 3D city visualizations where files are buildings and commits are layers.
 */

// Core utility classes
export { GridManager } from './GridManager';
export { FileTracker } from './FileTracker';
export { CommitProcessor } from './CommitProcessor';
export { CityGenerator } from './CityGeneratorMain';

// Existing GitHub utilities
export { 
  GitHubApiClient, 
  createGitHubClient, 
  getRepositoryCommits, 
  useGitHubCommits 
} from './github';

// Type definitions
export * from '../types/city';
export * from '../types/github';

// Utility functions
export const createDefaultCityConfig = () => {
  return {
    gridSpacing: 2,
    roadWidth: 0.5,
    roadInterval: 4,
    buildingBaseSize: 1,
    layerHeight: 0.2,
    maxBuildingHeight: 10
  };
};

export const createCityFromGitHubRepo = async (
  owner: string,
  repo: string,
  token?: string,
  config?: any,
  onProgress?: (stage: string, progress: number, total: number) => void
) => {
  const { CityGenerator } = await import('./CityGeneratorMain');
  const { CommitProcessor } = await import('./CommitProcessor');
  const { getRepositoryCommits } = await import('./github');

  try {
    // Step 1: Fetch commits
    onProgress?.('Fetching commits', 0, 3);
    const commits = await getRepositoryCommits(owner, repo, { 
      token, 
      per_page: 100 
    });

    // Step 2: Process commits with file details
    onProgress?.('Processing commits', 1, 3);
    const processor = new CommitProcessor();
    const processedCommits = await processor.processCommitsWithFiles(
      commits,
      owner,
      repo,
      token,
      (processed, total) => {
        onProgress?.('Processing commits', processed, total);
      }
    );

    // Step 3: Generate city
    onProgress?.('Generating city', 2, 3);
    const cityGenerator = new CityGenerator(config);
    const cityState = await cityGenerator.generateCity(
      processedCommits,
      (processed, total) => {
        onProgress?.('Generating city', processed, total);
      }
    );

    onProgress?.('Complete', 3, 3);
    
    return {
      cityState,
      cityGenerator,
      commits: processedCommits,
      statistics: cityGenerator.getStatistics()
    };

  } catch (error) {
    throw new Error(`Failed to create city from GitHub repo: ${error}`);
  }
};
