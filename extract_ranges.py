import json
import os
from typing import List, Dict, Any, Optional

import requests
from shapely.geometry import Point, MultiPoint
from shapely.ops import unary_union

class GbifRangeExtractor:
    """
    Extracts plant occurrence data from GBIF for a given species in Australia,
    processes it into a geographic range polygon, and saves it as a GeoJSON file.
    """
    BASE_API_URL = "https://api.gbif.org/v1"
    # A simple bounding box for mainland Australia to filter out extreme outliers.
    # (min_lon, min_lat, max_lon, max_lat)
    AUSTRALIA_BOUNDS = (112.0, -44.0, 154.0, -9.0)

    def __init__(self, output_dir: str = "public/data"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"Created directory: {self.output_dir}")

    def get_species_key(self, scientific_name: str) -> Optional[int]:
        """
        Resolves the GBIF taxonKey for a given scientific name.
        """
        print(f"Resolving taxon key for '{scientific_name}'...")
        try:
            response = requests.get(
                f"{self.BASE_API_URL}/species/match",
                params={"name": scientific_name, "kingdom": "Plantae"}
            )
            response.raise_for_status()
            data = response.json()
            if "usageKey" in data:
                print(f"Found taxonKey: {data['usageKey']}")
                return data["usageKey"]
            else:
                print(f"Warning: Could not resolve taxon key for '{scientific_name}'.")
                return None
        except requests.exceptions.RequestException as e:
            print(f"Error querying GBIF Species API: {e}")
            return None

    def get_occurrence_data(self, taxon_key: int) -> List[Dict[str, Any]]:
        """
        Fetches all occurrence records for a given taxonKey within Australia.
        Handles pagination to retrieve all records.
        """
        print(f"Fetching occurrence data for taxonKey: {taxon_key}")
        occurrences = []
        offset = 0
        limit = 300  # GBIF API page size limit

        while True:
            try:
                response = requests.get(
                    f"{self.BASE_API_URL}/occurrence/search",
                    params={
                        "taxonKey": taxon_key,
                        "country": "AU",
                        "hasCoordinate": "true",
                        "limit": limit,
                        "offset": offset,
                    },
                )
                response.raise_for_status()
                data = response.json()
                
                results = data.get("results", [])
                occurrences.extend(results)

                if data.get("endOfRecords", True):
                    break
                offset += len(results)

            except requests.exceptions.RequestException as e:
                print(f"Error fetching occurrence data: {e}")
                break
        
        print(f"Found {len(occurrences)} raw occurrence records.")
        return occurrences

    def create_range_polygon(self, occurrences: List[Dict[str, Any]]):
        """
        Processes occurrence coordinates into a concave hull or buffered convex hull.
        """
        print("Generating range polygon...")
        points = []
        for occ in occurrences:
            lon, lat = occ.get("decimalLongitude"), occ.get("decimalLatitude")
            if lon is not None and lat is not None:
                # Filter points to be within the rough Australian bounds
                if (self.AUSTRALIA_BOUNDS[0] <= lon <= self.AUSTRALIA_BOUNDS[2] and
                    self.AUSTRALIA_BOUNDS[1] <= lat <= self.AUSTRALIA_BOUNDS[3]):
                    points.append(Point(lon, lat))

        if len(points) < 3:
            print("Warning: Not enough valid points to generate a polygon.")
            return None

        point_cloud = MultiPoint(points)
        print(f"Processing {len(points)} valid coordinate points.")

        # Use concave_hull if enough points, otherwise a buffered convex_hull.
        # The 'ratio' parameter controls the concavity. 1.0 is convex hull.
        # A value like 0.3 is a good starting point for concave hulls.
        try:
            # For dense point clouds, concave hull is great.
            if len(points) > 30:
                polygon = point_cloud.concave_hull(ratio=0.3, allow_holes=True)
            else:
                # For sparse data, a buffered convex hull is more robust.
                polygon = point_cloud.convex_hull.buffer(0.1)
        except Exception as e:
            print(f"Could not generate concave hull, falling back to buffered convex hull. Reason: {e}")
            polygon = point_cloud.convex_hull.buffer(0.1)

        # If clustering results in separate polygons, unary_union will create a MultiPolygon
        final_geometry = unary_union(polygon)
        print(f"Generated a {final_geometry.geom_type}.")
        return final_geometry

    def export_to_geojson(self, taxon_key: int, scientific_name: str, record_count: int, geometry) -> None:
        """
        Exports the geometry and metadata to a GeoJSON file.
        """
        if geometry is None:
            print("Skipping file export as no geometry was generated.")
            return

        output_path = os.path.join(self.output_dir, f"{taxon_key}.geojson")
        
        feature = {
            "type": "Feature",
            "geometry": geometry.__geo_interface__,
            "properties": {}
        }

        feature_collection = {
            "type": "FeatureCollection",
            "properties": {
                "taxonKey": taxon_key,
                "scientificName": scientific_name,
                "recordCount": record_count,
            },
            "features": [feature],
        }

        try:
            with open(output_path, "w") as f:
                json.dump(feature_collection, f, indent=2)
            print(f"Successfully exported GeoJSON to: {output_path}")
        except IOError as e:
            print(f"Error writing to file {output_path}: {e}")

    def process_species(self, scientific_name: str):
        """
        Main orchestration method to run the full pipeline for a single species.
        """
        print("-" * 50)
        taxon_key = self.get_species_key(scientific_name)
        if not taxon_key:
            return

        occurrences = self.get_occurrence_data(taxon_key)
        if not occurrences:
            print(f"No occurrences found for {scientific_name} in Australia.")
            return

        geometry = self.create_range_polygon(occurrences)
        self.export_to_geojson(
            taxon_key=taxon_key,
            scientific_name=scientific_name,
            record_count=len(occurrences),
            geometry=geometry
        )
        print("-" * 50)


if __name__ == "__main__":
    # --- Species to Process ---
    target_species = [
        "Banksia serrata",
        "Eucalyptus globulus",
        "Acacia pycnantha", # Golden Wattle
        "Doryanthes excelsa" # Gymea Lily - might have a more clustered distribution
    ]

    extractor = GbifRangeExtractor(output_dir="public/data")

    for species_name in target_species:
        extractor.process_species(species_name)

