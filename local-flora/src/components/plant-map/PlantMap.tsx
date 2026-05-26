import React, { useRef, useEffect, useState } from "react";
import { LngLatBounds, Map } from "maplibre-gl";
import type { LngLatLike, MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./PlantMap.css";
import SearchControl from "../search/SearchControl.tsx";

interface PlantMapProps {
  /** The GBIF taxonKey for the species to display. */
  taxonKey: number;
  /** The scientific name of the species. */
  scientificName: string;
}

/**
 * The main map component for the Local Flora atlas.
 */
const PlantMap: React.FC<PlantMapProps> = ({ taxonKey, scientificName }) => {
  // Refs to hold the map container element and the map instance
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  // The ID for our plant data source and layers
  const plantDataSourceId = `plant-data-${taxonKey}`;
  const plantFillLayerId = `plant-fill-${taxonKey}`;
  const plantLineLayerId = `plant-line-${taxonKey}`;

  useEffect(() => {
    // Prevent map from re-initializing on hot reloads
    if (map.current || !mapContainer.current) return;

    // Define a bounding box that encompasses all of Australia, including Tasmania.
    const australiaBounds = new LngLatBounds([
      [112, -44], // Southwest corner
      [154, -10], // Northeast corner
    ]);

    const mapOptions: MapOptions = {
      container: mapContainer.current,
      // Using CartoDB Positron for a clean, minimalist base map
      style:
        "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
      bounds: australiaBounds,
      fitBoundsOptions: {
        padding: 20, // Add some padding so the country isn't flush against the edges
      },
      attributionControl: false, // Disable the default attribution control
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
        data: `/data/${taxonKey}.geojson`, // Path relative to the public folder
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
          "line-color": "#5d782e", // A darker shade of the fill
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
  }, [taxonKey]); // Re-run effect if the taxonKey changes

  /**
   * Handles the search submission.
   * In a real app, this would trigger a geocoding API call.
   */
  const handleSearch = (query: string) => {
    // Placeholder for future geocoding and map.flyTo() logic
    console.log(
      `Search for '${query}' submitted for map of '${scientificName}'`,
    );
  };

  return (
    <div>
      <SearchControl onSearch={handleSearch} />
      <div ref={mapContainer} id="map-container" data-testid="map-container" />
    </div>
  );
};

export default PlantMap;
