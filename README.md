# SafePath AI

A real, deployable safety-first navigation application for Vercel + Supabase.

## What is actually wired

- Global place search through OpenStreetMap Nominatim.
- Global route calculation through OSRM; the endpoint is configurable so you can self-host OSRM for production.
- Interactive MapLibre map.
- Browser location permission + “use my location”.
- OpenStreetMap/Overpass amenity context for police, hospitals, clinics, pharmacies, fire stations and shops.
- Current weather from Open-Meteo.
- A safety scoring engine that combines emergency access, mapped activity, isolation, weather and time of day.
- Three route modes: safest, balanced and fastest.
- Server-side AI copilot using an open-weight model through Hugging Face's OpenAI-compatible Inference Providers endpoint.
- An actual agent loop: the model chooses an intent; the server executes a route-planning tool; the model explains the resulting live plan.
- Supabase persistence + PostgreSQL full-text RAG fallback. The `knowledge` table also has a pgvector column/HNSW index ready for true embedding RAG.
- No API secret is shipped to the browser.

## Important reality about “real-time”

OpenStreetMap data is not a live police/incident feed, and OSRM's public demo server is not a live-traffic engine. This project deliberately avoids pretending otherwise. It uses live requests to the configured open-data services and labels the signals. For production traffic/incident intelligence, self-host open-data feeds available for your target country/region and add them to the server-side provider layer.

## API keys / environment variables

Copy `.env.example` to `.env.local`.

### Required for AI
`HF_TOKEN` — a Hugging Face token with Inference Providers permission.

`AI_MODEL` defaults to `Qwen/Qwen2.5-7B-Instruct:fastest`. Qwen2.5-7B-Instruct is Apache-2.0. You can replace the model with another supported open model.

### Required for persistence/RAG
`NEXT_PUBLIC_SUPABASE_URL`
`SUPABASE_SERVICE_ROLE_KEY`

Run `supabase/migrations/001_safepath.sql` in the Supabase SQL editor.

### No-key open services used by default
- Nominatim
- OSRM public demo
- Overpass
- Open-Meteo
- OpenStreetMap raster tiles

For a real production deployment, respect each service's usage policy and self-host or substitute endpoints as traffic grows.

## Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables in Vercel → Project → Settings → Environment Variables.
4. Deploy.
5. Never put `SUPABASE_SERVICE_ROLE_KEY` or `HF_TOKEN` in a `NEXT_PUBLIC_*` variable.

## Supabase

Create a project, open SQL Editor, and run `supabase/migrations/001_safepath.sql`.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

Browser → Next.js API routes → open data providers + Supabase + AI model.

The browser never calls the AI provider directly. This keeps the model key private and gives the agent a controlled tool boundary.

## Ideas already built into the scoring layer

The safety engine is deliberately modular. You can add:
- road lighting / lit=yes coverage
- road class and sidewalk presence
- elevation and flood susceptibility
- crowd density / POI density
- weather severity
- daylight / sunrise-sunset
- public transit availability
- historical user-reported hazards
- geofenced safety policies
- multi-objective route optimization

The next major upgrade should be a country-specific live incident provider rather than pretending generic web news is equivalent to incident data.
