from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import json
from duckduckgo_search import DDGS
import google.generativeai as genai

app = FastAPI()

# Enable cross-origin calls so your frontend layout can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NavigationQueryMatrix(BaseModel):
    prompt: str
    lat: float
    lng: float

@app.post("/api/agent")
async def process_agentic_rag(payload: NavigationQueryMatrix):
    try:
        # 1. RETRIEVAL LAYER: Scrape live emergency feeds near coordinates
        scraped_context = ""
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(f"emergency hazard crime traffic incident near {payload.lat}, {payload.lng}", max_results=4)]
            if results:
                scraped_context = "\\n".join([f"Source: {item['title']} - {item['body']}" for item in results])

        # 2. REASONING LAYER (The RAG Core Engine)
        genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-pro')
        
        system_instructions = f"""
        You are the safety brain of SafePath AI. 
        Analyze the query: "{payload.prompt}" 
        Cross-reference it with this live scraped context data:
        ---
        {scraped_context}
        ---
        Determine if there is an active physical threat near coordinates {payload.lat}, {payload.lng}.
        You MUST respond in strict JSON format matching this exact schema:
        {{
            "threat_detected": "Clear short name of danger or 'Baseline Pedestrian Safety Verified'",
            "risk_weight": a float value between 0.0 and 1.0
        }}
        Do not include markdown tags like ```json or text. Output raw JSON only.
        """
        
        ai_response = model.generate_content(system_instructions)
        ai_data = json.loads(ai_response.text.strip())

        # 3. PERSISTENCE LAYER: Stream coordinates to Supabase
        supabase_endpoint = os.environ.get("SUPABASE_URL")
        supabase_secret_key = os.environ.get("SUPABASE_ANON_KEY")

        if supabase_endpoint and supabase_secret_key:
            network_headers = {
                "apikey": supabase_secret_key,
                "Authorization": f"Bearer {supabase_secret_key}",
                "Content-Type": "application/json"
            }
            database_payload = {
                "threat_type": ai_data["threat_detected"],
                "risk_weight": ai_data["risk_weight"],
                "location": f"SRID=4326;POINT({payload.lng} {payload.lat})"
            }
            requests.post(f"{supabase_endpoint}/rest/v1/live_threats", json=database_payload, headers=network_headers)

        return {
            "status": "success",
            "threat_detected": ai_data["threat_detected"],
            "risk_multiplier": ai_data["risk_weight"]
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
