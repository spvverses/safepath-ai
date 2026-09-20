import type {
  LatLng,
  ScoredRoute,
  SafetyBreakdown,
  Amenity,
} from "./types";

export function haversine(
  a: LatLng,
  b: LatLng
) {
  const R = 6371000;
  const p = Math.PI / 180;

  const dLat = (b.lat - a.lat) * p;
  const dLon = (b.lng - a.lng) * p;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * p) *
      Math.cos(b.lat * p) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.asin(Math.sqrt(x))
  );
}

export function nightNow(
  date = new Date()
) {
  const h = date.getHours();

  return h < 6 || h >= 19;
}

export function distanceToNearest(
  point: LatLng,
  items: Amenity[]
) {
  let best = Infinity;

  for (const item of items) {
    best = Math.min(
      best,
      haversine(point, item)
    );
  }

  return best;
}

export function scoreRoute(
  route: {
    geometry: LatLng[];
    distance: number;
    duration: number;
  },
  amenities: Amenity[],
  night: boolean,
  weather: {
    precipitation: number;
    wind: number;
  }
): {
  score: number;
  breakdown: SafetyBreakdown;
  reasons: string[];
} {
  const police = amenities.filter(
    (amenity) =>
      amenity.kind === "police"
  );

  const medical = amenities.filter(
    (amenity) =>
      [
        "hospital",
        "clinic",
        "pharmacy",
      ].includes(amenity.kind)
  );

  const shops = amenities.filter(
    (amenity) =>
      amenity.kind === "shop"
  );

  const samples = route.geometry.filter(
    (_, index) =>
      index %
        Math.max(
          1,
          Math.floor(
            route.geometry.length / 30
          )
        ) === 0
  );

  const emergency = samples.length
    ? Math.max(
        0,
        100 -
          (
            samples.reduce(
              (sum, point) =>
                sum +
                Math.min(
                  distanceToNearest(
                    point,
                    [
                      ...police,
                      ...medical,
                    ]
                  ),
                  2000
                ),
              0
            ) /
            samples.length
          ) /
            20
      )
    : 50;

  const populated = samples.length
    ? Math.max(
        0,
        100 -
          (
            samples.reduce(
              (sum, point) =>
                sum +
                Math.min(
                  distanceToNearest(
                    point,
                    shops
                  ),
                  3000
                ),
              0
            ) /
            samples.length
          ) /
            30
      )
    : 50;

  const lighting = night
    ? Math.max(
        10,
        Math.min(
          100,
          populated * 0.65 +
            emergency * 0.35
        )
      )
    : 90;

  const isolation = Math.max(
    0,
    100 -
      populated * 0.65 -
      emergency * 0.35
  );

  /*
   * Weather safety score.
   *
   * This is intentionally named weatherScore
   * so it does not conflict with the weather
   * function parameter above.
   */
  const weatherScore = Math.max(
    5,
    100 -
      Math.min(
        60,
        weather.precipitation * 15
      ) -
      Math.min(
        25,
        weather.wind * 1.2
      )
  );

  const time = night ? 55 : 90;

  const score = Math.round(
    lighting * 0.22 +
      populated * 0.18 +
      emergency * 0.24 +
      (100 - isolation) * 0.16 +
      weatherScore * 0.12 +
      time * 0.08
  );

  const reasons: string[] = [];

  if (night) {
    reasons.push(
      "Night-time visibility is weighted heavily."
    );
  }

  if (emergency > 65) {
    reasons.push(
      "Emergency/medical access is relatively close along sampled segments."
    );
  }

  if (populated < 45) {
    reasons.push(
      "Some segments appear less populated from mapped amenities."
    );
  }

  if (weatherScore < 70) {
    reasons.push(
      "Current weather reduces the safety score."
    );
  }

  return {
    score,
    breakdown: {
      lighting: Math.round(lighting),
      populated: Math.round(populated),
      emergency: Math.round(emergency),
      isolation: Math.round(isolation),
      weather: Math.round(weatherScore),
      time,
    },
    reasons,
  };
}

