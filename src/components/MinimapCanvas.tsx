import React, { useRef, useEffect, useState } from 'react';
import { MAP_CONFIGS, MapId } from '../types';
import { RawEvent } from '../services/dataService';

interface MinimapCanvasProps {
  mapId: MapId;
  events: RawEvent[];
  currentTimeMs: number;
  showHumans: boolean;
  showBots: boolean;
  showPaths: boolean;
  showEvents: {
    kills: boolean;
    deaths: boolean;
    loot: boolean;
    storm: boolean;
  };
  heatmapMode: 'off' | 'traffic' | 'kills' | 'deaths';
}

interface HoveredPoint {
  event: RawEvent;
  canvasX: number;
  canvasY: number;
}

// Color palette for distinct human & bot visualization
const HUMAN_COLOR = '#38bdf8'; // Bright Cyan
const BOT_COLOR = '#f97316';   // Vivid Orange

export const MinimapCanvas: React.FC<MinimapCanvasProps> = ({
  mapId,
  events,
  currentTimeMs,
  showHumans,
  showBots,
  showPaths,
  showEvents,
  heatmapMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const mapConfig = MAP_CONFIGS[mapId];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = mapConfig.image;
    img.onload = () => {
      renderCanvas();
    };

    function renderCanvas() {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const scaleFactor = width / 1024.0; // scale 1024 minimap to canvas dimension

      // 1. Clear & Draw Minimap Background
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Filter events up to currentTimeMs
      const visibleEvents = events.filter((ev) => ev.rel_t <= currentTimeMs);

      // Filter human/bot preference
      const filteredEvents = visibleEvents.filter((ev) => {
        if (ev.b === 1 && !showBots) return false;
        if (ev.b === 0 && !showHumans) return false;
        return true;
      });

      // 2. Heatmap Layer
      if (heatmapMode !== 'off') {
        let heatEvents: RawEvent[] = [];
        if (heatmapMode === 'traffic') {
          heatEvents = filteredEvents.filter(e => e.e === 'Position' || e.e === 'BotPosition');
        } else if (heatmapMode === 'kills') {
          heatEvents = filteredEvents.filter(e => e.e === 'Kill' || e.e === 'BotKill');
        } else if (heatmapMode === 'deaths') {
          heatEvents = filteredEvents.filter(e => e.e === 'Killed' || e.e === 'BotKilled' || e.e === 'KilledByStorm');
        }

        if (heatEvents.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const radius = Math.max(12, 18 * scaleFactor);

          heatEvents.forEach((ev) => {
            const cx = ev.px * scaleFactor;
            const cy = ev.py * scaleFactor;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            if (heatmapMode === 'kills' || heatmapMode === 'deaths') {
              grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
              grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else {
              grad.addColorStop(0, 'rgba(234, 179, 8, 0.25)');
              grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }
      }

      // 3. Group events by player trajectory
      const playerTrajectories: Record<string, RawEvent[]> = {};
      filteredEvents.forEach((ev) => {
        if (!playerTrajectories[ev.u]) {
          playerTrajectories[ev.u] = [];
        }
        playerTrajectories[ev.u].push(ev);
      });

      // 4. Draw Player Paths
      if (showPaths) {
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        Object.entries(playerTrajectories).forEach(([userId, pEvents]) => {
          if (pEvents.length < 2) return;
          const isBotPlayer = pEvents[0].b === 1;

          ctx.strokeStyle = isBotPlayer ? BOT_COLOR : HUMAN_COLOR;
          if (isBotPlayer) {
            ctx.setLineDash([4, 4]); // Dashed line for bots
          } else {
            ctx.setLineDash([]); // Solid line for humans
          }

          ctx.beginPath();
          pEvents.forEach((ev, idx) => {
            const cx = ev.px * scaleFactor;
            const cy = ev.py * scaleFactor;
            if (idx === 0) {
              ctx.moveTo(cx, cy);
            } else {
              ctx.lineTo(cx, cy);
            }
          });
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        });
      }

      // 5. Draw Active Player Current Positions
      Object.entries(playerTrajectories).forEach(([userId, pEvents]) => {
        if (pEvents.length === 0) return;
        const lastEv = pEvents[pEvents.length - 1];
        const cx = lastEv.px * scaleFactor;
        const cy = lastEv.py * scaleFactor;
        const isBotPlayer = lastEv.b === 1;

        ctx.fillStyle = isBotPlayer ? BOT_COLOR : HUMAN_COLOR;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 6. Draw Special Event Markers
      filteredEvents.forEach((ev) => {
        const cx = ev.px * scaleFactor;
        const cy = ev.py * scaleFactor;

        // Kills
        if ((ev.e === 'Kill' || ev.e === 'BotKill') && showEvents.kills) {
          ctx.fillStyle = '#ef4444'; // Red
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Crosshair
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
          ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Deaths
        if ((ev.e === 'Killed' || ev.e === 'BotKilled') && showEvents.deaths) {
          ctx.fillStyle = '#dc2626'; // Dark red skull indicator
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✕', cx, cy);
        }

        // Storm Deaths
        if (ev.e === 'KilledByStorm' && showEvents.storm) {
          ctx.fillStyle = '#a855f7'; // Purple
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', cx, cy);
        }

        // Loot
        if (ev.e === 'Loot' && showEvents.loot) {
          ctx.fillStyle = '#eab308'; // Gold
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.rect(cx - 3, cy - 3, 6, 6);
          ctx.fill();
          ctx.stroke();
        }
      });
    }

    renderCanvas();
  }, [mapId, events, currentTimeMs, showHumans, showBots, showPaths, showEvents, heatmapMode, mapConfig.image]);

  // Handle Mouse Hover Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / 1024.0;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const visibleEvents = events.filter((ev) => ev.rel_t <= currentTimeMs);

    let closest: RawEvent | null = null;
    let minDist = 15; // Threshold radius in pixels

    visibleEvents.forEach((ev) => {
      const cx = ev.px * scaleFactor;
      const cy = ev.py * scaleFactor;
      const dist = Math.hypot(cx - mouseX, cy - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closest = ev;
      }
    });

    if (closest) {
      setHoveredPoint({
        event: closest,
        canvasX: mouseX,
        canvasY: mouseY
      });
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '1 / 1' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={640}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          cursor: 'crosshair',
          background: '#090d16'
        }}
      />

      {/* Tooltip Popup */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(hoveredPoint.canvasX + 12, 450)}px`,
            top: `${Math.min(hoveredPoint.canvasY + 12, 520)}px`,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#f8fafc',
            pointerEvents: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px', color: hoveredPoint.event.b === 1 ? BOT_COLOR : HUMAN_COLOR }}>
            {hoveredPoint.event.b === 1 ? '🤖 Bot Player' : '👤 Human Player'}
          </div>
          <div><strong>ID:</strong> {hoveredPoint.event.u}</div>
          <div><strong>Event:</strong> {hoveredPoint.event.e}</div>
          <div><strong>Time:</strong> {(hoveredPoint.event.rel_t / 1000).toFixed(1)}s</div>
          <div><strong>World Pos:</strong> X: {hoveredPoint.event.x}, Z: {hoveredPoint.event.z}, Y (Elev): {hoveredPoint.event.y}</div>
          <div><strong>Minimap Coords:</strong> ({hoveredPoint.event.px}, {hoveredPoint.event.py})</div>
        </div>
      )}
    </div>
  );
};
