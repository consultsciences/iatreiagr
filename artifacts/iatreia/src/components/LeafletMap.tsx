import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";

// Fix default marker icons (Vite/webpack break Leaflet's relative paths)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type DoctorPin = {
  id: string | number;
  name: string;
  specialty: string;
  price: number;
  lat: number;
  lng: number;
};

const priceIcon = (price: number, active = false) =>
  L.divIcon({
    className: "",
    iconSize: [56, 32],
    iconAnchor: [28, 32],
    popupAnchor: [0, -32],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          background: hsl(174 72% 36%);
          color: white;
          font-weight: 700;
          font-size: 13px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,.25);
          ${active ? "transform:scale(1.15);background:hsl(215 39% 15%);" : ""}
        ">€${price}</div>
        <div style="
          width: 8px; height: 8px;
          background: ${active ? "hsl(215 39% 15%)" : "hsl(174 72% 36%)"};
          transform: rotate(45deg);
          margin-top: -3px;
          border-right: 2px solid white;
          border-bottom: 2px solid white;
        "></div>
      </div>`,
  });

const singleIcon = L.divIcon({
  className: "",
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -44],
  html: renderToStaticMarkup(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          background: "hsl(174 72% 36%)",
          color: "white",
          padding: 8,
          borderRadius: 999,
          border: "3px solid white",
          boxShadow: "0 6px 16px rgba(0,0,0,.3)",
        }}
      >
        <MapPin size={20} />
      </div>
      <div
        style={{
          width: 10,
          height: 10,
          background: "hsl(174 72% 36%)",
          transform: "rotate(45deg)",
          marginTop: -4,
        }}
      />
    </div>,
  ),
});

type Props = {
  pins: DoctorPin[];
  center?: [number, number];
  zoom?: number;
  activeId?: string | number | null;
  onPinClick?: (id: string | number) => void;
  variant?: "price" | "single";
  className?: string;
};

export const LeafletMap = ({
  pins,
  center,
  zoom = 13,
  activeId,
  onPinClick,
  variant = "price",
  className,
}: Props) => {
  const fallback: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [37.9838, 23.7275];
  const c = center ?? fallback;

  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className={className} style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={c}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeFix wrapperRef={wrapperRef} />
        {pins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={variant === "single" ? singleIcon : priceIcon(p.price, p.id === activeId)}
            eventHandlers={{ click: () => onPinClick?.(p.id) }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#0a8f7c", fontWeight: 600, textTransform: "uppercase" }}>
                  {p.specialty}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{p.name}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>από <strong>€{p.price}</strong></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const ResizeFix = ({ wrapperRef }: { wrapperRef: React.RefObject<HTMLDivElement | null> }) => {
  const map = useMap();
  useEffect(() => {
    // Initial nudge after mount
    const t = setTimeout(() => map.invalidateSize(), 50);
    if (!wrapperRef.current) return () => clearTimeout(t);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(wrapperRef.current);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map, wrapperRef]);
  return null;
};
