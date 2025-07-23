import {
  CityState,
  CityConfig,
  ProcessedCommit,
  FileChangeType,
  BuildingGeometry,
  FileType
} from '../types/city';
import { CityGeneratorCore } from './CityGeneratorCore';
import { CommitProcessor } from './CommitProcessor';

/**
 * Main city generator that orchestrates the transformation of GitHub data into 3D city
 */
export class CityGenerator extends CityGeneratorCore {
  private commitProcessor: CommitProcessor;

  constructor(config?: Partial<CityConfig>) {
    const defaultConfig = CityGenerator.getDefaultConfig();
    const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
    
    super(finalConfig);
    this.commitProcessor = new CommitProcessor();
  }

  /**
   * Get default city configuration
   */
  static getDefaultConfig(): CityConfig {
    return {
      gridSpacing: 2,
      roadWidth: 0.5,
      roadInterval: 4,
      buildingBaseSize: 1,
      layerHeight: 0.2,
      maxBuildingHeight: 10,
      colorScheme: {
        fileTypes: {
          [FileType.JAVASCRIPT]: '#f7df1e',
          [FileType.TYPESCRIPT]: '#3178c6',
          [FileType.PYTHON]: '#3776ab',
          [FileType.JAVA]: '#ed8b00',
          [FileType.CSS]: '#1572b6',
          [FileType.HTML]: '#e34f26',
          [FileType.MARKDOWN]: '#083fa1',
          [FileType.JSON]: '#000000',
          [FileType.CONFIG]: '#6c757d',
          [FileType.IMAGE]: '#ff6b6b',
          [FileType.OTHER]: '#64748b'
        },
        buildingBase: '#64748b',
        roads: '#374151',
        terrain: '#065f46',
        recentActivity: '#10b981',
        oldActivity: '#6b7280'
      }
    };
  }

  /**
   * Process commits and generate city state
   */
  async generateCity(
    commits: ProcessedCommit[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<CityState> {
    this.reset();

    const sortedCommits = commits.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedCommits.length; i++) {
      await this.processCommit(sortedCommits[i]);
      
      if (onProgress) {
        onProgress(i + 1, sortedCommits.length);
      }
    }

    return this.getCityState();
  }

  /**
   * Process a single commit and update city state
   */
  private async processCommit(commit: ProcessedCommit): Promise<void> {
    for (const fileChange of commit.filesChanged) {
      await this.processFileChange(fileChange, commit);
    }
  }

  /**
   * Process a file change and update buildings
   */
  private async processFileChange(fileChange: any, commit: ProcessedCommit): Promise<void> {
    const layer = {
      commitSha: commit.sha,
      timestamp: commit.timestamp,
      author: commit.author,
      authorEmail: commit.authorEmail,
      changeType: fileChange.changeType,
      linesAdded: fileChange.linesAdded,
      linesDeleted: fileChange.linesDeleted,
      message: commit.message
    };

    switch (fileChange.changeType) {
      case FileChangeType.CREATE:
        await this.handleFileCreation(fileChange.filePath, layer);
        break;
      case FileChangeType.MODIFY:
        await this.handleFileModification(fileChange.filePath, layer);
        break;
      case FileChangeType.DELETE:
        await this.handleFileDeletion(fileChange.filePath, layer);
        break;
      case FileChangeType.RENAME:
      case FileChangeType.MOVE:
        await this.handleFileMove(
          fileChange.previousPath || fileChange.filePath,
          fileChange.filePath,
          layer
        );
        break;
    }
  }

  /**
   * Generate 3D building geometries for rendering
   */
  generateBuildingGeometries(): BuildingGeometry[] {
    const buildings = this.fileTracker.getActiveBuildings();
    const geometries: BuildingGeometry[] = [];

    for (const building of buildings) {
      const geometry = this.buildingToGeometry(building);
      if (geometry) {
        geometries.push(geometry);
      }
    }

    return geometries;
  }

  /**
   * Get current city state
   */
  getCityState(): CityState {
    const buildings = new Map();
    const allBuildings = this.fileTracker.getAllBuildings();
    
    allBuildings.forEach(building => {
      buildings.set(building.filePath, building);
    });

    return {
      buildings,
      grid: this.gridManager.getAllCells(),
      gridBounds: this.gridManager.getBounds(),
      totalCommits: this.getTotalCommits(),
      totalFiles: allBuildings.length,
      activeFiles: this.fileTracker.getActiveBuildings().length,
      lastUpdated: new Date()
    };
  }

  /**
   * Get total number of commits processed
   */
  private getTotalCommits(): number {
    return this.fileTracker.getAllBuildings().reduce((total, building) => {
      return total + building.layers.length;
    }, 0);
  }

  /**
   * Reset city state
   */
  reset(): void {
    this.fileTracker.clear();
    this.gridManager = new (this.gridManager.constructor as any)(this.config.roadInterval);
  }

  /**
   * Get city statistics
   */
  getStatistics() {
    const fileStats = this.fileTracker.getStatistics();
    const gridStats = this.gridManager.getUtilizationStats();

    return {
      ...fileStats,
      gridUtilization: gridStats.utilizationPercent,
      gridSize: `${gridStats.total} cells`,
      occupiedCells: gridStats.occupied,
      roadCells: gridStats.roads
    };
  }

  /**
   * Export city data for persistence
   */
  exportCityData(): any {
    return {
      config: this.config,
      fileTracker: this.fileTracker.exportData(),
      gridBounds: this.gridManager.getBounds(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import city data from persistence
   */
  importCityData(data: any): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    if (data.fileTracker) {
      this.fileTracker.importData(data.fileTracker);
    }

    this.rebuildGridFromBuildings();
  }

  /**
   * Rebuild grid state from existing buildings
   */
  private rebuildGridFromBuildings(): void {
    const buildings = this.fileTracker.getActiveBuildings();
    
    for (const building of buildings) {
      this.gridManager.allocatePosition(building.filePath, building.id);
    }
  }
}
