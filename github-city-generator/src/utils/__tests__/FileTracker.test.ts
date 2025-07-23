import { describe, it, expect, beforeEach } from 'vitest'
import { FileTracker } from '../FileTracker'
import { FileType, FileChangeType } from '../../types/city'

describe('FileTracker', () => {
  let fileTracker: FileTracker

  beforeEach(() => {
    fileTracker = new FileTracker()
  })

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

  describe('building creation', () => {
    it('should create a new building', () => {
      const layer = createMockLayer()
      const position = { x: 1, z: 1 }
      
      const result = fileTracker.createBuilding('src/App.tsx', position, layer)
      
      expect(result.success).toBe(true)
      expect(result.building).toBeDefined()
      expect(result.building?.filePath).toBe('src/App.tsx')
      expect(result.building?.position).toEqual(position)
      expect(result.building?.isActive).toBe(true)
      expect(result.building?.layers).toHaveLength(1)
    })

    it('should determine correct file type from extension', () => {
      const layer = createMockLayer()
      const position = { x: 1, z: 1 }
      
      const tests = [
        { file: 'App.tsx', expectedType: FileType.TYPESCRIPT },
        { file: 'script.js', expectedType: FileType.JAVASCRIPT },
        { file: 'styles.css', expectedType: FileType.CSS },
        { file: 'index.html', expectedType: FileType.HTML },
        { file: 'README.md', expectedType: FileType.MARKDOWN },
        { file: 'config.json', expectedType: FileType.JSON },
        { file: 'main.py', expectedType: FileType.PYTHON },
        { file: 'Main.java', expectedType: FileType.JAVA },
        { file: 'unknown.xyz', expectedType: FileType.OTHER }
      ]

      tests.forEach(({ file, expectedType }) => {
        const result = fileTracker.createBuilding(file, position, layer)
        expect(result.building?.fileType).toBe(expectedType)
        
        // Clean up for next test
        fileTracker.clear()
      })
    })

    it('should not create duplicate buildings', () => {
      const layer = createMockLayer()
      const position = { x: 1, z: 1 }
      
      const result1 = fileTracker.createBuilding('src/App.tsx', position, layer)
      expect(result1.success).toBe(true)
      
      const result2 = fileTracker.createBuilding('src/App.tsx', position, layer)
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('already exists')
    })
  })

  describe('layer management', () => {
    it('should add layer to existing building', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({
        commitSha: 'def456',
        timestamp: new Date('2024-01-02'),
        changeType: FileChangeType.MODIFY,
        linesAdded: 10,
        linesDeleted: 5
      })
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer1)
      const result = fileTracker.addLayer('src/App.tsx', layer2)
      
      expect(result.success).toBe(true)
      expect(result.building?.layers).toHaveLength(2)
      expect(result.building?.lastModified).toEqual(layer2.timestamp)
    })

    it('should not add layer to non-existent building', () => {
      const layer = createMockLayer()
      
      const result = fileTracker.addLayer('nonexistent.txt', layer)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No building found')
    })

    it('should not add layer to inactive building', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({
        commitSha: 'def456',
        changeType: FileChangeType.DELETE
      })
      const layer3 = createMockLayer({
        commitSha: 'ghi789',
        changeType: FileChangeType.MODIFY
      })
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer1)
      fileTracker.deleteBuilding('src/App.tsx', layer2)
      
      const result = fileTracker.addLayer('src/App.tsx', layer3)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('inactive building')
    })
  })

  describe('building deletion', () => {
    it('should mark building as deleted', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({
        commitSha: 'def456',
        changeType: FileChangeType.DELETE
      })
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer1)
      const result = fileTracker.deleteBuilding('src/App.tsx', layer2)
      
      expect(result.success).toBe(true)
      expect(result.building?.isActive).toBe(false)
      expect(result.building?.layers).toHaveLength(2)
      expect(result.building?.layers[1].changeType).toBe(FileChangeType.DELETE)
    })

    it('should not delete non-existent building', () => {
      const layer = createMockLayer({ changeType: FileChangeType.DELETE })
      
      const result = fileTracker.deleteBuilding('nonexistent.txt', layer)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No building found')
    })
  })

  describe('building moves', () => {
    it('should move building to new path and position', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({
        commitSha: 'def456',
        changeType: FileChangeType.MOVE
      })
      const position1 = { x: 1, z: 1 }
      const position2 = { x: 2, z: 2 }
      
      fileTracker.createBuilding('src/App.tsx', position1, layer1)
      const result = fileTracker.moveBuilding('src/App.tsx', 'src/components/App.tsx', position2, layer2)
      
      expect(result.success).toBe(true)
      expect(result.building?.filePath).toBe('src/components/App.tsx')
      expect(result.building?.position).toEqual(position2)
      expect(result.building?.layers).toHaveLength(2)
      
      // Old path should no longer exist
      const oldBuilding = fileTracker.getBuilding('src/App.tsx')
      expect(oldBuilding).toBeUndefined()
      
      // New path should exist
      const newBuilding = fileTracker.getBuilding('src/components/App.tsx')
      expect(newBuilding).toBeDefined()
    })

    it('should not move non-existent building', () => {
      const layer = createMockLayer({ changeType: FileChangeType.MOVE })
      const position = { x: 2, z: 2 }
      
      const result = fileTracker.moveBuilding('nonexistent.txt', 'moved.txt', position, layer)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No building found')
    })

    it('should not move to existing file path', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({ commitSha: 'def456' })
      const layer3 = createMockLayer({
        commitSha: 'ghi789',
        changeType: FileChangeType.MOVE
      })
      const position1 = { x: 1, z: 1 }
      const position2 = { x: 2, z: 2 }
      const position3 = { x: 3, z: 3 }
      
      fileTracker.createBuilding('src/App.tsx', position1, layer1)
      fileTracker.createBuilding('src/Header.tsx', position2, layer2)
      
      const result = fileTracker.moveBuilding('src/App.tsx', 'src/Header.tsx', position3, layer3)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists at destination')
    })
  })

     describe('building queries', () => {
     beforeEach(() => {
       const layer1 = createMockLayer({ timestamp: new Date('2024-01-01') })
       const layer2 = createMockLayer({
         commitSha: 'def456',
         timestamp: new Date('2024-01-02'),
         author: 'Jane Smith'
       })
       const layer3 = createMockLayer({
         commitSha: 'ghi789',
         timestamp: new Date('2024-01-03'),
         changeType: FileChangeType.DELETE
       })
       
       fileTracker.createBuilding('src/App.tsx', { x: 1, z: 1 }, layer1)
       fileTracker.createBuilding('src/Header.tsx', { x: 2, z: 2 }, layer2)
       fileTracker.createBuilding('src/Footer.tsx', { x: 3, z: 3 }, layer3)
       // Delete the Footer.tsx building
       fileTracker.deleteBuilding('src/Footer.tsx', layer3)
     })

    it('should get building by file path', () => {
      const building = fileTracker.getBuilding('src/App.tsx')
      
      expect(building).toBeDefined()
      expect(building?.filePath).toBe('src/App.tsx')
    })

    it('should get building by ID', () => {
      const building = fileTracker.getBuilding('src/App.tsx')
      const foundById = fileTracker.getBuildingById(building!.id)
      
      expect(foundById).toEqual(building)
    })

    it('should get only active buildings', () => {
      const activeBuildings = fileTracker.getActiveBuildings()
      
      expect(activeBuildings).toHaveLength(2) // App.tsx and Header.tsx (Footer.tsx is deleted)
      expect(activeBuildings.every(b => b.isActive)).toBe(true)
    })

    it('should get all buildings including inactive', () => {
      const allBuildings = fileTracker.getAllBuildings()
      
      expect(allBuildings).toHaveLength(3) // All buildings
    })

    it('should get buildings by file type', () => {
      const tsxBuildings = fileTracker.getBuildingsByType(FileType.TYPESCRIPT)
      
      expect(tsxBuildings).toHaveLength(3) // All are .tsx files
    })

    it('should get buildings by author', () => {
      const johnBuildings = fileTracker.getBuildingsByAuthor('John Doe')
      const janeBuildings = fileTracker.getBuildingsByAuthor('Jane Smith')
      
      expect(johnBuildings).toHaveLength(2) // App.tsx and Footer.tsx
      expect(janeBuildings).toHaveLength(1) // Header.tsx
    })

    it('should get buildings modified in date range', () => {
      const buildings = fileTracker.getBuildingsModifiedInRange(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )
      
      expect(buildings).toHaveLength(2) // App.tsx and Header.tsx
    })

    it('should get most active files', () => {
      // Add more layers to App.tsx
      const layer = createMockLayer({
        commitSha: 'extra1',
        changeType: FileChangeType.MODIFY
      })
      fileTracker.addLayer('src/App.tsx', layer)
      
      const mostActive = fileTracker.getMostActiveFiles(2)
      
      expect(mostActive).toHaveLength(2)
      expect(mostActive[0].filePath).toBe('src/App.tsx') // Should be first (most layers)
    })

    it('should get recently modified files', () => {
      const recent = fileTracker.getRecentlyModifiedFiles(2)
      
      expect(recent).toHaveLength(2)
      expect(recent[0].filePath).toBe('src/Footer.tsx') // Most recent
    })
  })

     describe('statistics', () => {
     beforeEach(() => {
       const layer1 = createMockLayer({ linesAdded: 100, linesDeleted: 10 })
       const layer2 = createMockLayer({
         commitSha: 'def456',
         linesAdded: 50,
         linesDeleted: 5
       })
       const layer3 = createMockLayer({
         commitSha: 'ghi789',
         changeType: FileChangeType.DELETE,
         linesAdded: 0,
         linesDeleted: 150
       })
       
       fileTracker.createBuilding('src/App.tsx', { x: 1, z: 1 }, layer1)
       fileTracker.addLayer('src/App.tsx', layer2)
       fileTracker.createBuilding('src/Header.tsx', { x: 2, z: 2 }, layer3)
       // Delete the Header.tsx building to make it inactive
       fileTracker.deleteBuilding('src/Header.tsx', layer3)
     })

         it('should provide accurate statistics', () => {
       const stats = fileTracker.getStatistics()
       
       expect(stats.totalBuildings).toBe(2)
       expect(stats.activeBuildings).toBe(1) // Only App.tsx is active
       expect(stats.inactiveBuildings).toBe(1) // Header.tsx is deleted
       expect(stats.totalLayers).toBe(4) // 2 for App.tsx, 2 for Header.tsx (create + delete)
       expect(stats.totalLinesAdded).toBe(150) // 100 + 50 + 0
       expect(stats.totalLinesDeleted).toBe(315) // 10 + 5 + 150 + 150 (deletion layer)
       expect(stats.averageLayersPerBuilding).toBe(2) // 4 layers / 2 buildings
     })

    it('should track file type counts', () => {
      const stats = fileTracker.getStatistics()
      
      expect(stats.fileTypeCounts[FileType.TYPESCRIPT]).toBe(2)
    })
  })

  describe('data persistence', () => {
    it('should export and import data correctly', () => {
      const layer = createMockLayer()
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer)
      
      const exportedData = fileTracker.exportData()
      expect(exportedData.buildings).toHaveLength(1)
      
      const newTracker = new FileTracker()
      newTracker.importData(exportedData)
      
      const importedBuilding = newTracker.getBuilding('src/App.tsx')
      expect(importedBuilding).toBeDefined()
      expect(importedBuilding?.filePath).toBe('src/App.tsx')
      expect(importedBuilding?.position).toEqual(position)
    })

    it('should handle empty import data', () => {
      fileTracker.importData({})
      
      const buildings = fileTracker.getAllBuildings()
      expect(buildings).toHaveLength(0)
    })
  })

  describe('building history', () => {
    it('should return complete building history', () => {
      const layer1 = createMockLayer()
      const layer2 = createMockLayer({
        commitSha: 'def456',
        changeType: FileChangeType.MODIFY
      })
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer1)
      fileTracker.addLayer('src/App.tsx', layer2)
      
      const history = fileTracker.getBuildingHistory('src/App.tsx')
      
      expect(history).toHaveLength(2)
      expect(history[0].commitSha).toBe('abc123')
      expect(history[1].commitSha).toBe('def456')
    })

    it('should return empty history for non-existent file', () => {
      const history = fileTracker.getBuildingHistory('nonexistent.txt')
      
      expect(history).toHaveLength(0)
    })
  })

  describe('clear functionality', () => {
    it('should clear all buildings', () => {
      const layer = createMockLayer()
      const position = { x: 1, z: 1 }
      
      fileTracker.createBuilding('src/App.tsx', position, layer)
      expect(fileTracker.getAllBuildings()).toHaveLength(1)
      
      fileTracker.clear()
      expect(fileTracker.getAllBuildings()).toHaveLength(0)
    })
  })
})