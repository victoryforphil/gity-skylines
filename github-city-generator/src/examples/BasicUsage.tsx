import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CityGenerator } from '../utils/CityGeneratorMain';

/**
 * Basic usage example of the City Generator utilities
 */
export const BasicCityExample: React.FC = () => {
  const [cityState, setCityState] = useState(null);
  const [loading, setLoading] = useState(false);

  const cityGenerator = useMemo(() => new CityGenerator({
    gridSpacing: 2,
    layerHeight: 0.3,
    maxBuildingHeight: 10
  }), []);

  const generateExampleCity = async () => {
    setLoading(true);
    
    // Create some example commit data
    const exampleCommits = [
      {
        sha: 'abc123',
        timestamp: new Date('2024-01-01'),
        author: 'John Doe',
        authorEmail: 'john@example.com',
        message: 'Initial commit',
        filesChanged: [
          {
            filePath: 'src/App.tsx',
            changeType: 'create',
            linesAdded: 50,
            linesDeleted: 0,
            status: 'added'
          }
        ]
      },
      {
        sha: 'def456',
        timestamp: new Date('2024-01-02'),
        author: 'Jane Smith',
        authorEmail: 'jane@example.com',
        message: 'Add components',
        filesChanged: [
          {
            filePath: 'src/components/Header.tsx',
            changeType: 'create',
            linesAdded: 30,
            linesDeleted: 0,
            status: 'added'
          },
          {
            filePath: 'src/App.tsx',
            changeType: 'modify',
            linesAdded: 10,
            linesDeleted: 5,
            status: 'modified'
          }
        ]
      }
    ];

    try {
      const newCityState = await cityGenerator.generateCity(exampleCommits);
      setCityState(newCityState);
    } catch (error) {
      console.error('Failed to generate city:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildingGeometries = useMemo(() => {
    if (!cityState) return [];
    return cityGenerator.generateBuildingGeometries();
  }, [cityState, cityGenerator]);

  return (
    <div className="basic-city-example">
      <div className="controls p-4">
        <button
          onClick={generateExampleCity}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Generating...' : 'Generate Example City'}
        </button>
      </div>

      <div style={{ height: '500px' }}>
        <Canvas camera={{ position: [10, 10, 10] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          
          {buildingGeometries.map((geometry, index) => (
            <mesh key={index} position={geometry.position}>
              <boxGeometry args={geometry.dimensions} />
              <meshStandardMaterial color={geometry.color} />
            </mesh>
          ))}

          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
};

export default BasicCityExample;
