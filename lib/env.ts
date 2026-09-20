export const env={
  supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL||"",
  supabaseServiceKey:process.env.SUPABASE_SERVICE_ROLE_KEY||"",
  aiBaseUrl:process.env.AI_BASE_URL||"https://router.huggingface.co/v1",
  aiKey:process.env.HF_TOKEN||"",
  aiModel:process.env.AI_MODEL||"Qwen/Qwen2.5-7B-Instruct:fastest",
  embeddingUrl:process.env.EMBEDDING_API_URL||"",
  embeddingKey:process.env.EMBEDDING_API_KEY||"",
  embeddingModel:process.env.EMBEDDING_MODEL||"BAAI/bge-small-en-v1.5",
  osrm:process.env.OSRM_URL||"https://router.project-osrm.org",
  nominatim:process.env.NOMINATIM_URL||"https://nominatim.openstreetmap.org",
  overpass:process.env.OVERPASS_URL||"https://overpass-api.de/api/interpreter",
  meteo:process.env.OPEN_METEO_URL||"https://api.open-meteo.com/v1/forecast"
};