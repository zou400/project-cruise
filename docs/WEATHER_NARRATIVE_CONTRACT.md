# Arrival weather and narrative endpoint

The frontend does not contain weather-provider or AI credentials. Set `weatherEndpoint` in `runtime-config.js` to an HTTPS endpoint that your server or serverless function controls.

## Request

Project Cruise sends a GET request with:

| Query | Meaning |
|---|---|
| `lat` | destination latitude |
| `lng` | destination longitude |
| `arrivalMinutes` | estimated minutes until arrival |
| `destination` | destination name |

## Response

```json
{
  "temperatureC": 24,
  "precipitationProbability": 35,
  "windKph": 18,
  "narrative": "雨上がりの路面が、湾岸の光を少し長く残している。"
}
```

The fields may also be returned inside `current`. Open-Meteo-style names `temperature_2m`, `precipitation_probability`, and `wind_speed_10m` are accepted.

`narrative` is optional and limited to the first 180 characters by the client. If absent, Project Cruise generates a deterministic local line from weather, destination category, and story settings.

## Recommended server rules

- Use the commercial weather provider from the server side.
- Keep provider and OpenAI credentials off GitHub Pages.
- Generate structured output and validate its length and prohibited content.
- Do not imitate copyrighted dialogue or encourage unsafe driving.
- Cache by destination, arrival time bucket, weather state, mode, and intensity.
- Weather text may change presentation; safety and operational gates remain separate.
