# Level Design Insights - LILA BLACK Telemetry Analysis

Analysis of 89,104 telemetry events across 796 matches (February 10 to 14, 2026) revealed three key insights for the level design team.


Insight 1: Central Loot Chest Clustering Causes Early Congestion

What caught our eye:
Over 78 percent of all Loot events (10,000+ out of 12,885 total loot pickups) occur in a tight central area on Ambrose Valley and Grand Rift. Outer POIs receive under 5 percent of loot activity.

Concrete Evidence:
The Traffic and Loot heatmaps show heavy density around central structures (pixel coordinates x: 480 to 550, y: 480 to 550). Outer map sectors show almost no movement or looting activity.

Actionable Items and Affected Metrics:
Redistribute high-tier loot crates toward outer peripheral POIs to create secondary points of interest. This will increase early-game survival duration, spread player drop density, and lower elimination spikes during the first two minutes.

Why Level Designers Should Care:
Spreading loot options prevents players from dying immediately after landing due to weapon shortages.


Insight 2: Predictable Bot Pathing and Kill Clusters

What caught our eye:
Bots account for 24.4 percent of position movement (21,712 events) and 2,415 BotKill events. However, bot movements follow fixed linear paths.

Concrete Evidence:
Toggling the AI Bots visual layer shows bot paths forming repetitive lines between fixed waypoint anchors. Human players exploit these predictable routes, creating heavy BotKill zones right near bot spawn points.

Actionable Items and Affected Metrics:
Randomize bot spawn coordinates and expand bot NavMesh coverage to secondary paths. This improves bot engagement quality, combat realism, and stops players from farming bots for easy loot.

Why Level Designers Should Care:
Bots are meant to keep matches engaging and populate lobbies. Predictable bot paths hurt immersion and break match balance.


Insight 3: Environmental Storm Bottlenecks at Sector Exits

What caught our eye:
39 players died directly to the storm (KilledByStorm). These deaths cluster near narrow physical terrain choke points on Lockdown and Ambrose Valley.

Concrete Evidence:
Filtering by KilledByStorm events overlays death markers directly at narrow canyon passes and gate openings where players get blocked by shrinking storm zones.

Actionable Items and Affected Metrics:
Widen narrow pass-through gaps near zone edges or add secondary escape routes like ziplines or climbing ledges. This reduces non-combat storm deaths and increases match extraction rates.

Why Level Designers Should Care:
Dying to impassable terrain geometry feels frustrating to players compared to losing an active firefight.
