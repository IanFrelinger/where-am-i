import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface EnhancedMapProps {
  center: [number, number];
  zoom: number;
  showBuildings?: boolean;
  showTerrain?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export const EnhancedMap: React.FC<EnhancedMapProps> = ({
  center,
  zoom,
  showBuildings = true,
  showTerrain = true,
  onMapLoad
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  // Get Mapbox access token from environment or use fallback
  const getMapboxToken = () => {
    // Try to get from environment variable first
    const envToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
    if (envToken && envToken !== 'your-mapbox-access-token-here') {
      return envToken;
    }
    
    // Fallback to valid token
    return 'pk.eyJ1IjoiaWNmcmVsaW5nZXIiLCJhIjoiY20zcW92ZnEyMHNqeTJtcTJ5c2Fza3hoNSJ9.12y7S2B9pkn4PzRPjvaGxw';
  };

  useEffect(() => {
    if (!containerRef.current) {
      setError('Container ref is null');
      return;
    }

    // Check if Mapbox is available
    if (!mapboxgl) {
      setError('Mapbox library not available');
      return;
    }

    if (!mapboxgl.Map) {
      setError('Mapbox library not available');
      return;
    }

    const accessToken = getMapboxToken();
    
    if (!accessToken || accessToken === 'your-mapbox-access-token-here') {
      setError('Mapbox access token not configured. Please set VITE_MAPBOX_ACCESS_TOKEN in your environment variables.');
      return;
    }

    try {
      mapboxgl.accessToken = accessToken;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom,
        pitch: 45, // Add some pitch for 3D effect
        bearing: 0
      });

      mapRef.current = map;

      // Add comprehensive error handling for map loading
      map.on('error', (e) => {
        console.error('Map error event:', e);
        setError(`Map error event: ${e.error?.message || 'Unknown error'}`);
      });

      map.on('load', () => {
        console.log('Map loaded successfully!');
        setMapLoaded(true);
        setError(null);
        
        // Now that the map is fully loaded, add all the features
        try {
          // Add 3D terrain first
          if (showTerrain) {
            add3DTerrain(map);
          }
          
          // Add 3D buildings
          if (showBuildings) {
            add3DBuildings(map);
          }
          
          console.log('All map features added successfully');
        } catch (featureError) {
          console.error('Error adding map features:', featureError);
        }

        // Call the onMapLoad callback if provided
        if (onMapLoad) {
          onMapLoad(map);
        }
      });

      // Add a simple error handler for the map
      map.on('error', (e) => {
        console.error('Map error event (duplicate):', e);
        setError(`Map error event: ${e.error?.message || 'Unknown error'}`);
      });

      // Add a simple render handler to see if the map is actually rendering
      map.on('render', () => {
        console.log('Map render event fired');
      });

      // Add a simple idle handler to see if the map finishes loading
      map.on('idle', () => {
        console.log('Map idle event fired - map is ready');
      });

      // Add a simple style load handler
      map.on('style.load', () => {
        console.log('Map style loaded');
      });

      // Add a simple data load handler
      map.on('data', (e) => {
        console.log('Map data event:', e.type);
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setError(`Failed to create map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return () => {
      console.log('Cleanup - removing map');
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [center, zoom, showBuildings, showTerrain, onMapLoad]);

  // Control layer visibility based on props
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Control buildings layer
    if (mapRef.current.getLayer('3d-buildings')) {
      mapRef.current.setLayoutProperty('3d-buildings', 'visibility', showBuildings ? 'visible' : 'none');
    }

    // Control terrain - this affects the overall 3D terrain
    if (showTerrain) {
      // Terrain is controlled by map.setTerrain() which is already set
      console.log('3D terrain enabled');
    } else {
      // Disable terrain by setting it to null
      mapRef.current.setTerrain(null);
    }

  }, [showBuildings, showTerrain, mapLoaded]);

  const add3DTerrain = (map: mapboxgl.Map) => {
    try {
      console.log('Adding 3D terrain...');
      
      // Add terrain source
      map.addSource('mapbox-terrain', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      // Add terrain layer
      map.setTerrain({
        'source': 'mapbox-terrain',
        'exaggeration': 1.5 // Exaggerate terrain height for better visibility
      });

      console.log('3D terrain added successfully');

    } catch (error) {
      console.error('Error adding 3D terrain:', error);
      
      // Fallback: try with different terrain source
      try {
        console.log('Trying fallback terrain approach...');
        map.addSource('terrain-source', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.terrain-rgb',
          'tileSize': 256,
          'maxzoom': 15
        });

        map.setTerrain({
          'source': 'terrain-source',
          'exaggeration': 1.0
        });
        
        console.log('Fallback terrain added');
      } catch (fallbackError) {
        console.error('Fallback terrain also failed:', fallbackError);
      }
    }
  };

  const add3DBuildings = (map: mapboxgl.Map) => {
    try {
      console.log('Adding 3D buildings with terrain...');
      
      // Remove existing layer if it exists
      if (map.getLayer('3d-buildings')) {
        map.removeLayer('3d-buildings');
      }

      // Check if the source exists
      if (!map.getSource('composite')) {
        console.log('Composite source not available, trying alternative approach...');
        return;
      }

      // Add 3D buildings with terrain integration
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#007AFF', // iOS blue for hover
            '#8E8E93'  // iOS gray for normal
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.8,
          'fill-extrusion-translate': [0, 0],
          'fill-extrusion-translate-anchor': 'map'
        }
      });

      console.log('3D buildings layer added successfully with terrain');

      // Add hover effect
      map.on('mouseenter', '3d-buildings', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        // Show building tooltip
        if (e.features && e.features[0] && e.features[0].properties) {
          const properties = e.features[0].properties;
          setTooltip({
            visible: true,
            content: `🏢 BUILDING INFO\nHeight: ${properties.height || 'Unknown'}m\nType: ${properties.building || 'Commercial'}\nAddress: ${properties.address || 'Location available'}`,
            x: e.point.x,
            y: e.point.y
          });
        }
      });

      map.on('mouseleave', '3d-buildings', () => {
        map.getCanvas().style.cursor = '';
        setTooltip(prev => ({ ...prev, visible: false }));
      });

      // Add click interaction for building details
      map.on('click', '3d-buildings', (e) => {
        if (e.features && e.features[0] && e.features[0].properties) {
          const properties = e.features[0].properties;
          
          // Create popup with building information
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; padding: 16px; min-width: 280px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <div style="
                    width: 16px; 
                    height: 16px; 
                    border-radius: 50%; 
                    background-color: #007AFF;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 0 8px rgba(0,0,0,0.3);
                  "></div>
                  <h3 style="margin: 0; color: #007AFF; font-size: 18px; font-weight: 600;">
                    Building Information
                  </h3>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="
                    display: inline-block;
                    padding: 6px 12px;
                    background-color: #007AFF;
                    color: #FFFFFF;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                  ">
                    ${properties.building || 'Commercial'} Building
                  </span>
                </div>
                <div style="margin-bottom: 8px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">
                    <strong>Height:</strong> ${properties.height || 'Unknown'}m
                  </p>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">
                    <strong>Base Height:</strong> ${properties.min_height || 'Ground'}m
                  </p>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">
                    <strong>Type:</strong> ${properties.building || 'Commercial'}
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #8E8E93;">
                    <strong>Address:</strong> ${properties.address || 'Location available'}
                  </p>
                </div>
              </div>
            `)
            .addTo(map);
        }
      });

    } catch (error) {
      console.error('Error adding 3D buildings:', error);
      
      // Fallback: try with a different approach
      try {
        console.log('Trying fallback 3D buildings approach...');
        map.addLayer({
          'id': '3d-buildings-fallback',
          'source': 'composite',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#007AFF',
            'fill-extrusion-height': 50, // Fixed height as fallback
            'fill-extrusion-opacity': 0.6
          }
        });
        console.log('Fallback 3D buildings added');
      } catch (fallbackError) {
        console.error('Fallback 3D buildings also failed:', fallbackError);
      }
    }
  };

  if (error) {
    return (
      <div className="map-error">
        <div className="error-content">
          <h3>❌ Map Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-map-container">
      <div ref={containerRef} className="enhanced-map" />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="map-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      {/* Map Controls */}
      <div className="map-controls">
        <div className="control-group">
          <label className="control-toggle">
            <input
              type="checkbox"
              checked={showBuildings}
              onChange={(e) => {
                if (mapRef.current && mapLoaded) {
                  const visibility = e.target.checked ? 'visible' : 'none';
                  if (mapRef.current.getLayer('3d-buildings')) {
                    mapRef.current.setLayoutProperty('3d-buildings', 'visibility', visibility);
                  }
                }
              }}
            />
            <span>3D Buildings</span>
          </label>
          
          <label className="control-toggle">
            <input
              type="checkbox"
              checked={showTerrain}
              onChange={(e) => {
                if (mapRef.current && mapLoaded) {
                  if (e.target.checked) {
                    add3DTerrain(mapRef.current);
                  } else {
                    mapRef.current.setTerrain(null);
                  }
                }
              }}
            />
            <span>3D Terrain</span>
          </label>
        </div>
      </div>
    </div>
  );
};
