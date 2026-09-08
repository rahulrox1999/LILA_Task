import os
import json
import pyarrow.parquet as pq
import pandas as pd

# Map Configuration from README.md
MAP_CONFIGS = {
    'AmbroseValley': {'scale': 900, 'origin_x': -370, 'origin_z': -473},
    'GrandRift': {'scale': 581, 'origin_x': -290, 'origin_z': -290},
    'Lockdown': {'scale': 1000, 'origin_x': -500, 'origin_z': -500}
}

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'player_data', 'player_data')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')
MATCHES_OUTPUT_DIR = os.path.join(OUTPUT_DIR, 'matches')

def world_to_minimap(x: float, z: float, map_id: str):
    """Converts 3D world (x, z) coordinates to 2D minimap pixel coordinates (1024x1024)."""
    cfg = MAP_CONFIGS.get(map_id)
    if not cfg:
        return 0.0, 0.0
    
    u = (x - cfg['origin_x']) / cfg['scale']
    v = (z - cfg['origin_z']) / cfg['scale']
    
    pixel_x = round(u * 1024.0, 2)
    pixel_y = round((1.0 - v) * 1024.0, 2)
    
    return pixel_x, pixel_y

def is_bot(user_id: str) -> bool:
    """Returns True if user_id represents a bot (numeric ID), False if human (UUID)."""
    return user_id.strip().isdigit()

