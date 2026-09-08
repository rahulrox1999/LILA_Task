import React, { useState, useEffect, useMemo } from 'react';
import { MapId, MAP_CONFIGS } from './types';
import { fetchIndexData, fetchMatchDetail, IndexData, MatchDetail } from './services/dataService';
import { MinimapCanvas } from './components/MinimapCanvas';
import { TimelineControls } from './components/TimelineControls';
import { Sidebar } from './components/Sidebar';
import { MapPin, Users, Activity, HelpCircle } from 'lucide-react';

export default function App() {
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState<string>('February 10');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // Selected Match Detail
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(false);

  // Timeline & Playback
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2);

  // Layer Toggles
  const [showHumans, setShowHumans] = useState<boolean>(true);
  const [showBots, setShowBots] = useState<boolean>(true);
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState({
    kills: true,
    deaths: true,
    loot: true,
    storm: true
  });
  const [heatmapMode, setHeatmapMode] = useState<'off' | 'traffic' | 'kills' | 'deaths'>('off');

  // Initial Index Load
  useEffect(() => {
    fetchIndexData()
      .then((data) => {
        setIndexData(data);
        setLoading(false);

        // Find initial match
        const initialMapMatches = data.matches.filter(m => m.map_id === 'AmbroseValley' && m.date === 'February 10');
        if (initialMapMatches.length > 0) {
          setSelectedMatchId(initialMapMatches[0].match_id);
        } else if (data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].match_id);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filter matches matching current Map & Date selection
  const filteredMatches = useMemo(() => {
    if (!indexData) return [];
    return indexData.matches.filter(
      (m) => m.map_id === selectedMap && m.date === selectedDate
    );
  }, [indexData, selectedMap, selectedDate]);

  // Sync selected match when map/date changes
  useEffect(() => {
    if (filteredMatches.length > 0) {
      const matchStillValid = filteredMatches.some(m => m.match_id === selectedMatchId);
      if (!matchStillValid) {
        setSelectedMatchId(filteredMatches[0].match_id);
      }
    } else {
      setSelectedMatchId('');
    }
  }, [filteredMatches]);

  // Load Match Details when selectedMatchId changes
  useEffect(() => {
    if (!selectedMatchId) {
      setMatchDetail(null);
      return;
    }

    setMatchLoading(true);
    setIsPlaying(false);
    setCurrentTimeMs(0);

    fetchMatchDetail(selectedMatchId)
      .then((detail) => {
        setMatchDetail(detail);
        setMatchLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMatchLoading(false);
      });
  }, [selectedMatchId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading LILA Telemetry Dataset...
      </div>
    );
  }

  if (error || !indexData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ef4444' }}>
        Error loading telemetry dataset: {error}
      </div>
    );
  }

  const mapConfig = MAP_CONFIGS[selectedMap];

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1440px', margin: '0 auto', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            LILA BLACK — Player Journey Visualization Tool
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Level Design Telemetry & Movement Explorer • {indexData.total_matches} Matches Analyzed
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#38bdf8" />
            <span>Map: <strong>{mapConfig.name}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} color="#f97316" />
            <span>Players: <strong>{matchDetail ? matchDetail.human_count : 0} Humans / {matchDetail ? matchDetail.bot_count : 0} Bots</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="#eab308" />
            <span>Events: <strong>{matchDetail ? matchDetail.total_events : 0}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {/* Sidebar Controls */}
        <Sidebar
          maps={indexData.maps}
          dates={indexData.dates}
          matches={filteredMatches}
          selectedMap={selectedMap}
          selectedDate={selectedDate}
          selectedMatchId={selectedMatchId}
          onMapChange={(m) => setSelectedMap(m)}
          onDateChange={(d) => setSelectedDate(d)}
          onMatchChange={(id) => setSelectedMatchId(id)}
          showHumans={showHumans}
          showBots={showBots}
          showPaths={showPaths}
          showEvents={showEvents}
          heatmapMode={heatmapMode}
          onToggleHumans={() => setShowHumans(!showHumans)}
          onToggleBots={() => setShowBots(!showBots)}
          onTogglePaths={() => setShowPaths(!showPaths)}
          onToggleEvent={(key) => setShowEvents({ ...showEvents, [key]: !showEvents[key] })}
          onHeatmapChange={(mode) => setHeatmapMode(mode)}
        />

        {/* Center Display Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, alignItems: 'center' }}>
          {matchLoading ? (
            <div style={{ padding: '60px', color: 'var(--text-muted)' }}>Loading match telemetry...</div>
          ) : matchDetail ? (
            <>
              {/* Minimap Canvas Viewport */}
              <MinimapCanvas
                mapId={selectedMap}
                events={matchDetail.events}
                currentTimeMs={currentTimeMs}
                showHumans={showHumans}
                showBots={showBots}
                showPaths={showPaths}
                showEvents={showEvents}
                heatmapMode={heatmapMode}
              />

              {/* Timeline Playback Controls */}
              <TimelineControls
                durationMs={matchDetail.duration_ms}
                currentTimeMs={currentTimeMs}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onTimeChange={(t) => setCurrentTimeMs(t)}
                onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
                onSpeedChange={(s) => setPlaybackSpeed(s)}
                onReset={() => {
                  setCurrentTimeMs(0);
                  setIsPlaying(false);
                }}
              />
            </>
          ) : (
            <div style={{ padding: '60px', color: 'var(--text-muted)' }}>
              No matches found for selected Map & Date filter.
            </div>
          )}
        </main>
      </div>

      {/* Legend & Guide Footer */}
      <footer
        style={{
          marginTop: '24px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>── Human Trajectory</span>
          <span style={{ color: '#f97316', fontWeight: 600 }}>--- Bot Trajectory</span>
          <span>⚔️ Kill Event</span>
          <span>💀 Death Event</span>
          <span>🎒 Loot Event</span>
          <span>⚡ Storm Death</span>
        </div>
        <div>Hover over points on the map for player & event telemetry details</div>
      </footer>
    </div>
  );
}
