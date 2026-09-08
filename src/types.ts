export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export type EventType = 
  | 'Position' 
  | 'BotPosition' 
  | 'Kill' 
  | 'Killed' 
  | 'BotKill' 
  | 'BotKilled' 
  | 'KilledByStorm' 
  | 'Loot';

export interface MapConfig {
  id: MapId;
  name: string;
  image: string;
  scale: number;
  originX: number;
  originZ: number;
  imageWidth: number;
  imageHeight: number;
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  AmbroseValley: {
    id: 'AmbroseValley',
    name: 'Ambrose Valley',
    image: '/minimaps/AmbroseValley_Minimap.png',
    scale: 900,
    originX: -370,
    originZ: -473,
    imageWidth: 1024,
    imageHeight: 1024
  },
  GrandRift: {
    id: 'GrandRift',
    name: 'Grand Rift',
    image: '/minimaps/GrandRift_Minimap.png',
    scale: 581,
    originX: -290,
    originZ: -290,
    imageWidth: 1024,
    imageHeight: 1024
  },
  Lockdown: {
    id: 'Lockdown',
    name: 'Lockdown',
    image: '/minimaps/Lockdown_Minimap.jpg',
    scale: 1000,
    originX: -500,
    originZ: -500,
    imageWidth: 1024,
    imageHeight: 1024
  }
};

export interface TelemetryEvent {
  user_id: string;
  match_id: string;
  map_id: MapId;
  x: number;
  y: number; // elevation
  z: number;
  ts: number; // timestamp ms in match
  event: EventType;
  is_bot: boolean;
  pixel_x?: number;
  pixel_y?: number;
}

export interface PlayerTrajectory {
  user_id: string;
  is_bot: boolean;
  events: TelemetryEvent[];
}

export interface MatchData {
  match_id: string;
  map_id: MapId;
  date: string;
  duration_ms: number;
  total_events: number;
  human_count: number;
  bot_count: number;
  trajectories: Record<string, PlayerTrajectory>;
  all_events: TelemetryEvent[];
}
