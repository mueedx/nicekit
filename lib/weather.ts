import { asNumber, isRecord } from "./parse";
import type { WeatherRecord } from "./types";

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Rain showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

export function weatherLabel(code: number): string {
  const label = WMO_LABELS[code];
  if (label !== undefined) return label;
  return String(code);
}

function emptyWeather(): WeatherRecord {
  return {
    source: "open-meteo.com",
    condition: null,
    temperatureC: null,
    humidity: null,
    windKmh: null,
  };
}

export function parseWeather(body: unknown): WeatherRecord {
  const weather = emptyWeather();
  if (!isRecord(body) || !isRecord(body.current)) return weather;

  const current = body.current;
  const code = asNumber(current.weather_code);
  weather.condition = code === null ? null : weatherLabel(code);
  weather.temperatureC = asNumber(current.temperature_2m);
  weather.humidity = asNumber(current.relative_humidity_2m);
  weather.windKmh = asNumber(current.wind_speed_10m);
  return weather;
}

export async function lookupWeather(coords: {
  latitude: number | null;
  longitude: number | null;
}): Promise<WeatherRecord> {
  if (coords.latitude === null || coords.longitude === null) {
    return emptyWeather();
  }

  const params = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    current:
      "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
    timezone: "auto",
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return emptyWeather();
    const body: unknown = await response.json();
    return parseWeather(body);
  } catch {
    return emptyWeather();
  }
}