def main():
    print("=" * 60)
    print("Starting LILA BLACK Parquet Telemetry Data Processor")
    print("=" * 60)
    print(f"Data source path: {DATA_DIR}")
    
    if not os.path.exists(DATA_DIR):
        print(f"ERROR: Data directory not found at {DATA_DIR}")
        return

    os.makedirs(MATCHES_OUTPUT_DIR, exist_ok=True)

    date_folders = [f for f in os.listdir(DATA_DIR) if f.startswith('February_')]
    date_folders.sort()

    total_files_processed = 0
    total_records_processed = 0
    total_invalid_coords = 0
    
    event_counts = {}
    unique_players = set()
    unique_matches = set()
    maps_found = set()
    human_players = set()
    bot_players = set()
    
    earliest_ts = None
    latest_ts = None

    # In-memory match accumulator
    matches_data = {} # match_id -> { map_id, date, events: [] }

    for date_folder in date_folders:
        folder_path = os.path.join(DATA_DIR, date_folder)
        date_name = date_folder.replace('_', ' ') # e.g. "February 10"
        
        files = [f for f in os.listdir(folder_path) if not f.startswith('.')]
        print(f"Processing {date_folder}: {len(files)} files found...")

        for fname in files:
            fpath = os.path.join(folder_path, fname)
            try:
                table = pq.read_table(fpath)
                df = table.to_pandas()
            except Exception as e:
                print(f"  Warning: failed to read {fname}: {e}")
                continue

            total_files_processed += 1
            total_records_processed += len(df)

            for _, row in df.iterrows():
                user_id = str(row['user_id'])
                match_id = str(row['match_id'])
                map_id = str(row['map_id'])
                x = float(row['x'])
                y = float(row['y'])
                z = float(row['z'])
                
                # Timestamp handling (ms timestamp or pandas Timestamp)
                ts_val = row['ts']
                if isinstance(ts_val, pd.Timestamp):
                    ts = int(ts_val.timestamp() * 1000)
                else:
                    ts = int(ts_val)

                if earliest_ts is None or ts < earliest_ts:
                    earliest_ts = ts
                if latest_ts is None or ts > latest_ts:
                    latest_ts = ts

                # Decode byte event column if bytes
                raw_event = row['event']
                if isinstance(raw_event, bytes):
                    event_type = raw_event.decode('utf-8')
                else:
                    event_type = str(raw_event)

                # Stats aggregation
                unique_players.add(user_id)
                unique_matches.add(match_id)
                maps_found.add(map_id)
                
                bot_flag = is_bot(user_id)
                if bot_flag:
                    bot_players.add(user_id)
                else:
                    human_players.add(user_id)

                event_counts[event_type] = event_counts.get(event_type, 0) + 1

                # Coordinate Mapping
                px, py = world_to_minimap(x, z, map_id)
                if px < 0 or px > 1024 or py < 0 or py > 1024:
                    total_invalid_coords += 1

                # Group by match
                if match_id not in matches_data:
                    matches_data[match_id] = {
                        'match_id': match_id,
                        'map_id': map_id,
                        'date': date_name,
                        'events': []
                    }

                event_record = {
                    'u': user_id,
                    'b': 1 if bot_flag else 0,
                    'e': event_type,
                    't': ts,
                    'x': round(x, 2),
                    'z': round(z, 2),
                    'y': round(y, 2),
                    'px': px,
                    'py': py
                }
                matches_data[match_id]['events'].append(event_record)

    print("\n" + "=" * 60)
    print("DATA PROCESSING STATISTICS & VALIDATION REPORT")
    print("=" * 60)
    print(f"Total Files Processed:     {total_files_processed}")
    print(f"Total Records Processed:   {total_records_processed}")
    print(f"Total Matches:             {len(unique_matches)}")
    print(f"Total Unique Players:      {len(unique_players)} ({len(human_players)} Humans, {len(bot_players)} Bots)")
    print(f"Maps Found:                {sorted(list(maps_found))}")
    print(f"Earliest Match TS (ms):    {earliest_ts}")
    print(f"Latest Match TS (ms):      {latest_ts}")
    print(f"Coordinates Out-of-Bounds: {total_invalid_coords} ({round(total_invalid_coords/total_records_processed * 100, 2)}%)")
    print("\nEvent Counts Breakdown:")
    for ev, cnt in sorted(event_counts.items(), key=lambda item: item[1], reverse=True):
        print(f"  - {ev:<20}: {cnt:>6} ({round(cnt/total_records_processed * 100, 1)}%)")

    # Generate JSON outputs
    print("\n" + "=" * 60)
    print("Generating Optimized JSON Files...")
    print("=" * 60)

    match_index_list = []
    
    for match_id, m_data in matches_data.items():
        # Sort events by timestamp
        m_data['events'].sort(key=lambda ev: ev['t'])
        
        events = m_data['events']
        duration = events[-1]['t'] - events[0]['t'] if events else 0
        min_ts = events[0]['t'] if events else 0
        
        # Normalize relative timestamp in ms from match start for super clean timeline rendering
        players_in_match = set()
        humans_in_match = set()
        bots_in_match = set()
        match_event_counts = {}

        for ev in events:
            ev['rel_t'] = ev['t'] - min_ts
            u = ev['u']
            players_in_match.add(u)
            if ev['b'] == 1:
                bots_in_match.add(u)
            else:
                humans_in_match.add(u)
            
            e_type = ev['e']
            match_event_counts[e_type] = match_event_counts.get(e_type, 0) + 1

        # Save individual match JSON
        clean_match_filename = f"{match_id}.json"
        match_filepath = os.path.join(MATCHES_OUTPUT_DIR, clean_match_filename)

        match_payload = {
            'match_id': match_id,
            'map_id': m_data['map_id'],
            'date': m_data['date'],
            'start_ts': min_ts,
            'duration_ms': duration,
            'total_events': len(events),
            'human_count': len(humans_in_match),
            'bot_count': len(bots_in_match),
            'event_counts': match_event_counts,
            'events': events
        }

        with open(match_filepath, 'w', encoding='utf-8') as f:
            json.dump(match_payload, f, separators=(',', ':'))

        match_index_list.append({
            'match_id': match_id,
            'map_id': m_data['map_id'],
            'date': m_data['date'],
            'duration_ms': duration,
            'total_events': len(events),
            'human_count': len(humans_in_match),
            'bot_count': len(bots_in_match),
            'event_counts': match_event_counts
        })

    # Save index.json
    index_payload = {
        'total_matches': len(match_index_list),
        'maps': sorted(list(maps_found)),
        'dates': sorted(list(set(m['date'] for m in match_index_list))),
        'matches': match_index_list
    }

    index_filepath = os.path.join(OUTPUT_DIR, 'index.json')
    with open(index_filepath, 'w', encoding='utf-8') as f:
        json.dump(index_payload, f, indent=2)

    print(f"Successfully generated `public/data/index.json` ({len(match_index_list)} matches)")
    print(f"Successfully saved {len(matches_data)} match files into `public/data/matches/`")
    print("Data processing COMPLETE!")

if __name__ == '__main__':
    main()
