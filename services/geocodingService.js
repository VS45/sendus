const { haversineDistanceKm } = require('../utils/distance');

async function geocodeAddress(address) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error('Mapbox is not configured. Enter latitude and longitude instead.');

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, { headers: { 'User-Agent': 'Send-Us/1.0' } });
  if (!response.ok) throw new Error('The geocoding service could not resolve that address.');
  const payload = await response.json();
  if (!payload.features?.length) throw new Error('No coordinates were found for that address.');

  const [longitude, latitude] = payload.features[0].center;
  return { latitude, longitude, resolvedAddress: payload.features[0].place_name };
}

async function resolveLocation({ address, latitude, longitude }) {
  let lat = Number(latitude);
  let lng = Number(longitude);
  let resolvedAddress = address;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const result = await geocodeAddress(address);
    lat = result.latitude;
    lng = result.longitude;
    resolvedAddress = result.resolvedAddress;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Latitude or longitude is outside the valid range.');
  }

  const companyLat = Number(process.env.COMPANY_LAT || 6.5244);
  const companyLng = Number(process.env.COMPANY_LNG || 3.3792);
  const distanceKm = haversineDistanceKm(companyLat, companyLng, lat, lng);

  return { address: resolvedAddress || `${lat}, ${lng}`, latitude: lat, longitude: lng, distanceKm };
}

module.exports = { geocodeAddress, resolveLocation };
