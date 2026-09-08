import { MAP_CONFIGS, MapId } from '../types';

export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * Converts world coordinates (x, z) to 2D minimap pixel coordinates (pixel_x, pixel_y).
 * Based on the official LILA BLACK coordinate conversion formula:
 * u = (x - origin_x) / scale
 * v = (z - origin_z) / scale
 * pixel_x = u * imageWidth
 * pixel_y = (1 - v) * imageHeight
 */
export function worldToMinimap(x: number, z: number, mapId: MapId): PixelPoint {
  const config = MAP_CONFIGS[mapId];
  if (!config) {
    return { x: 0, y: 0 };
  }

  const u = (x - config.originX) / config.scale;
  const v = (z - config.originZ) / config.scale;

  const pixel_x = u * config.imageWidth;
  const pixel_y = (1 - v) * config.imageHeight;

  return {
    x: Math.round(pixel_x * 100) / 100,
    y: Math.round(pixel_y * 100) / 100
  };
}

/**
 * Helper to check if a user_id represents a bot or a human player.
 * UUID format (e.g. f4e072fa-b7af-4761-b567-1d95b7ad0108) = Human
 * Short numeric ID (e.g. 1440) = Bot
 */
export function isBot(userId: string): boolean {
  return /^\d+$/.test(userId.trim());
}
