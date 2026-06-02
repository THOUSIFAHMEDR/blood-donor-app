/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import type { Donor } from "../App";

// Extracted types from Leaflet and Google Maps window object
declare global {
  interface Window {
    L: any;
    google: any;
    googleMapsLoaded?: boolean;
  }
}

interface DonorMapProps {
  donors: Donor[];
  center: [number, number]; // [lat, lng]
  selectedDonorId: number | null;
  onSelectDonor: (id: number) => void;
}

export default function DonorMap({ donors, center, selectedDonorId, onSelectDonor }: DonorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<"leaflet" | "google">(() => {
    return (localStorage.getItem("lifelink_map_provider") as "leaflet" | "google") || "google";
  });
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("lifelink_google_api_key") || "";
  });
  const [showSettings, setShowSettings] = useState(false);
  const [apiInput, setApiInput] = useState(apiKey || "");
  const [googleReady, setGoogleReady] = useState(false);

  // Map instance references
  const leafletMapInst = useRef<any>(null);
  const leafletMarkers = useRef<Record<number, any>>({});
  const leafletHospitalMarker = useRef<any>(null);

  const googleMapInst = useRef<any>(null);
  const googleMarkers = useRef<Record<number, any>>({});
  const googleHospitalMarker = useRef<any>(null);
  const googleInfoWindow = useRef<any>(null);

  const showGoogleInfoWindow = (donor: Donor, marker: any) => {
    if (!googleInfoWindow.current || !googleMapInst.current) return;
    googleInfoWindow.current.setContent(`
      <div style="font-family: 'DM Sans', sans-serif;">
        <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 14px; font-weight: 600;">${donor.name}</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #aaa;">Blood Group: <strong style="color: #FF3B3B;">${donor.blood}</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #aaa;">Distance: ${donor.distance} km (${donor.time})</p>
        <p style="margin: 0; font-size: 11px; color: ${donor.available ? "#00C853" : "#FF3B3B"}; font-weight: 700;">
          ● ${donor.available ? "AVAILABLE" : "UNAVAILABLE"}
        </p>
      </div>
    `);
    googleInfoWindow.current.open(googleMapInst.current, marker);
  };

  const getPopupContent = (donor: Donor) => {
    return `
      <div style="padding: 2px;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #fff;">${donor.name}</h4>
        <div style="font-size: 11px; color: #aaa; margin-bottom: 6px;">
          Blood Type: <span style="color: #FF3B3B; font-weight:700;">${donor.blood}</span> · Age ${donor.age}<br/>
          📍 ${donor.distance} km (${donor.time})
        </div>
        <div style="font-size: 10px; font-weight: 700; color: ${donor.available ? "#00C853" : "#FF3B3B"}; text-transform: uppercase;">
          ${donor.available ? "✓ Available to Donate" : "✗ Unavailable"}
        </div>
      </div>
    `;
  };

  // Inject Map Pin Animations & Leaflet overrides once
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "map-markers-style";
    style.textContent = `
      /* Marker Animation Keyframes */
      @keyframes mapPulse {
        0% { transform: scale(0.6); opacity: 1; }
        100% { transform: scale(2.6); opacity: 0; }
      }

      /* Base Marker Styles */
      .custom-map-pin {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px !important;
        height: 32px !important;
        margin-left: -16px !important;
        margin-top: -16px !important;
      }

      .pin-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 10;
        position: relative;
      }

      .pin-pulse {
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        animation: mapPulse 1.8s ease-out infinite;
        z-index: 1;
      }

      /* Pin Types */
      .pin-hospital .pin-dot { background-color: #29B6F6; }
      .pin-hospital .pin-pulse { background-color: rgba(41, 182, 246, 0.4); }

      .pin-donor-available .pin-dot { background-color: #00C853; }
      .pin-donor-available .pin-pulse { background-color: rgba(0, 200, 83, 0.4); }

      .pin-donor-unavailable .pin-dot { background-color: #FF3B3B; }
      .pin-donor-unavailable .pin-pulse { background-color: rgba(255, 59, 59, 0.4); }

      /* Popup styling override for Leaflet */
      .leaflet-popup-content-wrapper {
        background: #0d0d0d !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #ffffff !important;
        border-radius: 12px !important;
        padding: 4px !important;
        font-family: 'DM Sans', sans-serif !important;
      }
      .leaflet-popup-tip {
        background: #0d0d0d !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
      }
      .leaflet-container a.leaflet-popup-close-button {
        color: #888 !important;
        padding: 8px 8px 0 0 !important;
      }
      
      /* Google Map Custom Info Window Styling */
      .gm-style .gm-style-iw-c {
        background-color: #0d0d0d !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 12px !important;
        color: #ffffff !important;
        font-family: 'DM Sans', sans-serif !important;
        padding: 12px !important;
        max-width: 250px !important;
      }
      .gm-style .gm-style-iw-tc::after {
        background-color: #0d0d0d !important;
      }
      .gm-ui-hover-close {
        filter: invert(1);
        margin: 4px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById("map-markers-style")?.remove();
    };
  }, []);

  // Dynamically Load Google Maps JS API script if chosen
  useEffect(() => {
    if (provider !== "google" || !apiKey) return;

    const loadGoogleMaps = () => {
      if (window.google) {
        setGoogleReady(true);
        return;
      }
      const existing = document.getElementById("google-maps-api-script");
      if (existing) {
        existing.addEventListener("load", () => setGoogleReady(true));
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-api-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleReady(true);
      };
      script.onerror = () => {
        console.error("Google Maps script failed to load. Falling back to Leaflet.");
        setProvider("leaflet");
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [provider, apiKey]);

  // Main Map Render Effect
  useEffect(() => {
    if (!mapRef.current) return;

    // ─── OPTION 1: GOOGLE MAPS ────────────────────────────────────────────────
    if (provider === "google" && googleReady && window.google) {
      // Destroy Leaflet map if it exists
      if (leafletMapInst.current) {
        leafletMapInst.current.remove();
        leafletMapInst.current = null;
        leafletMarkers.current = {};
        leafletHospitalMarker.current = null;
      }

      // Initialize Google Map
      if (!googleMapInst.current) {
        googleMapInst.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#080c10" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#080c10" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#091c14" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#171d24" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a32" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b1" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#2c353f" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0e1621" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
          ],
        });
        googleInfoWindow.current = new window.google.maps.InfoWindow();
      }

      const map = googleMapInst.current;
      map.setCenter({ lat: center[0], lng: center[1] });

      // Update Hospital Marker
      if (googleHospitalMarker.current) {
        googleHospitalMarker.current.setMap(null);
      }
      googleHospitalMarker.current = new window.google.maps.Marker({
        position: { lat: center[0], lng: center[1] },
        map,
        title: "Hospital Center",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#29B6F6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Update Donors Markers
      // First clean old markers
      Object.values(googleMarkers.current).forEach((m) => m.setMap(null));
      googleMarkers.current = {};

      donors.forEach((donor) => {
        const marker = new window.google.maps.Marker({
          position: { lat: donor.lat, lng: donor.lng },
          map,
          title: donor.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: donor.available ? "#00C853" : "#FF3B3B",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
          },
        });

        marker.addListener("click", () => {
          onSelectDonor(donor.id);
          showGoogleInfoWindow(donor, marker);
        });

        googleMarkers.current[donor.id] = marker;
      });

      return;
    }

    // ─── OPTION 2: LEAFLET (DEFAULT) ──────────────────────────────────────────
    if (provider === "leaflet" && window.L) {
      // Destroy Google Map references
      if (googleMapInst.current) {
        googleMapInst.current = null;
        googleMarkers.current = {};
        googleHospitalMarker.current = null;
        googleInfoWindow.current = null;
      }

      // Initialize Leaflet Map
      if (!leafletMapInst.current) {
        leafletMapInst.current = window.L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(center, 13);

        // CartoDB Dark Matter tiles
        window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(leafletMapInst.current);
      }

      const map = leafletMapInst.current;
      map.setView(center, map.getZoom());

      // Update Hospital Marker
      if (leafletHospitalMarker.current) {
        leafletHospitalMarker.current.remove();
      }
      const hospitalIcon = window.L.divIcon({
        className: "custom-map-pin pin-hospital",
        html: '<div class="pin-pulse"></div><div class="pin-dot"></div>',
      });
      leafletHospitalMarker.current = window.L.marker(center, { icon: hospitalIcon })
        .addTo(map)
        .bindPopup("🏥 <strong>Hospital Center</strong><br/>Recipient Location");

      // Update Donors Markers
      // Remove old ones
      Object.values(leafletMarkers.current).forEach((m) => m.remove());
      leafletMarkers.current = {};

      donors.forEach((donor) => {
        const pinClass = donor.available ? "pin-donor-available" : "pin-donor-unavailable";
        const donorIcon = window.L.divIcon({
          className: `custom-map-pin ${pinClass}`,
          html: '<div class="pin-pulse"></div><div class="pin-dot"></div>',
        });

        const marker = window.L.marker([donor.lat, donor.lng], { icon: donorIcon })
          .addTo(map)
          .bindPopup(getPopupContent(donor));

        marker.on("click", () => {
          onSelectDonor(donor.id);
        });

        leafletMarkers.current[donor.id] = marker;
      });
    }
  }, [provider, googleReady, donors, center, onSelectDonor]);

  // Handle selectedDonorId changes to pan and zoom
  useEffect(() => {
    if (!selectedDonorId) return;

    const donor = donors.find((d) => d.id === selectedDonorId);
    if (!donor) return;

    if (provider === "google" && googleMapInst.current && window.google) {
      const map = googleMapInst.current;
      const marker = googleMarkers.current[selectedDonorId];
      if (marker) {
        map.panTo({ lat: donor.lat, lng: donor.lng });
        map.setZoom(14);
        showGoogleInfoWindow(donor, marker);
      }
    } else if (provider === "leaflet" && leafletMapInst.current && window.L) {
      const map = leafletMapInst.current;
      const marker = leafletMarkers.current[selectedDonorId];
      if (marker) {
        map.setView([donor.lat, donor.lng], 14, { animate: true });
        marker.openPopup();
      }
    }
  }, [selectedDonorId, donors, provider]);



  const handleSaveSettings = () => {
    localStorage.setItem("lifelink_map_provider", provider);
    localStorage.setItem("lifelink_google_api_key", apiInput);
    setApiKey(apiInput);
    setShowSettings(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "260px", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
      {/* Map rendering div */}
      <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#080c10" }} />

      {/* Settings gear icon */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 400,
          background: "rgba(8,12,16,0.85)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer",
          fontSize: 18,
          backdropFilter: "blur(10px)",
          transition: "transform 0.2s",
        }}
      >
        ⚙️
      </button>

      {/* Settings Modal overlay */}
      {showSettings && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,12,16,0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 410,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "20px 24px",
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: 16, fontFamily: "'Playfair Display', serif", color: "#FF3B3B" }}>Map Configurations</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>MAP PROVIDER</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {(["leaflet", "google"] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProvider(prov)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: provider === prov ? "rgba(255,59,59,0.15)" : "transparent",
                    border: `1.5px solid ${provider === prov ? "#FF3B3B" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8,
                    color: provider === prov ? "#FF3B3B" : "#888",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                >
                  {prov === "leaflet" ? "OSM (Dark)" : "Google Maps"}
                </button>
              ))}
            </div>
          </div>

          {provider === "google" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>GOOGLE MAPS API KEY</label>
              <input
                type="text"
                placeholder="Enter API Key..."
                value={apiInput}
                onChange={(e) => setApiInput(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                  marginTop: 6,
                  fontFamily: "'DM Mono', monospace",
                }}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: 10, color: "#666" }}>Required for Google Maps script to load correctly.</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => {
                setShowSettings(false);
                setApiInput(apiKey);
                setProvider((localStorage.getItem("lifelink_map_provider") as any) || "leaflet");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#888",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSaveSettings}
              style={{
                flex: 2,
                padding: "10px 0",
                background: "linear-gradient(90deg,#FF3B3B,#C62A88)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
