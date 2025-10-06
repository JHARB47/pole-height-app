/**
 * GIS/GPS Validation Utilities
 * Validates coordinates, geometries, and geospatial data
 */

/**
 * Coordinate validation errors
 */
export class CoordinateValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = "CoordinateValidationError";
    this.field = field;
    this.value = value;
  }
}

/**
 * Validate latitude value
 * @param {number|string} lat - Latitude value
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateLatitude(lat) {
  const num = typeof lat === "number" ? lat : parseFloat(lat);

  if (isNaN(num)) {
    return {
      valid: false,
      error: "Latitude must be a valid number",
    };
  }

  if (num < -90 || num > 90) {
    return {
      valid: false,
      error: "Latitude must be between -90 and 90 degrees",
    };
  }

  return { valid: true, value: num };
}

/**
 * Validate longitude value
 * @param {number|string} lon - Longitude value
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateLongitude(lon) {
  const num = typeof lon === "number" ? lon : parseFloat(lon);

  if (isNaN(num)) {
    return {
      valid: false,
      error: "Longitude must be a valid number",
    };
  }

  if (num < -180 || num > 180) {
    return {
      valid: false,
      error: "Longitude must be between -180 and 180 degrees",
    };
  }

  return { valid: true, value: num };
}

/**
 * Validate coordinate pair
 * @param {number|string} lat - Latitude
 * @param {number|string} lon - Longitude
 * @returns {{ valid: boolean, coordinates?: [number, number], errors?: string[] }}
 */
export function validateCoordinates(lat, lon) {
  const errors = [];

  const latResult = validateLatitude(lat);
  if (!latResult.valid) {
    errors.push(latResult.error);
  }

  const lonResult = validateLongitude(lon);
  if (!lonResult.valid) {
    errors.push(lonResult.error);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    coordinates: [lonResult.value, latResult.value], // GeoJSON format [lon, lat]
  };
}

/**
 * Validate GeoJSON Point geometry
 * @param {any} point - Point geometry object
 * @returns {{ valid: boolean, geometry?: any, error?: string }}
 */
export function validatePointGeometry(point) {
  if (!point || typeof point !== "object") {
    return {
      valid: false,
      error: "Point geometry must be an object",
    };
  }

  if (point.type !== "Point") {
    return {
      valid: false,
      error: `Expected Point geometry, got ${point.type}`,
    };
  }

  if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    return {
      valid: false,
      error: "Point coordinates must be an array of [longitude, latitude]",
    };
  }

  const [lon, lat] = point.coordinates;
  const result = validateCoordinates(lat, lon);

  if (!result.valid) {
    return {
      valid: false,
      error: result.errors.join("; "),
    };
  }

  return {
    valid: true,
    geometry: {
      type: "Point",
      coordinates: result.coordinates,
    },
  };
}

/**
 * Validate GeoJSON LineString geometry
 * @param {any} lineString - LineString geometry object
 * @returns {{ valid: boolean, geometry?: any, error?: string }}
 */
