// Maps WMO Weather Codes to human readable text
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code >= 1 && code <= 3) return 'Partly cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export interface WeatherData {
  temp: number;
  condition: string;
  location: string; // We'll just store "Lat/Lon" or a generic name for now
}

export async function getCurrentWeather(): Promise<WeatherData | null> {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Using Open-Meteo (Free, No Key Required)
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
          );
          
          if (!response.ok) throw new Error("Weather API failed");
          
          const data = await response.json();
          const weather = data.current_weather;

          resolve({
            temp: weather.temperature,
            condition: getWeatherCondition(weather.weathercode),
            location: 'Local' // We could use a reverse geocoding API here later if needed
          });
        } catch (error) {
          console.error("Error fetching weather:", error);
          resolve(null);
        }
      },
      (error) => {
        console.warn("Location permission denied or failed", error);
        resolve(null);
      }
    );
  });
}