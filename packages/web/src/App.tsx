import { useState, useEffect, useRef } from 'react'
import { reverseGeocode } from './api'
import { EnhancedMap } from './components/EnhancedMap'
import mapboxgl from 'mapbox-gl'
import './App.css'

// Helper function to generate a circle polygon
function generateCircle(center: [number, number], radiusKm: number, points: number): [number, number][] {
  const coordinates: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = center[1] + (radiusKm / 111.32) * Math.cos(angle);
    const lng = center[0] + (radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(angle);
    coordinates.push([lng, lat]);
  }
  coordinates.push(coordinates[0]); // Close the polygon
  return coordinates;
}

interface LocationData {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
  address?: string
}

function App() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAccuracy, setShowAccuracy] = useState(true)
  const mapRef = useRef<any>(null)

  const getCurrentLocation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const newLocation: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp
      }

      setLocation(newLocation)
      
      // Fetch address for the new location
      try {
        const addressData = await reverseGeocode(newLocation.lat, newLocation.lng)
        setLocation(prev => prev ? { ...prev, address: addressData.address } : null)
      } catch (err) {
        console.warn('Failed to fetch address:', err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
    } finally {
      setLoading(false)
    }
  }

  const copyCoordinates = () => {
    if (location) {
      const coords = `${location.lat}, ${location.lng}`
      navigator.clipboard.writeText(coords)
        .then(() => alert('Coordinates copied to clipboard!'))
        .catch(() => alert('Failed to copy coordinates'))
    }
  }

  const recenterMap = () => {
    if (location && mapRef.current) {
      mapRef.current.flyTo({ center: [location.lng, location.lat] })
    }
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  if (!location) {
    return (
      <div className="app">
        <div className="loading-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Getting your location...</p>
            </div>
          ) : error ? (
            <div className="error">
              <p>❌ {error}</p>
              <button onClick={getCurrentLocation} className="btn btn-primary">
                Try Again
              </button>
            </div>
          ) : (
            <div className="welcome">
              <h1>🌍 Where Am I?</h1>
              <p>Click the button below to get your current location</p>
              <button onClick={getCurrentLocation} className="btn btn-primary">
                Get My Location
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="controls">
        <button 
          onClick={getCurrentLocation} 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? '🔄' : '📍'} Refresh Location
        </button>
        <button onClick={recenterMap} className="btn btn-secondary">
          🎯 Re-center
        </button>
        <button onClick={copyCoordinates} className="btn btn-secondary">
          📋 Copy Coords
        </button>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showAccuracy}
            onChange={(e) => setShowAccuracy(e.target.checked)}
          />
          Show Accuracy
        </label>
      </div>

      <div className="map-container">
        <EnhancedMap
          center={[location.lng, location.lat]}
          zoom={16}
          showBuildings={true}
          showTerrain={true}
          onMapLoad={(map) => {
            mapRef.current = map;
            
            // Add a marker for the user's location
            new mapboxgl.Marker({ color: '#007AFF' })
              .setLngLat([location.lng, location.lat])
              .setPopup(
                new mapboxgl.Popup()
                  .setHTML(`
                    <div class="popup-content">
                      <h3>📍 Your Location</h3>
                      <p><strong>Coordinates:</strong></p>
                      <p>Lat: ${location.lat.toFixed(6)}</p>
                      <p>Lng: ${location.lng.toFixed(6)}</p>
                      <p><strong>Accuracy:</strong> ±${Math.round(location.accuracy)}m</p>
                      <p><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
                      ${location.address ? `
                        <p><strong>Address:</strong></p>
                        <p>${location.address}</p>
                      ` : ''}
                    </div>
                  `)
              )
              .addTo(map);
            
            // Add accuracy circle if enabled
            if (showAccuracy && location.accuracy > 0) {
              // Create a circle using Mapbox GL JS
              const circle = {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [generateCircle([location.lng, location.lat], location.accuracy / 1000, 64)]
                },
                properties: {}
              };
              
              map.addSource('accuracy-circle', {
                type: 'geojson',
                data: circle as any
              });
              
              map.addLayer({
                id: 'accuracy-circle-fill',
                type: 'fill',
                source: 'accuracy-circle',
                paint: {
                  'fill-color': '#FF3B30',
                  'fill-opacity': 0.1
                }
              });
              
              map.addLayer({
                id: 'accuracy-circle-outline',
                type: 'line',
                source: 'accuracy-circle',
                paint: {
                  'line-color': '#FF3B30',
                  'line-width': 2,
                  'line-opacity': 0.6
                }
              });
            }
          }}
        />
      </div>
    </div>
  )
}

export default App
