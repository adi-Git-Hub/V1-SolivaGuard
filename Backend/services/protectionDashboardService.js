const { connection: redis } = require('../config/redis');
const logger = require('../utils/logger');

class ProtectionDashboardService {
  constructor() {
    this.OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    this.WAQI_API_TOKEN = process.env.WAQI_API_TOKEN;
    this.CACHE_TTL = 1800; // 30 minutes
  }

  async getDashboardData(lat, lon) {
    const cacheKey = `protection_dash:${lat}:${lon}`;
    
    // Try to get from cache
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (err) {
      logger.error(`[PROTECTION DASH] Cache error: ${err.message}`);
    }

    // Fetch from external APIs
    const [weatherData, aqiData, locationData] = await Promise.all([
      this.fetchWeatherAndUV(lat, lon),
      this.fetchAQI(lat, lon),
      this.reverseGeocode(lat, lon)
    ]);

    const protectionScore = this.calculateProtectionScore(
      weatherData.uvIndex,
      aqiData.aqi,
      weatherData.temp
    );

    const dashboardData = {
      weather: {
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        condition: weatherData.condition,
        icon: weatherData.icon
      },
      aqi: {
        value: aqiData.aqi,
        status: aqiData.status,
        color: aqiData.color
      },
      uv: {
        index: weatherData.uvIndex,
        level: this.getUVLevel(weatherData.uvIndex)
      },
      location: {
        city: locationData.city,
        state: locationData.state
      },
      protectionScore,
      recommendations: this.generateRecommendations(weatherData.uvIndex, aqiData.aqi, weatherData.temp)
    };

    // Store in cache
    try {
      await redis.set(cacheKey, JSON.stringify(dashboardData), 'EX', this.CACHE_TTL);
    } catch (err) {
      logger.error(`[PROTECTION DASH] Cache set error: ${err.message}`);
    }

    return dashboardData;
  }

  async fetchWeatherAndUV(lat, lon) {
    try {
      if (!this.OPENWEATHER_API_KEY) {
        return { temp: 30, humidity: 60, condition: 'Clear', icon: '01d', uvIndex: 5 };
      }
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();

      // UV Index is a separate call in free tier usually, or part of onecall
      // For free tier 2.5, we might need another call or use a default if not available
      let uvIndex = 5; // Default moderate
      try {
        const uvRes = await fetch(
          `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${this.OPENWEATHER_API_KEY}`
        );
        const uvData = await uvRes.json();
        uvIndex = uvData.value || 5;
      } catch (e) {
        logger.warn(`[PROTECTION DASH] UV fetch failed: ${e.message}`);
      }

      return {
        temp: data.main?.temp || 0,
        humidity: data.main?.humidity || 0,
        condition: data.weather?.[0]?.main || 'Unknown',
        icon: data.weather?.[0]?.icon || '01d',
        uvIndex
      };
    } catch (err) {
      logger.error(`[PROTECTION DASH] Weather fetch failed: ${err.message}`);
      return { temp: 0, humidity: 0, condition: 'Error', icon: '01d', uvIndex: 0 };
    }
  }

  async fetchAQI(lat, lon) {
    try {
      if (!this.WAQI_API_TOKEN) {
        return { aqi: 42, status: 'Good', color: '#009966' };
      }

      const response = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${this.WAQI_API_TOKEN}`
      );
      const data = await response.json();

      if (data.status !== 'ok') throw new Error('WAQI API error');

      const aqi = data.data.aqi;
      let status = 'Good';
      let color = '#009966';

      if (aqi > 300) { status = 'Hazardous'; color = '#7e0023'; }
      else if (aqi > 200) { status = 'Very Unhealthy'; color = '#660099'; }
      else if (aqi > 150) { status = 'Unhealthy'; color = '#cc0033'; }
      else if (aqi > 100) { status = 'Unhealthy for Sensitive Groups'; color = '#ff9933'; }
      else if (aqi > 50) { status = 'Moderate'; color = '#ffde33'; }

      return { aqi, status, color };
    } catch (err) {
      logger.error(`[PROTECTION DASH] AQI fetch failed: ${err.message}`);
      return { aqi: 0, status: 'Unknown', color: '#cccccc' };
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'SolivaApp/1.0' } }
      );
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        state: data.address?.state || 'Unknown'
      };
    } catch (err) {
      logger.error(`[PROTECTION DASH] Geocode failed: ${err.message}`);
      return { city: 'Unknown', state: 'Unknown' };
    }
  }

  calculateProtectionScore(uv, aqi, temp) {
    const uvScore = Math.min(uv * 6, 50); // UV is major factor, up to 50
    const aqiScore = Math.min(aqi / 4, 30); // AQI up to 30
    const tempScore = Math.min(Math.max(temp - 25, 0) * 2, 20); // Temp above 25 adds up to 20
    
    const total = Math.round(uvScore + aqiScore + tempScore);
    const score = Math.min(total, 100);
    
    let level = 'Low';
    if (score > 80) level = 'Extreme';
    else if (score > 60) level = 'Very High';
    else if (score > 40) level = 'High';
    else if (score > 20) level = 'Moderate';

    return { score, level };
  }

  getUVLevel(uv) {
    if (uv >= 11) return 'Extreme';
    if (uv >= 8) return 'Very High';
    if (uv >= 6) return 'High';
    if (uv >= 3) return 'Moderate';
    return 'Low';
  }

  generateRecommendations(uv, aqi, temp) {
    const recs = [];
    
    if (uv >= 6) {
      recs.push('High UV Today: Full facial & neck coverage advised.');
      recs.push('Outdoor protection highly recommended between 10 AM - 4 PM.');
    } else if (uv >= 3) {
      recs.push('Moderate UV: Breathable Sunwrap recommended for extended exposure.');
    }

    if (aqi > 100) {
      recs.push('Poor Air Quality: Use Sunwrap with integrated filtration layer.');
      recs.push('Minimize heavy outdoor exertion.');
    }

    if (temp > 30) {
      recs.push('Warm Weather: Opt for Cool-Tech silk blend Sunwrap.');
    }

    if (recs.length === 0) {
      recs.push('Conditions are clear. Standard protection advised.');
    }

    return recs;
  }
}

module.exports = new ProtectionDashboardService();
