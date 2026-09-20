"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type {
  Amenity,
  LatLng,
  ScoredRoute,
} from "@/lib/types";

const style: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

type MapViewProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  routes: ScoredRoute[];
  amenities: Amenity[];
};

export default function MapView({
  origin,
  destination,
  routes,
  amenities,
}: MapViewProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  const originMarkerRef =
    useRef<maplibregl.Marker | null>(null);

  const destinationMarkerRef =
    useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const map =
      new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [
          78.9629,
          20.5937,
        ],
        zoom: 4,
      });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const drawRoutes = () => {
      /*
       * Remove previously rendered route layers.
       */
      for (const id of [
        "route-0",
        "route-1",
        "route-2",
      ]) {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      }

      if (map.getSource("routes")) {
        map.removeSource("routes");
      }

      /*
       * If there are no routes, there is
       * nothing to draw.
       */
      if (!routes.length) {
        return;
      }

      const features =
        routes.map((route, index) => ({
          type: "Feature" as const,
          properties: {
            index,
          },
          geometry: {
            type: "LineString" as const,
            coordinates:
              route.geometry.map(
                (point) => [
                  point.lng,
                  point.lat,
                ]
              ),
          },
        }));

      const collection = {
        type: "FeatureCollection" as const,
        features,
      };

      map.addSource("routes", {
        type: "geojson",
        data: collection,
      });

      map.addLayer({
        id: "route-0",
        type: "line",
        source: "routes",
        filter: [
          "==",
          ["get", "index"],
          0,
        ],
        paint: {
          "line-color": "#0a8f55",
          "line-width": 6,
          "line-opacity": 0.9,
        },
      });

      if (routes.length > 1) {
        map.addLayer({
          id: "route-1",
          type: "line",
          source: "routes",
          filter: [
            "==",
            ["get", "index"],
            1,
          ],
          paint: {
            "line-color": "#7a9b87",
            "line-width": 4,
            "line-opacity": 0.7,
            "line-dasharray": [
              2,
              2,
            ],
          },
        });
      }

      if (routes.length > 2) {
        map.addLayer({
          id: "route-2",
          type: "line",
          source: "routes",
          filter: [
            "==",
            ["get", "index"],
            2,
          ],
          paint: {
            "line-color": "#b9c8be",
            "line-width": 3,
            "line-opacity": 0.7,
          },
        });
      }

      /*
       * Fit the map to all route coordinates.
       */
      const bounds =
        new maplibregl.LngLatBounds();

      routes.forEach((route) => {
        route.geometry.forEach(
          (point) => {
            bounds.extend([
              point.lng,
              point.lat,
            ]);
          }
        );
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 70,
          duration: 700,
          maxZoom: 15,
        });
      }
    };

    if (map.isStyleLoaded()) {
      drawRoutes();
    } else {
      map.once("load", drawRoutes);
    }

    return () => {
      map.off("load", drawRoutes);
    };
  }, [routes]);

  /*
   * Origin and destination markers.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (origin) {
      originMarkerRef.current =
        new maplibregl.Marker({
          color: "#0a8f55",
        })
          .setLngLat([
            origin.lng,
            origin.lat,
          ])
          .addTo(map);
    }

    if (destination) {
      destinationMarkerRef.current =
        new maplibregl.Marker({
          color: "#14532d",
        })
          .setLngLat([
            destination.lng,
            destination.lat,
          ])
          .addTo(map);
    }
  }, [origin, destination]);

  /*
   * Keep the component compatible with the
   * current SafePath architecture. Amenities
   * will be used by the safety engine and can
   * later be displayed as map markers.
   */
  useEffect(() => {
    void amenities;
  }, [amenities]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 500,
      }}
    />
  );
}