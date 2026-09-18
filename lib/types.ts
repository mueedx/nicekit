export type OrgType = "hosting" | "isp" | "education" | "government";

export type OriginRecord = {
  source: string;
  city: string | null;
  postcode: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  timezone: string | null;
  network: string | null;
  asn: string | null;
  provider: string | null;
  orgType: OrgType | null;
  latitude: number | null;
  longitude: number | null;
  accuracyKm: number | null;
};

export type WeatherRecord = {
  source: string;
  condition: string | null;
  temperatureC: number | null;
  humidity: number | null;
  windKmh: number | null;
};

export type RequestFacts = {
  browser: string | null;
  os: string | null;
  device: string | null;
  arch: string | null;
  bitness: string | null;
  model: string | null;
};

export type VisitorPage = {
  ip: string;
  host: string;
  origin: OriginRecord;
  weather: WeatherRecord;
  request: RequestFacts;
};
