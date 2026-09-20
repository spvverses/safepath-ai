"use client";

import { useEffect, useState } from "react";
import {
  LocateFixed,
  Send,
  ShieldCheck,
  CloudSun,
  Database,
} from "lucide-react";

import type {
  PlaceHit,
  PlanResult,
  ScoredRoute,
} from "@/lib/types";

import MapView from "./MapView";

const km = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

const mins = (s: number) => `${Math.round(s / 60)} min`;

type ChatMessage = {
  r: string;
  t: string;
};

export default function SafePath() {
  const [origin, setOrigin] = useState<PlaceHit | null>(null);
  const [dest, setDest] = useState<PlaceHit | null>(null);

  const [oq, setOq] = useState("");
  const [dq, setDq] = useState("");

  const [os, setOs] = useState<PlaceHit[]>([]);
  const [ds, setDs] = useState<PlaceHit[]>([]);

  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");

  const [geo, setGeo] = useState(false);

  const search = async (
    q: string,
    setter: (items: PlaceHit[]) => void
  ) => {
    if (q.length < 3) {
      setter([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`
      );

      if (!response.ok) {
        setter([]);
        return;
      }

      const data = await response.json();
      setter(Array.isArray(data) ? data : []);
    } catch {
      setter([]);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(
          `${latitude},${longitude}`
        )}`
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data[0]) {
        setOrigin(data[0]);
        setOq(data[0].label);
        setGeo(true);
      }
    } catch {
      setGeo(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => {
        setGeo(false);
      }
    );
  }, []);

  const useLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => {
        setGeo(false);
      }
    );
  };

  const go = async (preference?: string) => {
    if (!origin || !dest) return;

    setLoading(true);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: {
            lat: origin.lat,
            lng: origin.lng,
          },
          destination: {
            lat: dest.lat,
            lng: dest.lng,
          },
          preference,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPlan(data);
      } else {
        setPlan(null);
      }
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const ask = async () => {
    if (!msg.trim()) return;

    const message = msg;

    setMsg("");

    setChat((current) => [
      ...current,
      {
        r: "user",
        t: message,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          context: plan?.brief || {},
          origin: origin
            ? {
                lat: origin.lat,
                lng: origin.lng,
              }
            : null,
          destination: dest
            ? {
                lat: dest.lat,
                lng: dest.lng,
              }
            : null,
        }),
      });

      const data = await response.json();

      if (data.plan) {
        setPlan(data.plan);
      }

      setChat((current) => [
        ...current,
        {
          r: "ai",
          t: data.answer || data.error || "No response",
        },
      ]);
    } catch {
      setChat((current) => [
        ...current,
        {
          r: "ai",
          t: "I couldn't reach the SafePath AI service. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandmark">
            <ShieldCheck size={20} />
          </div>

          SafePath AI
        </div>

        <div className="status">
          <span className="dot" />

          {geo
            ? "Location enabled"
            : "Location permission available"}
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="panel">
            <h3>Where are you going?</h3>

            <div className="label">
              Starting point
            </div>

            <div className="inputrow">
              <input
                className="input"
                value={oq}
                onChange={(event) => {
                  setOq(event.target.value);
                  search(event.target.value, setOs);
                }}
                placeholder="Your location"
              />

              <button
                className="smallbtn"
                onClick={useLocation}
                title="Use my location"
              >
                <LocateFixed size={15} />
              </button>
            </div>

            {os.length > 0 && (
              <div className="route">
                {os.slice(0, 4).map((place) => (
                  <div
                    key={place.id}
                    className="smallbtn"
                    style={{
                      display: "block",
                      marginBottom: 5,
                    }}
                    onClick={() => {
                      setOrigin(place);
                      setOq(place.label);
                      setOs([]);
                    }}
                  >
                    {place.label}
                  </div>
                ))}
              </div>
            )}

            <div
              className="label"
              style={{ marginTop: 10 }}
            >
              Destination
            </div>

            <input
              className="input"
              value={dq}
              onChange={(event) => {
                setDq(event.target.value);
                search(event.target.value, setDs);
              }}
              placeholder="Any place, city or country"
            />

            {ds.length > 0 && (
              <div className="route">
                {ds.slice(0, 4).map((place) => (
                  <div
                    key={place.id}
                    className="smallbtn"
                    style={{
                      display: "block",
                      marginBottom: 5,
                    }}
                    onClick={() => {
                      setDest(place);
                      setDq(place.label);
                      setDs([]);
                    }}
                  >
                    {place.label}
                  </div>
                ))}
              </div>
            )}

            <button
              className="primary"
              style={{ marginTop: 10 }}
              disabled={
                loading ||
                !origin ||
                !dest
              }
              onClick={() => go()}
            >
              {loading
                ? "Analyzing live data…"
                : "Plan safest journey"}
            </button>
          </div>

          {plan && (
            <>
              <div className="panel">
                <div className="routehead">
                  <div>
                    <h3>Safety brief</h3>

                    <div className="muted">
                      {plan.brief.summary}
                    </div>
                  </div>

                  <div className="score">
                    {plan.routes[0]?.score}
                  </div>
                </div>

                <div className="meter">
                  <span
                    style={{
                      width: `${
                        plan.routes[0]?.score || 0
                      }%`,
                    }}
                  />
                </div>

                <div
                  className="notice"
                  style={{ marginTop: 8 }}
                >
                  {plan.brief.watchOuts.join(" ")}
                </div>

                <div
                  className="chips"
                  style={{ marginTop: 9 }}
                >
                  {[
                    "safest",
                    "balanced",
                    "fastest",
                  ].map((preference) => (
                    <button
                      className="chip"
                      key={preference}
                      onClick={() =>
                        go(preference)
                      }
                    >
                      {preference}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Route options</h3>

                {plan.routes.map(
                  (route: ScoredRoute) => (
                    <div
                      className={
                        "route " +
                        (route === plan.routes[0]
                          ? "selected"
                          : "")
                      }
                      key={route.id}
                    >
                      <div className="routehead">
                        <b>{route.kind}</b>

                        <span className="pill">
                          {route.score}/100
                        </span>
                      </div>

                      <div className="muted">
                        {km(route.distance)} ·{" "}
                        {mins(route.duration)}
                      </div>

                      <div
                        className="notice"
                        style={{ marginTop: 5 }}
                      >
                        {route.reasons
                          .slice(0, 2)
                          .join(" ")}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="panel">
                <div className="grid2">
                  <div className="metric">
                    <b>
                      <CloudSun size={15} />{" "}
                      {Math.round(
                        plan.weather?.temperature || 0
                      )}
                      °
                    </b>

                    <span className="muted">
                      current weather
                    </span>
                  </div>

                  <div className="metric">
                    <b>
                      <Database size={15} />{" "}
                      {plan.amenities.length}
                    </b>

                    <span className="muted">
                      mapped amenities
                    </span>
                  </div>
                </div>

                <div className="footerline">
                  Live sources:{" "}
                  {plan.brief.sources.join(" · ")}
                </div>
              </div>
            </>
          )}

          <div className="panel chat">
            <h3>AI safety copilot</h3>

            <div className="messages">
              {chat.length === 0 && (
                <div className="notice">
                  Ask: “avoid isolated roads”,
                  “make this safer”, “why this
                  route?”, or “reroute for
                  fastest”. The agent can re-plan
                  using the live route engine.
                </div>
              )}

              {chat.map((message, index) => (
                <div
                  className={
                    "msg " +
                    (message.r === "user"
                      ? "user"
                      : "ai")
                  }
                  key={index}
                >
                  {message.t}
                </div>
              ))}
            </div>

            <div className="chatbox">
              <input
                className="input"
                value={msg}
                onChange={(event) =>
                  setMsg(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    ask();
                  }
                }}
                placeholder="Ask SafePath…"
              />

              <button
                className="smallbtn"
                onClick={ask}
                title="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </aside>

        <section className="mapwrap">
          <MapView
            origin={
              origin
                ? {
                    lat: origin.lat,
                    lng: origin.lng,
                  }
                : null
            }
            destination={
              dest
                ? {
                    lat: dest.lat,
                    lng: dest.lng,
                  }
                : null
            }
            routes={plan?.routes || []}
            amenities={plan?.amenities || []}
          />

          <div className="mapcard">
            <b>Safety-first navigation</b>

            <div
              className="notice"
              style={{ marginTop: 4 }}
            >
              Global routing + live weather +
              OpenStreetMap amenities + AI agent
              + Supabase RAG.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
