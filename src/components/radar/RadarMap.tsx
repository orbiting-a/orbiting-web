"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";

type MarkerData = {
  id: string;
  type: "orbit" | "user" | "event";
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  image?: string | null;
  href: string;
};

export function RadarMap({
  markers,
  center,
  radius,
  onCenterChange,
  userLocation,
}: {
  markers: MarkerData[];
  center: [number, number];
  radius: number;
  onCenterChange?: (lat: number, lng: number) => void;
  userLocation: [number, number] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // 3D rotation state (in radians)
  const rotationRef = useRef({ x: 0.5, y: 0.5 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const sweepAngleRef = useRef(0);

  // Resize canvas helper
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse / Touch handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * window.devicePixelRatio;
    const mouseY = (e.clientY - rect.top) * window.devicePixelRatio;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      rotationRef.current.y += dx * 0.007;
      rotationRef.current.x += dy * 0.007;

      // Restrict pitch to prevent turning upside down
      rotationRef.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotationRef.current.x));

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection on projected points
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.35 * zoomRef.current;

      const userLat = userLocation ? userLocation[0] : center[0];
      const userLng = userLocation ? userLocation[1] : center[1];

      let found: MarkerData | null = null;
      let minDistance = 20 * window.devicePixelRatio; // hover radius threshold

      markers.forEach((m) => {
        // Calculate relative position (flat approximation)
        const dLat = m.lat - userLat;
        const dLng = m.lng - userLng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        // Normalize distance based on active filter radius (in km)
        // Approx degrees to km: 111km per degree
        const distKm = dist * 111;
        const normDist = Math.min(distKm / radius, 1.0);

        const angle = Math.atan2(dLng, dLat);

        // Map to 3D point in a dome
        const ptR = normDist * baseRadius;
        const x3d = ptR * Math.sin(angle);
        const y3d = -normDist * baseRadius * 0.2; // slight dome elevation
        const z3d = ptR * Math.cos(angle);

        // Apply 3D rotations
        const rx = rotationRef.current.x;
        const ry = rotationRef.current.y;

        // Yaw (Y-rotation)
        const x1 = x3d * Math.cos(ry) - z3d * Math.sin(ry);
        const z1 = x3d * Math.sin(ry) + z3d * Math.cos(ry);

        // Pitch (X-rotation)
        const y2 = y3d * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = y3d * Math.sin(rx) + z1 * Math.cos(rx);

        // Perspective projection
        const cameraDist = baseRadius * 3;
        const scale = cameraDist / (cameraDist + z2);

        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        const distanceToMouse = Math.sqrt((screenX - mouseX) ** 2 + (screenY - mouseY) ** 2);
        if (distanceToMouse < minDistance) {
          minDistance = distanceToMouse;
          found = m;
        }
      });

      if (found) {
        setHoveredMarker(found);
        setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
      } else {
        setHoveredMarker(null);
        setTooltipPos(null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomRef.current += e.deltaY * -0.001;
    zoomRef.current = Math.max(0.5, Math.min(2.0, zoomRef.current));
  };

  // Main animation / render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background glow
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      grad.addColorStop(0, "#080c14");
      grad.addColorStop(1, "#030406");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.35 * zoomRef.current;

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;

      // Increment auto-rotation & sweep angle
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.001; // slow spin
      }
      sweepAngleRef.current = (sweepAngleRef.current + 0.015) % (Math.PI * 2);

      // Helper to project 3D point to 2D Screen
      const project = (x3d: number, y3d: number, z3d: number) => {
        // Yaw (Y-rotation)
        const x1 = x3d * Math.cos(ry) - z3d * Math.sin(ry);
        const z1 = x3d * Math.sin(ry) + z3d * Math.cos(ry);

        // Pitch (X-rotation)
        const y2 = y3d * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = y3d * Math.sin(rx) + z1 * Math.cos(rx);

        const cameraDist = baseRadius * 3;
        const scale = cameraDist / (cameraDist + z2);

        return {
          x: centerX + x1 * scale,
          y: centerY + y2 * scale,
          depth: z2,
        };
      };

      // 1. Draw Globe Grid (Latitude/Longitude curves)
      ctx.strokeStyle = "rgba(54, 188, 203, 0.08)";
      ctx.lineWidth = 1;

      // Horizontal rings (concentric grid rings)
      const ringSteps = [0.25, 0.5, 0.75, 1.0];
      ringSteps.forEach((step) => {
        ctx.beginPath();
        const r = baseRadius * step;
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
          const pt = project(r * Math.sin(a), 0, r * Math.cos(a));
          if (a === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      });

      // Longitudinal lines / rays from center
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount;
        const ptOuter = project(baseRadius * Math.sin(angle), 0, baseRadius * Math.cos(angle));
        const ptCenter = project(0, 0, 0);
        ctx.beginPath();
        ctx.moveTo(ptCenter.x, ptCenter.y);
        ctx.lineTo(ptOuter.x, ptOuter.y);
        ctx.stroke();
      }

      // 3D Dome lines (arch grid)
      ctx.strokeStyle = "rgba(54, 188, 203, 0.04)";
      for (let i = 0; i < 4; i++) {
        const rotYOffset = (i * Math.PI) / 4;
        ctx.beginPath();
        for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.05) {
          // Semi-circle arched upwards
          const x3d = baseRadius * Math.cos(a) * Math.sin(rotYOffset);
          const y3d = -baseRadius * Math.sin(a);
          const z3d = baseRadius * Math.cos(a) * Math.cos(rotYOffset);
          const pt = project(x3d, y3d, z3d);
          if (a === -Math.PI / 2) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // 2. Draw active sweeping beam
      const sweepPt = project(
        baseRadius * Math.sin(sweepAngleRef.current),
        0,
        baseRadius * Math.cos(sweepAngleRef.current)
      );
      const centerPt = project(0, 0, 0);
      const sweepGrad = ctx.createLinearGradient(centerPt.x, centerPt.y, sweepPt.x, sweepPt.y);
      sweepGrad.addColorStop(0, "rgba(54, 188, 203, 0)");
      sweepGrad.addColorStop(1, "rgba(54, 188, 203, 0.15)");
      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerPt.x, centerPt.y);
      ctx.lineTo(sweepPt.x, sweepPt.y);
      ctx.stroke();

      // 3. User Location / Center Pin
      const pulseSize = (Math.sin(Date.now() / 200) + 1) * 3 + 6;
      ctx.fillStyle = "#36BCCB";
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(54, 188, 203, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Outer bounding sphere boundary
      const boundaryPt = project(0, -baseRadius, 0);
      ctx.strokeStyle = "rgba(54, 188, 203, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Plot markers
      const userLat = userLocation ? userLocation[0] : center[0];
      const userLng = userLocation ? userLocation[1] : center[1];

      const colors: Record<string, string> = {
        orbit: "#36BCCB", // Cyan
        user: "#F9FF54",  // Yellow
        event: "#FF8D23", // Orange
      };

      // Sort markers by depth so they render back-to-front correctly
      const projectedMarkers = markers.map((m) => {
        const dLat = m.lat - userLat;
        const dLng = m.lng - userLng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        const distKm = dist * 111;
        const normDist = Math.min(distKm / radius, 1.0);
        const angle = Math.atan2(dLng, dLat);

        const ptR = normDist * baseRadius;
        const x3d = ptR * Math.sin(angle);
        const y3d = -normDist * baseRadius * 0.15; // slight dome elevation
        const z3d = ptR * Math.cos(angle);

        return {
          marker: m,
          proj: project(x3d, y3d, z3d),
          color: colors[m.type] || "#36BCCB",
        };
      });

      projectedMarkers.sort((a, b) => b.proj.depth - a.proj.depth);

      projectedMarkers.forEach(({ marker, proj, color }) => {
        // Draw stem to base plane for 3D depth perception
        const baseProj = project(
          (proj.x - centerX) / (baseRadius * 3 / (baseRadius * 3 + proj.depth)), // reverse simple scale projection
          0,
          0
        ); // simplified reference
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x, centerY); // flat shadow drop
        ctx.stroke();

        // Target glowing ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // If hovered or sweep active, show title
        const isHovered = hoveredMarker?.id === marker.id;
        const diffSweep = Math.abs(Math.atan2(proj.x - centerX, proj.depth) - sweepAngleRef.current);

        if (isHovered || diffSweep < 0.15) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.font = "11px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(marker.title, proj.x, proj.y - 14);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [markers, center, radius, userLocation, hoveredMarker]);

  return (
    <div
      className="h-full w-full relative select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Floating Holographic Compass Overlay */}
      <div className="absolute top-4 left-4 z-10 glass-card p-3 rounded-xl border border-white/5 pointer-events-none">
        <h4 className="text-xs font-bold text-brand-400 tracking-widest uppercase">Radar Terminal</h4>
        <p className="text-[10px] text-white/50 mt-0.5">Scale: {radius} km · Zoom: {Math.round(zoomRef.current * 100)}%</p>
        <p className="text-[9px] text-white/30 mt-1">Drag to rotate globe · Scroll to zoom</p>
      </div>

      {/* Hover Tooltip Popup */}
      {hoveredMarker && tooltipPos && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-3 w-56 glass-card p-4 rounded-xl shadow-2xl border border-brand-400/30 animate-fade-in pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                hoveredMarker.type === "orbit" ? "bg-cyan-500/20 text-cyan-400" :
                hoveredMarker.type === "user" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-orange-500/20 text-orange-400"
              }`}>
                {hoveredMarker.type}
              </span>
              <h4 className="text-sm font-bold text-white mt-2 leading-tight">{hoveredMarker.title}</h4>
              <p className="text-xs text-white/60 mt-1 leading-normal">{hoveredMarker.subtitle}</p>
            </div>
          </div>
          <div className="border-t border-white/5 mt-3 pt-3 flex items-center justify-between">
            <a
              href={hoveredMarker.href}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 transition-colors"
            >
              View details <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
