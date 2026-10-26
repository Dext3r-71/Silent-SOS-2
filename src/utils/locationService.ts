export interface LocationData {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  address: string;
  mapsUrl: string;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(getFallbackLocation());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        let address = `${lat}, ${lng} (GPS Fix)`;
        try {
          // Attempt lightweight reverse geocode via OpenStreetMap nominatim or fallback
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              address = data.display_name.split(',').slice(0, 3).join(', ');
            }
          }
        } catch {
          // Use coordinate fallback
        }

        resolve({
          latitude: lat,
          longitude: lng,
          accuracyMeters: acc,
          address,
          mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      },
      () => {
        resolve(getFallbackLocation());
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 10000,
      }
    );
  });
}

function getFallbackLocation(): LocationData {
  // Realistic fallback coordinates for simulation
  const lat = 37.7749;
  const lng = -122.4194;
  return {
    latitude: lat,
    longitude: lng,
    accuracyMeters: 15,
    address: 'Market St & 5th Ave (Simulated Location)',
    mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
  };
}
