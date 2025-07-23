import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CityGenerator } from '../CityGeneratorMain'
import { FileChangeType, FileType } from '../../types/city'

describe('CityGenerator', () => {
  let cityGenerator: CityGenerator

  beforeEach(() => {
    cityGenerator = new CityGenerator({
      gridSpacing: 2,
      layerHeight: 0.2,
      maxBuildingHeight: 5
    })
  })

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
        status: 'added' as const
      }
    ],
    ...overrides
  })

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultGenerator = new CityGenerator()
      const config = defaultGenerator['config']
      
      expect(config.gridSpacing).toBe(2)
      expect(config.layerHeight).toBe(0.2)
      expect(config.roadInterval).toBe(4)
      expect(config.buildingBaseSize).toBe(1)
    })

    it('should merge custom configuration with defaults', () => {
      const customGenerator = new CityGenerator({
        gridSpacing: 3,
        layerHeight: 0.5
      })
      const config = customGenerator['config']
      
      expect(config.gridSpacing).toBe(3)
      expect(config.layerHeight).toBe(0.5)
      expect(config.roadInterval).toBe(4) // Should keep default
    })
  })

  describe('city generation', () => {
    it('should generate city from commits', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 10,
              linesDeleted: 5,
              status: 'modified' as const
            }
          ]
        })
      ]

      const cityState = await cityGenerator.generateCity(commits)

      expect(cityState.buildings.size).toBe(1)
      expect(cityState.totalCommits).toBe(2)
      expect(cityState.activeFiles).toBe(1)
      expect(cityState.totalFiles).toBe(1)
    })

    it('should process commits in chronological order', async () => {
      const commits = [
        createMockCommit({
          sha: 'second',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 10,
              linesDeleted: 0,
              status: 'modified' as const
            }
          ]
        }),
        createMockCommit({
          sha: 'first',
          timestamp: new Date('2024-01-01'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.CREATE,
              linesAdded: 50,
              linesDeleted: 0,
              status: 'added' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const building = cityGenerator['fileTracker'].getBuilding('src/App.tsx')

      expect(building?.layers).toHaveLength(2)
      expect(building?.layers[0].commitSha).toBe('first')
      expect(building?.layers[1].commitSha).toBe('second')
    })

    it('should call progress callback', async () => {
      const commits = [createMockCommit(), createMockCommit({ sha: 'def456' })]
      const progressCallback = vi.fn()

      await cityGenerator.generateCity(commits, progressCallback)

      expect(progressCallback).toHaveBeenCalledWith(1, 2)
      expect(progressCallback).toHaveBeenCalledWith(2, 2)
    })
  })

  describe('file operations', () => {
    it('should handle file creation', async () => {
      const commits = [createMockCommit()]

      await cityGenerator.generateCity(commits)
      const building = cityGenerator['fileTracker'].getBuilding('src/App.tsx')

      expect(building).toBeDefined()
      expect(building?.isActive).toBe(true)
      expect(building?.layers).toHaveLength(1)
      expect(building?.fileType).toBe(FileType.TYPESCRIPT)
    })

    it('should handle file modification', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 20,
              linesDeleted: 10,
              status: 'modified' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const building = cityGenerator['fileTracker'].getBuilding('src/App.tsx')

      expect(building?.layers).toHaveLength(2)
      expect(building?.layers[1].linesAdded).toBe(20)
      expect(building?.layers[1].linesDeleted).toBe(10)
    })

    it('should handle file deletion', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.DELETE,
              linesAdded: 0,
              linesDeleted: 50,
              status: 'removed' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const building = cityGenerator['fileTracker'].getBuilding('src/App.tsx')

      expect(building?.isActive).toBe(false)
      expect(building?.layers).toHaveLength(2)
      expect(building?.layers[1].changeType).toBe(FileChangeType.DELETE)
    })

    it('should handle file moves', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/components/App.tsx',
              previousPath: 'src/App.tsx',
              changeType: FileChangeType.MOVE,
              linesAdded: 5,
              linesDeleted: 0,
              status: 'renamed' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      
      const oldBuilding = cityGenerator['fileTracker'].getBuilding('src/App.tsx')
      const newBuilding = cityGenerator['fileTracker'].getBuilding('src/components/App.tsx')

      expect(oldBuilding).toBeUndefined()
      expect(newBuilding).toBeDefined()
      expect(newBuilding?.layers).toHaveLength(2)
    })

    it('should create building for modification of non-existent file', async () => {
      const commits = [
        createMockCommit({
          filesChanged: [
            {
              filePath: 'src/NewFile.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 30,
              linesDeleted: 0,
              status: 'modified' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const building = cityGenerator['fileTracker'].getBuilding('src/NewFile.tsx')

      expect(building).toBeDefined()
      expect(building?.isActive).toBe(true)
      expect(building?.layers).toHaveLength(1)
    })
  })

  describe('building geometry generation', () => {
    it('should generate building geometries', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          filesChanged: [
            {
              filePath: 'src/Header.tsx',
              changeType: FileChangeType.CREATE,
              linesAdded: 30,
              linesDeleted: 0,
              status: 'added' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const geometries = cityGenerator.generateBuildingGeometries()

      expect(geometries).toHaveLength(2)
      
      const appGeometry = geometries.find(g => g.fileType === FileType.TYPESCRIPT)
      expect(appGeometry).toBeDefined()
      expect(appGeometry?.position).toHaveLength(3) // [x, y, z]
      expect(appGeometry?.dimensions).toHaveLength(3) // [width, height, depth]
      expect(appGeometry?.layers).toHaveLength(1)
    })

    it('should not generate geometry for inactive buildings', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.DELETE,
              linesAdded: 0,
              linesDeleted: 50,
              status: 'removed' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const geometries = cityGenerator.generateBuildingGeometries()

      expect(geometries).toHaveLength(0)
    })

    it('should respect maximum building height', async () => {
      const commits = []
      // Create many commits to exceed max height
      for (let i = 0; i < 50; i++) {
        commits.push(createMockCommit({
          sha: `commit${i}`,
          timestamp: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: i === 0 ? FileChangeType.CREATE : FileChangeType.MODIFY,
              linesAdded: 10,
              linesDeleted: 0,
              status: i === 0 ? 'added' as const : 'modified' as const
            }
          ]
        }))
      }

      await cityGenerator.generateCity(commits)
      const geometries = cityGenerator.generateBuildingGeometries()

      expect(geometries).toHaveLength(1)
      const geometry = geometries[0]
      
      // Height should be capped at maxBuildingHeight
      expect(geometry.dimensions[1]).toBeLessThanOrEqual(5) // maxBuildingHeight from config
    })
  })

  describe('city state', () => {
    it('should provide accurate city state', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          filesChanged: [
            {
              filePath: 'src/Header.tsx',
              changeType: FileChangeType.CREATE,
              linesAdded: 30,
              linesDeleted: 0,
              status: 'added' as const
            }
          ]
        }),
        createMockCommit({
          sha: 'ghi789',
          filesChanged: [
            {
              filePath: 'src/Footer.tsx',
              changeType: FileChangeType.CREATE,
              linesAdded: 20,
              linesDeleted: 0,
              status: 'added' as const
            }
          ]
        })
      ]

      const cityState = await cityGenerator.generateCity(commits)

      expect(cityState.totalFiles).toBe(3)
      expect(cityState.activeFiles).toBe(3)
      expect(cityState.totalCommits).toBe(3)
      expect(cityState.buildings.size).toBe(3)
      expect(cityState.gridBounds).toBeDefined()
      expect(cityState.lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('statistics', () => {
    it('should provide city statistics', async () => {
      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 10,
              linesDeleted: 5,
              status: 'modified' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)
      const stats = cityGenerator.getStatistics()

      expect(stats.totalBuildings).toBe(1)
      expect(stats.activeBuildings).toBe(1)
      expect(stats.totalLayers).toBe(2)
      expect(stats.gridUtilization).toBeGreaterThan(0)
      expect(stats.occupiedCells).toBe(1)
    })
  })

  describe('event system', () => {
    it('should emit building created events', async () => {
      const eventListener = vi.fn()
      cityGenerator.addUpdateListener(eventListener)

      const commits = [createMockCommit()]
      await cityGenerator.generateCity(commits)

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'building_created',
          filePath: 'src/App.tsx'
        })
      )
    })

    it('should emit building updated events', async () => {
      const eventListener = vi.fn()
      cityGenerator.addUpdateListener(eventListener)

      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.MODIFY,
              linesAdded: 10,
              linesDeleted: 0,
              status: 'modified' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'building_updated',
          filePath: 'src/App.tsx'
        })
      )
    })

    it('should emit building deleted events', async () => {
      const eventListener = vi.fn()
      cityGenerator.addUpdateListener(eventListener)

      const commits = [
        createMockCommit(),
        createMockCommit({
          sha: 'def456',
          timestamp: new Date('2024-01-02'),
          filesChanged: [
            {
              filePath: 'src/App.tsx',
              changeType: FileChangeType.DELETE,
              linesAdded: 0,
              linesDeleted: 50,
              status: 'removed' as const
            }
          ]
        })
      ]

      await cityGenerator.generateCity(commits)

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'building_deleted',
          filePath: 'src/App.tsx'
        })
      )
    })

    it('should remove event listeners', async () => {
      const eventListener = vi.fn()
      cityGenerator.addUpdateListener(eventListener)
      cityGenerator.removeUpdateListener(eventListener)

      const commits = [createMockCommit()]
      await cityGenerator.generateCity(commits)

      expect(eventListener).not.toHaveBeenCalled()
    })
  })

  describe('data persistence', () => {
    it('should export city data', async () => {
      const commits = [createMockCommit()]
      await cityGenerator.generateCity(commits)

      const exportedData = cityGenerator.exportCityData()

      expect(exportedData.config).toBeDefined()
      expect(exportedData.fileTracker).toBeDefined()
      expect(exportedData.gridBounds).toBeDefined()
      expect(exportedData.timestamp).toBeDefined()
    })

    it('should import city data', async () => {
      const commits = [createMockCommit()]
      await cityGenerator.generateCity(commits)

      const exportedData = cityGenerator.exportCityData()
      
      const newGenerator = new CityGenerator()
      newGenerator.importCityData(exportedData)

      const importedBuilding = newGenerator['fileTracker'].getBuilding('src/App.tsx')
      expect(importedBuilding).toBeDefined()
    })
  })

  describe('reset functionality', () => {
    it('should reset city state', async () => {
      const commits = [createMockCommit()]
      await cityGenerator.generateCity(commits)

      expect(cityGenerator['fileTracker'].getAllBuildings()).toHaveLength(1)

      cityGenerator.reset()

      expect(cityGenerator['fileTracker'].getAllBuildings()).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should handle commits with no file changes', async () => {
      const commits = [
        createMockCommit({
          filesChanged: []
        })
      ]

      const cityState = await cityGenerator.generateCity(commits)

      expect(cityState.totalFiles).toBe(0)
      expect(cityState.activeFiles).toBe(0)
    })

    it('should handle malformed commit data gracefully', async () => {
      const commits = [
        {
          sha: 'malformed',
          timestamp: new Date(),
          author: 'Test',
          authorEmail: 'test@example.com',
          message: 'Test',
          filesChanged: [
            {
              filePath: '', // Empty file path
              changeType: FileChangeType.CREATE,
              linesAdded: 0,
              linesDeleted: 0,
              status: 'added' as const
            }
          ]
        }
      ]

      // Should not throw an error
      await expect(cityGenerator.generateCity(commits)).resolves.toBeDefined()
    })
  })
})