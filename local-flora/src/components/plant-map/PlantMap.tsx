import React, { useRef, useEffect, useState } from "react";
import { Map } from "maplibre-gl";
import type { LngLatLike, MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./PlantMap.css";
import SearchControl from "../search/SearchControl.tsx";

/**
 * The main map component for the Local Flora atlas.
 */
const PlantMap: React.FC = () => {
  // Refs to hold the map container element and the map instance
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  // State to manage map coordinates (optional, for display)
  const [lng, setLng] = useState(151.2);
  const [lat, setLat] = useState(-33.86);
  const [zoom, setZoom] = useState(5);

  // The ID for our plant data source and layers
  const plantDataSourceId = "banksia-serrata-data";
  const plantFillLayerId = "banksia-serrata-fill";
  const plantLineLayerId = "banksia-serrata-line";

  useEffect(() => {
    // Prevent map from re-initializing on hot reloads
    if (map.current || !mapContainer.current) return;

    const mapOptions: MapOptions = {
      container: mapContainer.current,
      // Using CartoDB Positron for a clean, minimalist base map
      style:
        "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
      center: [lng, lat] as LngLatLike, // Initial center over Eastern Australia
      zoom: zoom,
    };

    // Initialize the map
    map.current = new Map(mapOptions);
    const currentMap = map.current;

    // --- Map Event Handlers ---

    currentMap.on("load", () => {
      console.log("Map loaded. Adding plant data source...");

      // 1. Add the GeoJSON data source
      // This fetches the file from the public directory.
      currentMap.addSource(plantDataSourceId, {
        type: "geojson",
        data: "/data/8144360.geojson", // Path relative to the public folder
      });

      // 2. Add the semi-transparent fill layer
      currentMap.addLayer({
        id: plantFillLayerId,
        type: "fill",
        source: plantDataSourceId,
        layout: {},
        paint: {
          "fill-color": "#6B8E23", // An organic, sage-like green
          "fill-opacity": 0.4,
        },
      });

      // 3. Add the crisp boundary line layer
      currentMap.addLayer({
        id: plantLineLayerId,
        type: "line",
        source: plantDataSourceId,
        layout: {},
        paint: {
          "line-color": "#556B2F", // A darker shade of the fill
          "line-width": 2,
        },
      });

      console.log("Plant distribution layers added successfully.");
    });

    // Cleanup function to remove the map instance on component unmount
    return () => {
      currentMap.remove();
      map.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Handles the search submission.
   * In a real app, this would trigger a geocoding API call.
   */
  const handleSearch = (query: string) => {
    // Placeholder for future geocoding and map.flyTo() logic
    console.log(`Geocoding and flying to: ${query}`);
  };

  return (
    <div>
      <SearchControl onSearch={handleSearch} />
      <div ref={mapContainer} id="map-container" data-testid="map-container" />
    </div>
  );
};

export default PlantMap;
