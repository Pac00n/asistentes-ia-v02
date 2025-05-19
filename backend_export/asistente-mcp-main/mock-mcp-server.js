const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mapeo de ubicaciones conocidas
const knownLocations = {
  // España
  'madrid': { name: 'Madrid', latitude: 40.4168, longitude: -3.7038, country: 'España' },
  'barcelona': { name: 'Barcelona', latitude: 41.3888, longitude: 2.159, country: 'España' },
  'valencia': { name: 'Valencia', latitude: 39.4699, longitude: -0.3763, country: 'España' },
  'sevilla': { name: 'Sevilla', latitude: 37.3891, longitude: -5.9845, country: 'España' },
  'zaragoza': { name: 'Zaragoza', latitude: 41.6488, longitude: -0.8891, country: 'España' },
  'málaga': { name: 'Málaga', latitude: 36.7213, longitude: -4.4213, country: 'España' },
  'murcia': { name: 'Murcia', latitude: 37.9922, longitude: -1.1307, country: 'España' },
  'palma': { name: 'Palma de Mallorca', latitude: 39.5696, longitude: 2.6502, country: 'España' },
  'las palmas': { name: 'Las Palmas de Gran Canaria', latitude: 28.1235, longitude: -15.4363, country: 'España' },
  'santa cruz de tenerife': { name: 'Santa Cruz de Tenerife', latitude: 28.4636, longitude: -16.2518, country: 'España' },
  // Otras ubicaciones
  'parís': { name: 'París', latitude: 48.8566, longitude: 2.3522, country: 'Francia' },
  'londres': { name: 'Londres', latitude: 51.5074, longitude: -0.1278, country: 'Reino Unido' },
  'nueva york': { name: 'Nueva York', latitude: 40.7128, longitude: -74.0060, country: 'Estados Unidos' },
  'tokio': { name: 'Tokio', latitude: 35.6762, longitude: 139.6503, country: 'Japón' }
};

// Mapeo de códigos de tiempo de Open-Meteo a condiciones en español
const weatherCodeMap = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla escarchada',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna densa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada densa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada intensa',
  71: 'Nieve ligera',
  73: 'Nieve moderada',
  75: 'Nieve intensa',
  77: 'Granizo',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  85: 'Nevadas ligeras',
  86: 'Nevadas intensas',
  95: 'Tormenta eléctrica',
  96: 'Tormenta eléctrica con granizo ligero',
  99: 'Tormenta eléctrica con granizo intenso'
};