export function validateLineStringGeometry(lineString) {
  if (!lineString || typeof lineString !== "object") {
    return {
      valid: false,
      error: "LineString geometry must be an object",
    };
  }

  if (lineString.type !== "LineString") {
    return {
      valid: false,
      error: `Expected LineString geometry, got ${lineString.type}`,
    };
  }

  if (
    !Array.isArray(lineString.coordinates) ||
    lineString.coordinates.length < 2
  ) {
    return {
      valid: false,
      error: "LineString must have at least 2 coordinate pairs",
    };
  }

  const validatedCoordinates = [];
  const errors = [];

  lineString.coordinates.forEach((coord, index) => {
    if (!Array.isArray(coord) || coord.length !== 2) {
      errors.push(`Invalid coordinate at index ${index}`);
      return;
    }

    const [lon, lat] = coord;
    const result = validateCoordinates(lat, lon);

    if (!result.valid) {
      errors.push(`Coordinate ${index}: ${result.errors.join(", ")}`);
    } else {
      validatedCoordinates.push(result.coordinates);
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join("; "),
    };
  }

  return {
    valid: true,
    geometry: {
      type: "LineString",
      coordinates: validatedCoordinates,
    },
  };
}

/**
 * Validate GeoJSON Feature
 * @param {any} feature - GeoJSON Feature object
 * @returns {{ valid: boolean, feature?: any, errors?: string[] }}
 */
export function validateGeoJSONFeature(feature) {
  const errors = [];

  if (!feature || typeof feature !== "object") {
    return {
      valid: false,
      errors: ["Feature must be an object"],
    };
  }

  if (feature.type !== "Feature") {
    errors.push(`Expected Feature type, got ${feature.type}`);
  }

  if (!feature.geometry) {
    errors.push("Feature must have a geometry property");
  } else {
    let geometryResult;

    switch (feature.geometry.type) {
      case "Point":
        geometryResult = validatePointGeometry(feature.geometry);
        break;
      case "LineString":
        geometryResult = validateLineStringGeometry(feature.geometry);
        break;
      default:
        errors.push(`Unsupported geometry type: ${feature.geometry.type}`);
    }

    if (geometryResult && !geometryResult.valid) {
      errors.push(geometryResult.error);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    feature: {
      type: "Feature",
      geometry: feature.geometry,
      properties: feature.properties || {},
    },
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {[number, number]} coord1 - [lon, lat]
 * @param {[number, number]} coord2 - [lon, lat]
 * @returns {number} Distance in meters
 */
export function calculateDistance(coord1, coord2) {
  const R = 6371e3; // Earth's radius in meters
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Validate that coordinates are within a reasonable distance
 * @param {[number, number]} coord1 - [lon, lat]
 * @param {[number, number]} coord2 - [lon, lat]
 * @param {number} maxDistanceMeters - Maximum allowed distance
 * @returns {{ valid: boolean, distance?: number, error?: string }}
 */
export function validateDistanceBetweenPoints(
  coord1,
  coord2,
  maxDistanceMeters = 10000,
) {
  const distance = calculateDistance(coord1, coord2);

  if (distance > maxDistanceMeters) {
    return {
      valid: false,
      distance,
      error: `Distance between points (${Math.round(distance)}m) exceeds maximum allowed (${maxDistanceMeters}m)`,
    };
  }

  return {
    valid: true,
    distance,
  };
}

/**
 * Validate pole coordinates with context
 * @param {any} pole - Pole object with latitude/longitude
 * @returns {{ valid: boolean, errors?: string[], warnings?: string[] }}
 */
export function validatePoleCoordinates(pole) {
  const errors = [];
  const warnings = [];

  // Check if both coordinates are missing (distinguish from 0,0)
  if (pole.latitude === undefined && pole.longitude === undefined) {
    warnings.push("No coordinates provided for pole");
    return { valid: true, warnings };
  }

  if (
    pole.latitude !== undefined &&
    pole.latitude !== null &&
    (pole.longitude === undefined || pole.longitude === null)
  ) {
    errors.push("Latitude provided without longitude");
  }

  if (
    pole.longitude !== undefined &&
    pole.longitude !== null &&
    (pole.latitude === undefined || pole.latitude === null)
  ) {
    errors.push("Longitude provided without latitude");
  }

  if (
    pole.latitude !== undefined &&
    pole.latitude !== null &&
    pole.longitude !== undefined &&
    pole.longitude !== null
  ) {
    const result = validateCoordinates(pole.latitude, pole.longitude);
    if (!result.valid) {
      errors.push(...result.errors);
    }

    // Check if coordinates are at [0, 0] (likely an error)
    if (
      result.valid &&
      result.coordinates[0] === 0 &&
      result.coordinates[1] === 0
    ) {
      warnings.push("Coordinates are at [0, 0] - this is likely unintentional");
    }

    // Check if coordinates are very close to [0, 0] (null island proximity)
    if (result.valid) {
      const lat = Math.abs(result.coordinates[1]);
      const lon = Math.abs(result.coordinates[0]);
      if (lat < 0.001 && lon < 0.001 && !(lat === 0 && lon === 0)) {
        warnings.push("Coordinates very close to [0, 0] - please verify");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors, // Always return array
    warnings: warnings.length > 0 ? warnings : [],
  };
}

/**
 * Batch validate multiple poles
 * @param {any[]} poles - Array of pole objects
 * @returns {{ valid: boolean, results: any[], summary: any }}
 */
export function validatePoleBatch(poles) {
  const results = poles.map((pole, index) => ({
    index,
    poleId: pole.id,
    ...validatePoleCoordinates(pole),
  }));

  const errors = results.filter((r) => !r.valid);
  const warnings = results.filter((r) => r.warnings && r.warnings.length > 0);

  return {
    valid: errors.length === 0,
    results,
    summary: {
      total: poles.length,
      valid: poles.length - errors.length,
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}
