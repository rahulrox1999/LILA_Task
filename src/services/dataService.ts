import { MapId, EventType } from '../types';

export interface RawEvent {
  u: string;  // user_id
  b: number;  // is_bot (1 or 0)
  e: EventType;
  t: number;  // timestamp ms
  x: number;  // world x
  z: number;  // world z
  y: number;  // world elevation
  px: number; // minimap pixel x (0-1024)
  py: number; // minimap pixel y (0-1024)
  rel_t: number; // relative time from match start in ms
}

export interface MatchSummary {
  match_id: string;
  map_id: MapId;
  date: string;
  duration_ms: number;
  total_events: number;
  human_count: number;
  bot_count: number;
  event_counts: Record<string, number>;
}

export interface IndexData {
  total_matches: number;
  maps: MapId[];
  dates: string[];
  matches: MatchSummary[];
}

export interface MatchDetail extends MatchSummary {
  start_ts: number;
  events: RawEvent[];
}

export async function fetchIndexData(): Promise<IndexData> {
  const res = await fetch('/data/index.json');
  if (!res.ok) {
    throw new Error('Failed to load dataset index');
  }
  return await res.json();
}

export async function fetchMatchDetail(matchId: string): Promise<MatchDetail> {
  const res = await fetch(`/data/matches/${matchId}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load match detail for ${matchId}`);
  }
  return await res.json();
}
