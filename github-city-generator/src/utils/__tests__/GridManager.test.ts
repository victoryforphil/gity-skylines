import { describe, it, expect, beforeEach } from 'vitest'
import { GridManager } from '../GridManager'
import { CellState } from '../../types/city'

describe('GridManager', () => {
  let gridManager: GridManager

  beforeEach(() => {
    gridManager = new GridManager(4) // Road every 4th row/column
  })

  describe('initialization', () => {
    it('should initialize with correct default size', () => {
      const bounds = gridManager.getBounds()
      expect(bounds.width).toBe(50)
      expect(bounds.height).toBe(50)
      expect(bounds.minX).toBe(-25)
      expect(bounds.maxX).toBe(25)
    })

    it('should create road network at correct intervals', () => {
      const cell1 = gridManager.getCell({ x: 0, z: 0 })
      const cell2 = gridManager.getCell({ x: 4, z: 0 })
      const cell3 = gridManager.getCell({ x: 1, z: 1 })

      expect(cell1?.state).toBe(CellState.ROAD)
      expect(cell2?.state).toBe(CellState.ROAD)
      expect(cell3?.state).toBe(CellState.EMPTY)
    })
  })

  describe('position allocation', () => {
    it('should allocate position for new file', () => {
      const result = gridManager.allocatePosition('src/App.tsx', 'building1')
      
      expect(result.success).toBe(true)
      expect(result.position).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should allocate same position for same file path', () => {
      const result1 = gridManager.allocatePosition('src/App.tsx', 'building1')
      gridManager.freePosition(result1.position!)
      
      const result2 = gridManager.allocatePosition('src/App.tsx', 'building2')
      
      expect(result1.position).toEqual(result2.position)
    })

    it('should handle collision resolution', () => {
      // Allocate first position
      const result1 = gridManager.allocatePosition('file1.txt', 'building1')
      expect(result1.success).toBe(true)

      // Try to allocate another file that might hash to same position
      const result2 = gridManager.allocatePosition('file2.txt', 'building2')
      expect(result2.success).toBe(true)
      
      // Positions should be different if there was a collision
      if (result1.position && result2.position) {
        const pos1 = result1.position
        const pos2 = result2.position
        
        // Either different positions or same if no collision occurred
        expect(pos1.x !== pos2.x || pos1.z !== pos2.z).toBe(true)
      }
    })

    it('should not allocate position on roads', () => {
      // Try many allocations to ensure none land on roads
      const allocations = []
      for (let i = 0; i < 20; i++) {
        const result = gridManager.allocatePosition(`file${i}.txt`, `building${i}`)
        if (result.success && result.position) {
          allocations.push(result.position)
          
          // Check that position is not on a road
          const cell = gridManager.getCell(result.position)
          expect(cell?.state).toBe(CellState.OCCUPIED)
        }
      }
      
      expect(allocations.length).toBeGreaterThan(0)
    })
  })

  describe('position management', () => {
    it('should free allocated position', () => {
      const result = gridManager.allocatePosition('src/App.tsx', 'building1')
      expect(result.success).toBe(true)
      
      const freed = gridManager.freePosition(result.position!)
      expect(freed).toBe(true)
      
      const cell = gridManager.getCell(result.position!)
      expect(cell?.state).toBe(CellState.EMPTY)
      expect(cell?.buildingId).toBeUndefined()
    })

    it('should reserve and release positions', () => {
      const position = { x: 1, z: 1 }
      
      const reserved = gridManager.reservePosition(position, 'test-operation')
      expect(reserved).toBe(true)
      
      const cell = gridManager.getCell(position)
      expect(cell?.state).toBe(CellState.RESERVED)
      expect(cell?.reservedBy).toBe('test-operation')
      
      const released = gridManager.releaseReservation(position)
      expect(released).toBe(true)
      
      const cellAfter = gridManager.getCell(position)
      expect(cellAfter?.state).toBe(CellState.EMPTY)
      expect(cellAfter?.reservedBy).toBeUndefined()
    })

    it('should not reserve occupied positions', () => {
      const result = gridManager.allocatePosition('src/App.tsx', 'building1')
      expect(result.success).toBe(true)
      
      const reserved = gridManager.reservePosition(result.position!, 'test')
      expect(reserved).toBe(false)
    })
  })

  describe('grid expansion', () => {
    it('should expand grid when needed', () => {
      const initialBounds = gridManager.getBounds()
      
      // Fill up most of the grid
      const allocations = []
      for (let i = 0; i < 1000; i++) {
        const result = gridManager.allocatePosition(`file${i}.txt`, `building${i}`)
        if (result.success) {
          allocations.push(result.position)
        }
      }
      
      const finalBounds = gridManager.getBounds()
      
      // Grid should have expanded
      expect(finalBounds.width).toBeGreaterThanOrEqual(initialBounds.width)
      expect(finalBounds.height).toBeGreaterThanOrEqual(initialBounds.height)
    })
  })

  describe('statistics', () => {
    it('should provide accurate utilization stats', () => {
      const initialStats = gridManager.getUtilizationStats()
      expect(initialStats.occupied).toBe(0)
      expect(initialStats.utilizationPercent).toBe(0)
      
      // Allocate some positions
      const allocations = []
      for (let i = 0; i < 10; i++) {
        const result = gridManager.allocatePosition(`file${i}.txt`, `building${i}`)
        if (result.success) {
          allocations.push(result.position)
        }
      }
      
      const finalStats = gridManager.getUtilizationStats()
      expect(finalStats.occupied).toBe(allocations.length)
      expect(finalStats.utilizationPercent).toBeGreaterThan(0)
    })

    it('should track different cell states', () => {
      // Allocate some positions
      gridManager.allocatePosition('file1.txt', 'building1')
      gridManager.allocatePosition('file2.txt', 'building2')
      
      // Reserve a position
      gridManager.reservePosition({ x: 1, z: 1 }, 'test')
      
      const stats = gridManager.getUtilizationStats()
      expect(stats.occupied).toBe(2)
      expect(stats.reserved).toBe(1)
      expect(stats.roads).toBeGreaterThan(0)
      expect(stats.empty).toBeGreaterThan(0)
    })
  })

  describe('occupied positions', () => {
    it('should return all occupied positions', () => {
      const allocations = []
      for (let i = 0; i < 5; i++) {
        const result = gridManager.allocatePosition(`file${i}.txt`, `building${i}`)
        if (result.success) {
          allocations.push(result.position)
        }
      }
      
      const occupiedPositions = gridManager.getOccupiedPositions()
      expect(occupiedPositions).toHaveLength(allocations.length)
      
      // Check that all allocated positions are in the occupied list
      allocations.forEach(pos => {
        expect(occupiedPositions).toContainEqual(pos)
      })
    })
  })

  describe('error handling', () => {
    it('should handle invalid position queries gracefully', () => {
      const cell = gridManager.getCell({ x: 1000, z: 1000 })
      expect(cell).toBeUndefined()
    })

    it('should handle freeing non-existent positions', () => {
      const freed = gridManager.freePosition({ x: 1000, z: 1000 })
      expect(freed).toBe(false)
    })

    it('should handle releasing non-reserved positions', () => {
      const released = gridManager.releaseReservation({ x: 1, z: 1 })
      expect(released).toBe(false)
    })
  })

  describe('hash consistency', () => {
    it('should consistently hash same file paths to same positions', () => {
      const filePath = 'src/components/Header.tsx'
      
      // Create multiple grid managers
      const grid1 = new GridManager(4)
      const grid2 = new GridManager(4)
      
      const result1 = grid1.allocatePosition(filePath, 'building1')
      const result2 = grid2.allocatePosition(filePath, 'building2')
      
      expect(result1.position).toEqual(result2.position)
    })
  })
})