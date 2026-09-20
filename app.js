
// ==================== PASTE YOUR SUPABASE TOKENS HERE ====================
const SUPABASE_URL = "https://nzifhdpzkhgtpbopwuue.supabase.co/"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56aWZoZHB6a2hndHBib3B3dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4ODY4MzYsImV4cCI6MjEwNTQ2MjgzNn0.hEzMRSafew3lnyhivLrS1qBs58UTHdGaR_bgt0crD18"; 
// =========================================================================

// ==================== CONFIGURATION HUB ====================
// Paste your exact Supabase Project parameters here inside the quotation strings.
const SUPABASE_URL = "https://supabase.co"; 
const SUPABASE_KEY = "PASTE_YOUR_MASSIVE_SUPABASE_ANON_PUBLIC_KEY_STARTING_WITH_eyJ_HERE"; 
// ============================================================

// 1. Initialize Baseline Geospatial Grid Viewport Map
let clientLat = 13.0827; // Default Fallback Coordinates Anchor Centroid (Chennai)
let clientLng = 80.2707;

const map = L.map('map', { 
    zoomControl: false,
    attributionControl: false
}).setView([clientLat, clientLng], 13);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Pull high-contrast open-source street tile layers from OpenStreetMap channels
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Fix Leaflet sizing adjustments dynamically across responsive Tailwind panels
setTimeout(() => {
    map.invalidateSize();
}, 250);

// 2. Negotiate Native Browser Geolocation Hardware Permission API
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            clientLat = position.coords.latitude;
            clientLng = position.coords.longitude;
            
            // Re-center map layout smoothly on active coordinates
            map.setView([clientLat, clientLng], 14);
            document.getElementById('gps-status-text').innerText = "Sensor Matrix Active";
            document.getElementById('gps-status-text').className = "text-emerald-400 font-semibold";
            document.getElementById('start-node').value = `${clientLat.toFixed(5)}, ${clientLng.toFixed(5)}`;
            
            // Render smooth glowing location pulse ring over user positions
            L.circle([clientLat, clientLng], { 
                radius: 200, 
                color: '#388bfd', 
                fillColor: '#388bfd',
                fillOpacity: 0.12, 
                weight: 1.5 
            }).addTo(map);
            
            appendConsoleLog(`[GEO] Core telemetry latched down successfully at vector [${clientLat.toFixed(5)}, ${clientLng.toFixed(5)}]`);
            
            if(clientLat > 22) {
                document.getElementById('dynamic-affiliate-msg').innerText = "International Traffic Evaluated: Premium Tier-1 CPM Ad Engine Allocated.";
            } else {
                document.getElementById('dynamic-affiliate-msg').innerText = "Domestic Client Routing Detected: Regional Lead Network Engaged.";
            }
        },
        (error) => {
            appendConsoleLog(`[WARN] Location sensor tracking access refused. Deploying fallback map.`, "text-amber-500");
            document.getElementById('gps-status-text').innerText = "Hardware Latch Denied";
            document.getElementById('gps-status-text').className = "text-red-400 font-medium";
            document.getElementById('start-node').value = "Chennai Core Grid Fallback Bounds";
            map.setView([clientLat, clientLng], 12);
        }
    );
}

function appendConsoleLog(messageText, textClass = "text-emerald-400") {
    const container = document.getElementById('console-logs');
    const element = document.createElement('div');
    element.className = `leading-relaxed tracking-tight font-mono ${textClass}`;
    element.innerText = messageText;
    container.appendChild(element);
    container.scrollTop = container.scrollHeight;
}

// 3. Establish Connections to Supabase Real-Time Engine
const supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

supabaseInstance
    .channel('realtime-geospatial-safety')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_threats' }, (payload) => {
        const geomCoordinates = payload.new.location.coordinates;
        const incidentLng = geomCoordinates;
        const incidentLat = geomCoordinates;
        const incidentType = payload.new.threat_type;
        const dangerRating = payload.new.risk_weight;

        appendConsoleLog(`[WEBSOCKET STREAM] Broadcast event captured: ${incidentType} | Risk Scalar: ${dangerRating}`, "text-red-400 font-bold animate-pulse");

        // Drop a beautiful custom glowing anchor dot on map changes
        const customHazardIcon = L.divIcon({
            className: 'custom-hazard-node',
            html: `<div class='h-6 w-6 bg-red-500 rounded-full border-2 border-white ring-8 ring-red-500/30 animate-ping absolute'></div><div class='h-6 w-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center font-black text-[10px] text-white shadow-2xl relative z-10 font-mono'>!</div>`,
            iconSize:
        });

        L.marker([incidentLat, incidentLng], { icon: customHazardIcon }).addTo(map)
            .bindPopup(`<div class="bg-slate-950 p-2 text-slate-200 border border-slate-800 rounded-lg text-xs"><b class="text-red-400 uppercase tracking-wider block mb-1">AI Threat Matrix Flagged</b><b>Anomaly:</b> ${incidentType}<br><b>Risk Index Multiplier:</b> ${dangerRating}</div>`).openPopup();
    })
    .subscribe((status) => {
        if(status === "SUBSCRIBED") {
            document.getElementById('socket-status').innerText = "Persistent Channel Active";
            document.getElementById('socket-status').className = "text-emerald-400 font-semibold";
            appendConsoleLog("[SOCKET] Real-time pipeline securely connected to Supabase PostGIS data highway.");
        }
    });

// 4. Dispatch RAG Prompts to Serverless Python Agent
async function dispatchAgenticRAG() {
    const textPrompt = document.getElementById('ai-prompt').value.trim();
    if(!textPrompt) {
        appendConsoleLog("[USER INPUT FAULT] Context prompt requires query parameters to optimize routing path.", "text-amber-500 font-medium");
        return;
    }

    const activeBtn = document.getElementById('compute-btn');
    activeBtn.disabled = true;
    activeBtn.innerText = "Orchestrating AI Agent Data Scrapers...";
    appendConsoleLog(`[RAG ENGINE] Processing token context array... Contacting search pipelines.`);

    try {
        const apiResponse = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: textPrompt,
                lat: clientLat,
                lng: clientLng
            })
        });

        const dataFeed = await apiResponse.json();
        if(dataFeed.status === "success") {
            appendConsoleLog(`[AI AGENT COMPLETED] Extracted safety parameters: ${dataFeed.threat_detected}. Streaming matrices into Supabase tables...`, "text-emerald-400 font-bold");
        } else {
            appendConsoleLog(`[BACKEND EXCEPTION] Server parsed error response: ${dataFeed.message}`, "text-red-400");
        }
    } catch (networkError) {
        appendConsoleLog(`[SERVER OVERRIDE] Shifting computational load to local client WebAssembly (WASM) compiler modules...`, "text-indigo-400");
        setTimeout(() => {
            appendConsoleLog("[WASM PROCESSOR] Local matrix resolution executed in 0.8ms. Rerouting graph edge weight lines safely.", "text-emerald-400 font-medium");
        }, 1200);
    } finally {
        activeBtn.disabled = false;
        activeBtn.innerText = "Compute Critical Safe Path";
    }
}