// Ruta para consultar el clima usando Open-Meteo
app.post('/api/weather', async (req, res) => {
  console.log('=== NUEVA SOLICITUD DE CLIMA ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  try {
    const { location = 'Madrid', units = 'celsius' } = req.body;
    
    console.log(`Buscando coordenadas para: ${location}`);
    
    // Limpiar y formatear la ubicación
    const cleanLocation = location.trim()
      .replace(/^en\s+/i, '') // Eliminar "en " al inicio
      .replace(/^(?:el |la |las |los )?clima (?:de |en )?/i, '') // Eliminar prefijos comunes
      .replace(/^tiempo (?:de |en )?/i, '') // Eliminar prefijos de tiempo
      .toLowerCase();
    
    console.log('Ubicación formateada:', cleanLocation);

    // Verificar si la ubicación es conocida
    let locationInfo = knownLocations[cleanLocation];
    
    if (!locationInfo) {
      // Buscar coincidencia parcial
      const matchedLocation = Object.entries(knownLocations).find(([key, loc]) => 
        cleanLocation.includes(key) || key.includes(cleanLocation)
      );
      
      if (matchedLocation) {
        locationInfo = matchedLocation[1];
        console.log(`Ubicación encontrada por coincidencia parcial: ${locationInfo.name}`);
      }
    }
    
    if (locationInfo) {
      console.log(`Ubicación conocida: ${locationInfo.name}, ${locationInfo.country} (${locationInfo.latitude}, ${locationInfo.longitude})`);
      
      // Usar las coordenadas de la ubicación conocida
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${locationInfo.latitude}&longitude=${locationInfo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
      
      try {
        console.log('Consultando clima para ubicación conocida:', weatherUrl);
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        if (weatherData.error) {
          throw new Error(weatherData.reason || 'Error al obtener el clima');
        }
        
        const current = weatherData.current;
        const condition = weatherCodeMap[current.weather_code] || 'Desconocido';
        
        const response = {
          location: `${locationInfo.name}, ${locationInfo.country}`,
          temperature: current.temperature_2m,
          condition,
          feels_like: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          wind_speed: current.wind_speed_10m,
          units: 'celsius'
        };
        
        console.log('Respuesta del clima:', response);
        return res.json(response);
        
      } catch (error) {
        console.error('Error al obtener el clima para ubicación conocida:', error);
        return res.status(500).json({ 
          error: `Error al obtener el clima para ${locationInfo.name}`,
          details: error.message 
        });
      }
    }
    
    // Si llegamos aquí, la ubicación no estaba en la lista de conocidas
    // 1. Primero intentamos con la ubicación exacta
    let geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLocation)}&count=5&language=es&format=json`;
    console.log('URL de geocodificación:', geoUrl);
    
    let geoResponse = await fetch(geoUrl);
    let geoData = await geoResponse.json();
    
    // 2. Si no encontramos resultados, intentamos con una búsqueda más amplia
    if (!geoData.results || geoData.results.length === 0) {
      console.log('No se encontraron resultados, intentando con búsqueda más amplia...');
      const searchTerms = cleanLocation.split(/[,\s]+/);
      const mainTerm = searchTerms[0]; // Tomamos el primer término de búsqueda
      
      geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(mainTerm)}&count=10&language=es&format=json`;
      console.log('Nueva URL de geocodificación:', geoUrl);
      
      geoResponse = await fetch(geoUrl);
      geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        console.log('No se encontraron resultados después de búsqueda ampliada');
        return res.status(404).json({ 
          error: `No se pudo encontrar la ubicación: ${location}`,
          suggestions: ['¿Quisiste decir alguna de estas ciudades?', 'Madrid', 'Barcelona', 'Valencia']
        });
      }
    }
    
    // 3. Buscar el resultado más relevante
    const searchTerm = cleanLocation.toLowerCase();
    const exactMatch = geoData.results.find(place => {
      const placeName = place.name.toLowerCase();
      const placeFullName = `${placeName}, ${(place.admin1 || '')}, ${place.country || ''}`.toLowerCase();
      
      return (
        placeName === searchTerm ||
        placeFullName.includes(searchTerm) ||
        searchTerm.includes(placeName)
      );
    });
    
    const bestMatch = exactMatch || geoData.results[0];
    console.log('Mejor coincidencia encontrada:', bestMatch.name, bestMatch.admin1, bestMatch.country);
    
    const { latitude, longitude, name, country } = bestMatch;
    const locationName = `${name}${country ? ', ' + country : ''}`;
    
    console.log(`Obteniendo clima para: ${locationName} (${latitude}, ${longitude})`);
    
    // 2. Obtenemos el pronóstico del tiempo actual
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&timezone=auto` +
      `&temperature_unit=${units === 'fahrenheit' ? 'fahrenheit' : 'celsius'}`
    );
    
    const weatherData = await weatherResponse.json();
    
    if (!weatherData.current) {
      throw new Error('No se pudo obtener datos del clima');
    }
    
    const current = weatherData.current;
    
    // 3. Formateamos la respuesta
    const response = {
      location: locationName,
      temperature: current.temperature_2m,
      apparent_temperature: current.apparent_temperature,
      condition: weatherCodeMap[current.weather_code] || 'Desconocido',
      humidity: current.relative_humidity_2m,
      wind_speed: current.wind_speed_10m,
      units: units === 'fahrenheit' ? '°F' : '°C',
      last_updated: new Date().toISOString(),
      source: 'Open-Meteo',
      coordinates: { latitude, longitude }
    };
    
    console.log(`Clima para ${locationName}:`, response);
    res.json(response);
    
  } catch (error) {
    console.error('Error en la ruta /api/weather:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || 'Error al procesar la solicitud';
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta de verificación de estado
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-mcp-server' });
});

app.listen(PORT, () => {
  console.log(`Servidor MCP de prueba ejecutándose en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`- POST http://localhost:${PORT}/weather`);
  console.log(`- GET  http://localhost:${PORT}/health`);
});
