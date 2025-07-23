import {
  CityState,
  CityConfig,
  ProcessedCommit,
  FileChangeType,
  BuildingGeometry,
  LayerGeometry,
  FileType,
  CityUpdateEvent
} from '../types/city';
import { GridManager } from './GridManager';
import { FileTracker } from './FileTracker';

/**
 * Core city generator functionality
 */
export class CityGeneratorCore {
  protected gridManager: GridManager;
  protected fileTracker: FileTracker;
  protected config: CityConfig;
  protected updateListeners: ((event: CityUpdateEvent) => void)[] = [];

  constructor(config: CityConfig) {
    this.config = config;
    this.gridManager = new GridManager(this.config.roadInterval);
    this.fileTracker = new FileTracker();
  }

  /**
   * Handle file creation
   */
  async handleFileCreation(filePath: string, layer: any): Promise<void> {
    if (this.fileTracker.getBuilding(filePath)) {
      console.warn(`Building already exists for file: ${filePath}`);
      return;
    }

    const buildingId = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allocation = this.gridManager.allocatePosition(filePath, buildingId);

    if (!allocation.success || !allocation.position) {
      console.error(`Failed to allocate position for file: ${filePath}`);
      return;
    }

    const result = this.fileTracker.createBuilding(filePath, allocation.position, layer);

    if (result.success && result.building) {
      this.emitUpdateEvent({
        type: 'building_created',
        buildingId: result.building.id,
        filePath,
        timestamp: layer.timestamp,
        details: { position: allocation.position }
      });
    }
  }

  /**
   * Handle file modification
   */
  async handleFileModification(filePath: string, layer: any): Promise<void> {
    const building = this.fileTracker.getBuilding(filePath);

    if (!building) {
      await this.handleFileCreation(filePath, layer);
      return;
    }

    const result = this.fileTracker.addLayer(filePath, layer);

    if (result.success && result.building) {
      this.emitUpdateEvent({
        type: 'building_updated',
        buildingId: result.building.id,
        filePath,
        timestamp: layer.timestamp,
        details: { layersCount: result.building.layers.length }
      });
    }
  }

  /**
   * Handle file deletion
   */
  async handleFileDeletion(filePath: string, layer: any): Promise<void> {
    const building = this.fileTracker.getBuilding(filePath);

    if (!building) {
      console.warn(`Cannot delete non-existent file: ${filePath}`);
      return;
    }

    const result = this.fileTracker.deleteBuilding(filePath, layer);

    if (result.success && result.building) {
      this.gridManager.freePosition(result.building.position);

      this.emitUpdateEvent({
        type: 'building_deleted',
        buildingId: result.building.id,
        filePath,
        timestamp: layer.timestamp,
        details: { finalLayersCount: result.building.layers.length }
      });
    }
  }

  /**
   * Handle file move/rename
   */
  async handleFileMove(oldPath: string, newPath: string, layer: any): Promise<void> {
    const building = this.fileTracker.getBuilding(oldPath);

    if (!building) {
      await this.handleFileCreation(newPath, layer);
      return;
    }

    this.gridManager.freePosition(building.position);

    const buildingId = building.id;
    const allocation = this.gridManager.allocatePosition(newPath, buildingId);

    if (!allocation.success || !allocation.position) {
      console.error(`Failed to allocate new position for moved file: ${newPath}`);
      return;
    }

    const result = this.fileTracker.moveBuilding(oldPath, newPath, allocation.position, layer);

    if (result.success && result.building) {
      this.emitUpdateEvent({
        type: 'building_moved',
        buildingId: result.building.id,
        filePath: newPath,
        timestamp: layer.timestamp,
        details: {
          oldPath,
          newPath,
          oldPosition: building.position,
          newPosition: allocation.position
        }
      });
    }
  }

  /**
   * Convert building data to 3D geometry
   */
  buildingToGeometry(building: any): BuildingGeometry | null {
    if (!building.isActive || building.layers.length === 0) {
      return null;
    }

    const position = building.position;
    const worldX = position.x * this.config.gridSpacing;
    const worldZ = position.z * this.config.gridSpacing;

    const layerCount = Math.min(building.layers.length, this.config.maxBuildingHeight / this.config.layerHeight);
    const totalHeight = layerCount * this.config.layerHeight;

    const layers: LayerGeometry[] = building.layers.slice(0, layerCount).map((layer: any, index: number) => {
      const age = Date.now() - layer.timestamp.getTime();
      const isRecent = age < 30 * 24 * 60 * 60 * 1000;
      
      return {
        height: this.config.layerHeight,
        color: isRecent ? this.config.colorScheme.recentActivity : this.config.colorScheme.oldActivity,
        opacity: Math.max(0.3, 1 - (age / (365 * 24 * 60 * 60 * 1000))),
        timestamp: layer.timestamp,
        author: layer.author
      };
    });

    return {
      position: [worldX, totalHeight / 2, worldZ],
      dimensions: [this.config.buildingBaseSize, totalHeight, this.config.buildingBaseSize],
      color: this.config.colorScheme.fileTypes[building.fileType] || this.config.colorScheme.buildingBase,
      layers,
      fileType: building.fileType
    };
  }

  /**
   * Emit update event to listeners
   */
  protected emitUpdateEvent(event: CityUpdateEvent): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in city update listener:', error);
      }
    });
  }

  /**
   * Add update event listener
   */
  addUpdateListener(listener: (event: CityUpdateEvent) => void): void {
    this.updateListeners.push(listener);
  }

  /**
   * Remove update event listener
   */
  removeUpdateListener(listener: (event: CityUpdateEvent) => void): void {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }
}
