/**
 * Weather Service
 * Fetches accurate hyper-local weather using Open-Meteo API (free, zero API key requirement)
 * and calculates clinical autoimmune environmental triggers:
 * - Barometric pressure drops (triggers joint stiffness, inflammation, and migraines)
 * - Humidity & temperature extremes (aggravates arthritis & Raynaud's phenomenon)
 * - UV Index (vital for Lupus and photosensitive autoimmune conditions)
 */
import * as Location from 'expo-location';

export interface WeatherData {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  pressureHpa: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherLabel: string;
  weatherEmoji: string;
  uvIndexMax: number;
  tempMaxC: number;
  tempMinC: number;
  cityName: string;
  regionName: string;
  latitude: number;
  longitude: number;
  fetchedAt: string; // ISO datetime
}

export interface FlareTriggerAssessment {
  overallRisk: 'low' | 'moderate' | 'high';
  pressureStatus: 'low' | 'normal' | 'high';
  pressureTitle: string;
  pressureDescription: string;
  humidityStatus: 'dry' | 'optimal' | 'humid';
  humidityDescription: string;
  uvStatus: 'low' | 'moderate' | 'high' | 'extreme';
  uvDescription: string;
  actionableTip: string;
}

export function getWeatherDescription(code: number): { label: string; emoji: string } {
  switch (code) {
    case 0:
      return { label: 'Clear Sky', emoji: '☀️' };
    case 1:
      return { label: 'Mainly Clear', emoji: '🌤️' };
    case 2:
      return { label: 'Partly Cloudy', emoji: '⛅' };
    case 3:
      return { label: 'Overcast', emoji: '☁️' };
    case 45:
    case 48:
      return { label: 'Foggy', emoji: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { label: 'Light Drizzle', emoji: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { label: 'Rain', emoji: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { label: 'Snow', emoji: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', emoji: '🌦️' };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', emoji: '⛈️' };
    default:
      return { label: 'Partly Cloudy', emoji: '⛅' };
  }
}

export function assessAutoimmuneFlareTriggers(weather: WeatherData): FlareTriggerAssessment {
  const pressure = weather.pressureHpa;
  const humidity = weather.humidityPct;
  const uv = weather.uvIndexMax;

  // 1. Barometric Pressure Assessment
  // Normal sea-level pressure is ~1013.25 hPa. Drops below 1008 hPa allow inflamed joint capsules to expand, causing pain.
  let pressureStatus: 'low' | 'normal' | 'high' = 'normal';
  let pressureTitle = 'Stable Barometric Pressure';
  let pressureDescription = 'Atmospheric pressure is balanced. Low likelihood of pressure-related joint ache.';

  if (pressure < 1008) {
    pressureStatus = 'low';
    pressureTitle = 'Low Barometric Pressure (Joint Pain Warning)';
    pressureDescription = 'Barometric pressure has dropped. Synovial joint fluid may expand, increasing joint stiffness, inflammation, or headache risk.';
  } else if (pressure > 1022) {
    pressureStatus = 'high';
    pressureTitle = 'High Barometric Pressure';
    pressureDescription = 'Atmosphere is calm and compressed. Stable joint environment.';
  }

  // 2. Humidity Assessment
  let humidityStatus: 'dry' | 'optimal' | 'humid' = 'optimal';
  let humidityDescription = 'Relative humidity is comfortable (40–70%).';

  if (humidity > 72) {
    humidityStatus = 'humid';
    humidityDescription = 'High humidity combined with temperature changes can amplify nerve sensitivity and inflammatory pain.';
  } else if (humidity < 35) {
    humidityStatus = 'dry';
    humidityDescription = 'Dry air can dry out mucous membranes and skin barriers.';
  }

  // 3. UV Assessment (Crucial for Lupus & Photosensitive Autoimmune Patients)
  let uvStatus: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
  let uvDescription = 'Minimal UV radiation. Safe for photosensitive conditions.';

  if (uv >= 8) {
    uvStatus = 'extreme';
    uvDescription = 'Very high UV index! Strict UV avoidance & high SPF advised to prevent photosensitive rash and systemic lupus flares.';
  } else if (uv >= 6) {
    uvStatus = 'high';
    uvDescription = 'High UV levels. Protective clothing and sunscreen recommended for autoimmune photosensitivity.';
  } else if (uv >= 3) {
    uvStatus = 'moderate';
    uvDescription = 'Moderate UV radiation. Limit prolonged midday exposure.';
  }

  // 4. Overall Flare Risk
  let overallRisk: 'low' | 'moderate' | 'high' = 'low';
  let actionableTip = 'Weather conditions are stable today. Maintain your normal hydration and gentle movement.';

  if (pressureStatus === 'low' || uvStatus === 'extreme') {
    overallRisk = 'high';
    actionableTip = 'Atmospheric conditions favor flare triggers today. Consider gentle joint warmth, staying hydrated, and pacing your daily activities.';
  } else if (humidityStatus === 'humid' || uvStatus === 'high') {
    overallRisk = 'moderate';
    actionableTip = 'Moderate environmental triggers detected. Keep joints warm and protect your skin if going outdoors.';
  }

  return {
    overallRisk,
    pressureStatus,
    pressureTitle,
    pressureDescription,
    humidityStatus,
    humidityDescription,
    uvStatus,
    uvDescription,
    actionableTip,
  };
}

class WeatherService {
  /**
   * Fetches weather data using Open-Meteo for coordinates.
   */
  async fetchForecast(latitude: number, longitude: number, cityName?: string, regionName?: string): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather service responded with status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const code = current.weather_code ?? 0;
    const { label, emoji } = getWeatherDescription(code);

    return {
      temperatureC: Math.round(current.temperature_2m ?? 20),
      apparentTemperatureC: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 20),
      humidityPct: Math.round(current.relative_humidity_2m ?? 50),
      pressureHpa: Math.round(current.surface_pressure ?? 1013),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 5),
      weatherCode: code,
      weatherLabel: label,
      weatherEmoji: emoji,
      uvIndexMax: daily.uv_index_max?.[0] ? +daily.uv_index_max[0].toFixed(1) : 3,
      tempMaxC: daily.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : Math.round(current.temperature_2m ?? 20),
      tempMinC: daily.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : Math.round(current.temperature_2m ?? 15),
      cityName: cityName && cityName !== 'Your Location' && cityName !== 'Your City' ? cityName : 'Local Area',
      regionName: regionName || '',
      latitude,
      longitude,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Reverse geocodes coordinates to a human-readable city & region name.
   * Uses device native geocoding with ultra-reliable global HTTP reverse geocode fallbacks
   * (BigDataCloud + OpenStreetMap) so the exact city name is always resolved.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; region: string }> {
    // 1. Try native Expo Location reverseGeocodeAsync
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const first = results[0];
        const cityCandidate = first.city || first.subregion || first.district || first.name;
        const regionCandidate = first.region || first.country || '';
        if (
          cityCandidate &&
          cityCandidate.trim() &&
          !cityCandidate.toLowerCase().includes('unnamed') &&
          cityCandidate !== 'Your Location' &&
          cityCandidate !== 'Your City'
        ) {
          return {
            city: cityCandidate.trim(),
            region: regionCandidate.trim(),
          };
        }
      }
    } catch (e) {
      console.warn('[WeatherService] Native reverse geocode failed, falling back to cloud geocoding:', e);
    }

    // 2. High-reliability Cloud Reverse Geocode (BigDataCloud Client API - free, accurate, zero key requirement)
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city =
          data.city ||
          data.locality ||
          data.principalSubdivision ||
          data.countryName;
        const region = data.principalSubdivision || data.countryName || '';
        if (city && city.trim()) {
          return { city: city.trim(), region: region.trim() };
        }
      }
    } catch (netErr) {
      console.warn('[WeatherService] Cloud reverse geocode error:', netErr);
    }

    // 3. OpenStreetMap Nominatim Fallback
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'LumenHealthApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.county ||
          addr.state_district ||
          addr.state;
        const region = addr.state || addr.country || '';
        if (city && city.trim()) {
          return { city: city.trim(), region: region.trim() };
        }
      }
    } catch (osmErr) {
      console.warn('[WeatherService] Nominatim reverse geocode error:', osmErr);
    }

    return { city: 'Local Area', region: '' };
  }
}

export const weatherService = new WeatherService();
