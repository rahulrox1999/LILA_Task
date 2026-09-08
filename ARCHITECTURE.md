# Architecture Document - LILA BLACK Player Journey Visualization Tool

1. System Overview & Tech Stack Selection
The Player Journey Visualization Tool is a web-based telemetry visualizer built for Level Designers at LILA Games.

Frontend: React 18, TypeScript, HTML5 Canvas API, Vite.
HTML5 Canvas offers smooth 60fps rendering of thousands of trajectory points and event markers without DOM performance issues. React handles state management for map selection, date filtering, and timeline playback.

Data Processing Pipeline: Python 3 with pyarrow and pandas.
Python processes the 1,243 raw Parquet files during the build phase. It decodes byte strings, detects bot vs human player IDs, normalizes timestamps, and pre-computes minimap pixel coordinates. This approach allows the browser app to load instantly without heavy client-side WASM dependencies.


2. Data Flow Architecture

Raw Parquet Files -> scripts/process_data.py -> public/data/index.json + match files -> React Frontend Canvas

First, process_data.py iterates through all 1,243 files across February 10-14.
Second, UTF-8 byte strings in the event column are decoded into readable event names.
Third, user_id values are classified as human or bot based on whether the string is a UUID or numeric ID.
Fourth, 3D world coordinates (x, z) are mapped to 2D minimap pixel coordinates.
Fifth, data is exported into public/data/index.json (match catalog) and public/data/matches/<match_id>.json (individual match trajectories sorted by relative time).


3. Coordinate Mapping Approach

In-game world coordinates (x, z) are mapped to 1024x1024 pixel minimaps using the linear transformation formula from the game spec:

u = (x - origin_x) / scale
v = (z - origin_z) / scale

pixel_x = u * 1024
pixel_y = (1 - v) * 1024

Note on vertical flip: The v coordinate is subtracted from 1 because 2D image coordinates start from top-left (0,0) whereas game world Z coordinates increase upward.

Map Configuration Values:
AmbroseValley: scale = 900, origin_x = -370, origin_z = -473
GrandRift: scale = 581, origin_x = -290, origin_z = -290
Lockdown: scale = 1000, origin_x = -500, origin_z = -500


4. Assumptions and Data Handling

Bytes Decoding: The event column in the Parquet files contains raw byte strings such as b'Position' and b'BotKill'. These are decoded using utf-8.
Elevation Value: The y field represents elevation height in 3D space. It is preserved for detailed tooltip telemetry while x and z are used for 2D minimap mapping.
Timestamp Normalization: Timestamps represent elapsed time within a match. Timestamps are offset to match start time (rel_t = t - start_t) so timeline scrubbing works consistently across files.
Partial Data: February 14 contains 79 files (partial day dataset) and is processed cleanly without breaking aggregations.


5. Architecture Trade-offs

Client-side WASM vs Static Pre-processed JSON:
Client-side WASM requires loading heavy libraries and causes loading delays. Pre-processing to JSON allows instant load times (<50ms) and simple static deployment on Netlify or Vercel.

SVG Rendering vs HTML5 Canvas:
DOM SVG nodes lag when animating hundreds of moving points. HTML5 Canvas maintains 60fps performance during timeline playback.

3D View vs 2D Minimap Canvas:
A 2D top-down minimap provides clear, actionable spatial visualization for level designers without unnecessary 3D camera complexity.
