import React from 'react';
import { MapId } from '../types';
import { MatchSummary } from '../services/dataService';
import { Eye, EyeOff, Layers, Flame } from 'lucide-react';

interface SidebarProps {
  maps: MapId[];
  dates: string[];
  matches: MatchSummary[];
  selectedMap: MapId;
  selectedDate: string;
  selectedMatchId: string;
  onMapChange: (map: MapId) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (matchId: string) => void;

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

  onToggleHumans: () => void;
  onToggleBots: () => void;
  onTogglePaths: () => void;
  onToggleEvent: (eventKey: 'kills' | 'deaths' | 'loot' | 'storm') => void;
  onHeatmapChange: (mode: 'off' | 'traffic' | 'kills' | 'deaths') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  maps,
  dates,
  matches,
  selectedMap,
  selectedDate,
  selectedMatchId,
  onMapChange,
  onDateChange,
  onMatchChange,
  showHumans,
  showBots,
  showPaths,
  showEvents,
  heatmapMode,
  onToggleHumans,
  onToggleBots,
  onTogglePaths,
  onToggleEvent,
  onHeatmapChange
}) => {
  const currentMatch = matches.find((m) => m.match_id === selectedMatchId);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '320px',
        flexShrink: 0
      }}
    >
      {/* 1. Global Filters */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px'
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={18} color="#38bdf8" /> Match Selection
        </h2>

        {/* Map Filter */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Map</label>
          <select
            value={selectedMap}
            onChange={(e) => onMapChange(e.target.value as MapId)}
            style={selectStyle}
          >
            {maps.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</label>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={selectStyle}
          >
            {dates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Match Selection Dropdown */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Match ({matches.length} matches)
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => onMatchChange(e.target.value)}
            style={selectStyle}
          >
            {matches.map((m) => (
              <option key={m.match_id} value={m.match_id}>
                {m.bot_count > 0 ? '🤖 ' : ''}{m.match_id.slice(0, 8)}... ({m.human_count}H / {m.bot_count}B, {m.total_events} ev)
              </option>
            ))}
          </select>
        </div>

        {/* Match Stats Summary */}
        {currentMatch && (
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '12px',
              lineHeight: '1.5',
              marginTop: '12px'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Match Summary
            </div>
            <div><strong>Humans:</strong> {currentMatch.human_count}</div>
            <div>
              <strong>Bots:</strong> {currentMatch.bot_count}{' '}
              {currentMatch.bot_count === 0 && (
                <span style={{ color: '#eab308', fontSize: '11px' }}>(No bots in this match)</span>
              )}
            </div>
            <div><strong>Total Events:</strong> {currentMatch.total_events}</div>
            <div><strong>Duration:</strong> {(currentMatch.duration_ms / 1000).toFixed(1)}s</div>
          </div>
        )}
      </div>

      {/* 2. Visual Layers & Display Toggles */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px'
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={18} color="#38bdf8" /> Visual Layers
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onToggleHumans} style={buttonToggleStyle(showHumans, '#38bdf8')}>
            <span>👤 Human Players</span>
            {showHumans ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button onClick={onToggleBots} style={buttonToggleStyle(showBots, '#f97316')}>
            <span>🤖 AI Bots {currentMatch && currentMatch.bot_count === 0 ? '(0 in Match)' : ''}</span>
            {showBots ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button onClick={onTogglePaths} style={buttonToggleStyle(showPaths, '#a855f7')}>
            <span>📈 Trajectory Paths</span>
            {showPaths ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Event Markers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button onClick={() => onToggleEvent('kills')} style={buttonSmallToggleStyle(showEvents.kills, '#ef4444')}>
              ⚔️ Kills
            </button>
            <button onClick={() => onToggleEvent('deaths')} style={buttonSmallToggleStyle(showEvents.deaths, '#dc2626')}>
              💀 Deaths
            </button>
            <button onClick={() => onToggleEvent('loot')} style={buttonSmallToggleStyle(showEvents.loot, '#eab308')}>
              🎒 Loot
            </button>
            <button onClick={() => onToggleEvent('storm')} style={buttonSmallToggleStyle(showEvents.storm, '#a855f7')}>
              ⚡ Storm
            </button>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Overlays */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px'
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={18} color="#eab308" /> Heatmap Mode
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { id: 'off', label: 'Off' },
            { id: 'traffic', label: 'Traffic' },
            { id: 'kills', label: 'Kills' },
            { id: 'deaths', label: 'Deaths' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onHeatmapChange(mode.id as any)}
              style={{
                padding: '8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: heatmapMode === mode.id ? '#eab308' : 'var(--bg-main)',
                color: heatmapMode === mode.id ? '#0f172a' : 'var(--text-main)',
                fontWeight: heatmapMode === mode.id ? 700 : 400,
                cursor: 'pointer'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-main)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  fontSize: '13px'
};

const buttonToggleStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${active ? activeColor : 'var(--border-color)'}`,
  background: active ? `${activeColor}15` : 'var(--bg-main)',
  color: active ? activeColor : 'var(--text-muted)',
  fontSize: '13px',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer'
});

const buttonSmallToggleStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
  padding: '6px 8px',
  borderRadius: '6px',
  border: `1px solid ${active ? activeColor : 'var(--border-color)'}`,
  background: active ? `${activeColor}20` : 'var(--bg-main)',
  color: active ? activeColor : 'var(--text-muted)',
  fontSize: '12px',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer'
});
