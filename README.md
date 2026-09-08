# LILA Games - Player Journey Visualization Tool

A web-based telemetry visualizer for Level Designers to analyze player movement, bot trajectories, combat hot zones, and match playback across LILA BLACK maps.


Live Project Links

Live Hosted Application: https://stately-piroshki-9c7bf1.netlify.app/
Architecture Document: ARCHITECTURE.md
Level Design Insights: INSIGHTS.md


Features

Interactive Minimaps: Visualizes telemetry on AmbroseValley, GrandRift, and Lockdown.
Coordinate Conversion: Maps 3D world coordinates (x, z) to 2D minimap pixel coordinates.
Human and Bot Identification: Solid Cyan lines for Human players and Dashed Orange lines for AI Bots.
Event Markers: Clear markers for Kills, Deaths, Loot pickups, and Storm Deaths.
Match Timeline Playback: Play, pause, scrub timeline, and adjust speed (1x, 2x, 5x, 10x).
Density Heatmaps: Overlays for Traffic, Kills, and Deaths.
Telemetry Tooltips: Hovering displays player ID, bot status, event type, time, and 3D position.


Tech Stack

Frontend: React 18, TypeScript, HTML5 Canvas API, Vite.
Data Pipeline: Python 3 with pyarrow and pandas.


Local Setup and Development

1. Install Node dependencies:
npm install

2. Process raw Parquet data (optional, pre-processed data is included in public/data):
python scripts/process_data.py

3. Run local dev server:
npm run dev

Open http://localhost:3000 in your browser.


Production Build and Deployment

Build command:
npm run build

The production bundle is generated in the dist directory.
To deploy on Netlify or Vercel, upload the dist folder or set build command to "npm run build" and publish directory to "dist".


Repository Structure

ARCHITECTURE.md: Architecture, data flow, coordinate math, and trade-offs.
INSIGHTS.md: Three actionable level design insights backed by telemetry statistics.
README.md: Project setup guide.
package.json: Project configuration.
public/data: Generated match index and match details JSON files.
public/minimaps: Map image assets.
scripts/process_data.py: Python pre-processor script for raw Parquet files.
src: React components and coordinate transformation logic.
