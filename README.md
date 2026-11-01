# CWRM story web map: Hillah River System monitoring concept

A presenter-led, interactive story map built on the first CWRM web app (`../webapp`). Ten scenes (30 steps) follow the storyboard `CWRM_WebGIS_Storyboard.docx` (BMZ Minister visit, 10 to 12 minutes). Only the GIZ logo is shown. **Draft, internal.**

## Open it
- Double-click `index.html` (works from disk; the default basemap (OpenFreeMap Positron) needs internet, and without it the bundled vector countries map shows instead). Or serve the folder: `node _build/serve.js 8771` then http://localhost:8771
- Link to a scene: `index.html#s=8` (scene) or `#s=8&p=3` (scene and step).

## Presenting
| Key | Action |
|---|---|
| Right arrow, Space, Page Down, Next button | next step (a scene has 1 to 4 steps), then next scene |
| Left arrow, Page Up, Back button | previous step / scene |
| 1 to 9, 0 | jump to scene 1 to 9, 10 |
| Home / End | first / last scene |
| N | narrative notes (the storyboard text and the WebGIS action) |
| E | Explore: free pan and zoom, layer toggles, all stations clickable; E again returns to the story |
| H | hide / show the scene text |
| F | full screen |
| Esc | close card, notes, menu |

Clicking a station (diamond) or MOD point (square) opens its card at any time; the dots at the bottom jump to a scene. A usual clicker works as Next and Back.

## Change the story (no code change)
`js/scenes.js`: one entry per scene with the camera, layer states (`on`, `dim`, `off`), stations to show, cities, steps, on-screen text and notes. `js/story.js` has the colour palette (`PAL`, top of the file: freshwater in blues, drainage water in olive / ochre) and the engine.

## Data
| Content | Source | File |
|---|---|---|
| Basin outline (Euphrates, Tigris) | HydroBASINS v1c level 6 (HydroSHEDS), dissolved by `CWRM_v2/data/scripts/add_basin_boundary.py`; also in the master GeoPackage as `hydro_basin_boundary` | `data/basin.js` |
| Basin rivers, lakes, upstream Euphrates | RIMES shapefiles via the master GeoPackage | `data/basin.js` |
| Euphrates in Iraq, canals, drains, projects, governorates, reaches, stations, MOD points | master GeoPackage / first web app export | `data/*.js` |
| Cities | OpenStreetMap (ODbL) | `data/cities.js` |
| Countries (offline basemap) | Natural Earth 1:50m (public domain) | `data/countries.js` |
Rebuild the extra data with `python _build/export_story_data.py` and `python _build/export_countries.py` (ArcGIS Pro's Python). Station data and photographs are copied from `../webapp`.

## Not in the data yet (flagged, nothing invented)
Regulators and pumping stations (scene 4); parameters, priority and photographs of the four MOD stations (they appear as proposed points with names only); source and licence of the technology images (scene 9); publisher, date and licence of the RIMES data; the formal definition of a monitoring gap (the 25 km radius is a working assumption).

## Technical
Plain HTML, JavaScript and Leaflet 1.9.4 (bundled), no build step, about 2 MB of data plus photographs. Online basemaps: OpenFreeMap Positron light grey (default), OpenStreetMap standard, OpenTopoMap (Explore mode). Esri and Carto tiles were tried and no longer work without a key (checked 2026-11-01).
