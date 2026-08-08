/**
 * Haversine formula to compute distance in kilometers between two GPS points
 */
const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Greedy Traveling Salesperson Problem (TSP) Optimization
 * @param {Object} startCoords - { latitude, longitude } of driver
 * @param {Array} pickups - Array of pickup request documents
 * @returns {Array} Optimized array of pickups
 */
const optimizeRoute = (startCoords, pickups) => {
  if (!pickups || pickups.length === 0) return [];
  if (!startCoords || typeof startCoords.latitude !== 'number') {
    // If no start coordinates are available, return the default database list
    return pickups;
  }

  const unvisited = [...pickups];
  const optimized = [];
  let currentLat = startCoords.latitude;
  let currentLon = startCoords.longitude;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const item = unvisited[i];
      const dist = getHaversineDistance(
        currentLat,
        currentLon,
        item.location.latitude,
        item.location.longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    // Move nearest request to optimized list
    const nextPickup = unvisited.splice(nearestIdx, 1)[0];
    optimized.push(nextPickup);

    // Update current location to this pickup's spot
    currentLat = nextPickup.location.latitude;
    currentLon = nextPickup.location.longitude;
  }

  return optimized;
};

module.exports = {
  getHaversineDistance,
  optimizeRoute
};
