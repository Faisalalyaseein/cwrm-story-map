/* The story: one entry per scene. Edit this file to change the narrative, the camera, the layers or the order; no code change needed.
   Layer states: 'on' | 'dim' | 'off' (a layer that is not listed is off). Layer names: see GROUPS in story.js.
   camera.b = [[south, west], [north, east]]. steps[] = reveals inside a scene (each press of Next shows the next step); a step overrides the scene.
   stations: 'none' | 'all' | { status:'existing' } | { priority:[1,2] } | { ids:[...] } (proposed stations of that priority and the existing ones when existing:true).
   notes = the narrative the presenter says (from CWRM_WebGIS_Storyboard.docx); action = the WebGIS action of the storyboard. */
window.CWRM = window.CWRM || {};
CWRM.scenes = [
  {
    id: 'basin', title: 'The Euphrates Basin', line: 'A river shared by Türkiye, Syria and Iraq.',
    camera: { b: [[29.6, 34.6], [40.6, 49.4]] },
    layers: { basin: 'on', euph: 'on', basinRivers: 'dim', lakes: 'dim', iraq: 'dim' }, labels: 'countries',
    stats: [{ v: '3', l: 'countries share the river' }, { v: '552,000 km²', l: 'Euphrates basin (HydroBASINS)' }],
    steps: [
      {},
      { layers: { basin: 'on', euph: 'on', euphEmph: true, basinRivers: 'dim', lakes: 'dim', iraq: 'dim' }, line: 'The full course of the Euphrates, from the Turkish highlands to its junction with the Tigris.' },
      { layers: { basin: 'dim', euph: 'on', basinRivers: 'dim', lakes: 'dim', iraq: 'on' }, line: 'Iraq is the downstream country.', labels: 'countries' }
    ],
    notes: 'The Euphrates is a transboundary river shared by Türkiye, Syria and Iraq. Water availability in Iraq is shaped by upstream inflows, climate variability and growing demand across the basin. We therefore begin at the basin scale before moving to the national and local levels where the CWRM project is supporting more climate-resilient water resources management.',
    action: 'Open at the widest regional extent covering the Euphrates Basin from Türkiye through Syria to Iraq. Highlight the basin and the full course of the Euphrates, then identify Iraq as the downstream country.'
  },
  {
    id: 'iraq', title: 'Iraq as the Downstream Country', line: 'Cities, agriculture and ecosystems depend on what arrives from upstream.',
    camera: { b: [[29.0, 38.6], [37.6, 49.2]] },
    layers: { iraq: 'on', euph: 'on', basinRivers: 'on', lakes: 'on', basin: 'off', hrsBox: 'off' }, cities: ['Baghdad', 'Mosul', 'Basra', 'Najaf', 'Karbala', 'Hillah', 'Nasiriyah', 'Ramadi'], labels: 'countries',
    steps: [{}, { layers: { iraq: 'on', euph: 'on', basinRivers: 'dim', lakes: 'dim', hrsBox: 'on' }, camera: { b: [[30.4, 42.0], [34.6, 47.4]] }, line: 'The Hillah River System lies in the central and southern corridor of the Euphrates.', cities: ['Baghdad', 'Najaf', 'Karbala', 'Hillah', 'Diwaniyah', 'Nasiriyah', 'Samawah'], labels: 'none' }],
    notes: 'We now move to Iraq, where the Euphrates supports cities, agriculture, ecosystems and economic activity. The highlighted central and southern corridor leads us to the Hillah River System, the pilot area for the monitoring concept developed under CWRM.',
    action: 'Zoom from the basin to Iraq. Keep the Euphrates visible and highlight the location of the Hillah River System in central Iraq.'
  },
  {
    id: 'hrs', title: 'The Hillah River System', line: 'More than 200 km from the Hindiya Barrage to the downstream boundaries.',
    camera: { b: [[31.3, 44.0], [33.0, 45.9]] },
    layers: { reaches: 'on', euph: 'on', gov: 'on', govFill: 'on', basinRivers: 'off' }, cities: ['Hindiya', 'Hillah', 'Diwaniyah', 'Afak', 'Rumaitha', 'Samawah', 'Najaf', 'Karbala'], barrage: true, branchLabels: true, labels: 'none',
    stats: [{ v: '3', l: 'main branches downstream of the Hindiya Barrage' }, { v: '3', l: 'governorates: Babil, Al-Qadisiyah, Muthanna' }],
    steps: [{}, { branchFocus: 'Hillah', line: 'The Hillah main channel.' }, { branchFocus: 'Daghara', line: 'The Daghara branch.' }, { branchFocus: 'Diwaniyah', line: 'The Diwaniyah and Rumaytha branch.' }],
    notes: 'The Hillah River branches from the Euphrates at the Hindiya Barrage and continues through Babil, Diwaniyah and Muthanna. The system includes the Hillah main channel and the Daghara and Diwaniyah-Rumaytha branches. It supplies agriculture and urban areas across more than 200 kilometres, so management decisions require information from the system entrance to its downstream boundaries.',
    action: 'Zoom to the Hindiya Barrage and follow the three main branches downstream. Introduce the governorates, main cities and river-system boundaries.'
  },
  {
    id: 'canals', title: 'Irrigation Canals and Water Demand', line: 'Agriculture is the largest water user in the project area.',
    camera: { b: [[31.45, 44.15], [32.85, 45.7]] },
    layers: { reaches: 'on', euph: 'on', gov: 'dim' }, cities: ['Hillah', 'Diwaniyah', 'Afak', 'Rumaitha'], labels: 'none',
    stats: [{ v: '2,978 km', l: 'irrigation network in the study extent' }, { v: '7', l: 'irrigation projects' }],
    steps: [
      { layers: { reaches: 'on', euph: 'on', gov: 'dim', canals: 'off', projects: 'off' } },
      { layers: { reaches: 'on', euph: 'on', gov: 'dim', canals: 'on', projects: 'off' }, camera: { b: [[31.6, 44.3], [32.7, 45.5]] }, line: 'The river feeds an extensive network of irrigation canals.' },
      { layers: { reaches: 'on', euph: 'on', gov: 'dim', canals: 'on', projects: 'on' }, line: 'Irrigation-project boundaries show where the water is used.' }
    ],
    notes: 'The river feeds an extensive network of irrigation canals and abstraction points. Agriculture represents the largest share of water use in the project area. Monitoring at the system entrance, major offtakes and administrative boundaries will improve water accounting, support allocation decisions and provide a stronger basis for irrigation management.',
    action: 'Activate the irrigation-canal layer and zoom in until the canal network becomes visible. Add regulators, pumping stations and irrigation-project boundaries etc. (Regulators and pumping stations are not in the project data yet; only canals and project boundaries are shown.)'
  },
  {
    id: 'drainage', title: 'Drainage Network and Reuse Potential', line: 'Return flows are collected by drains and carried to the Main Outfall Drain.',
    camera: { b: [[31.45, 43.75], [33.5, 45.95]] },
    layers: { reaches: 'dim', euph: 'dim', canals: 'off', drains: 'on', mod: 'on' }, cities: ['Hillah', 'Diwaniyah', 'Baghdad'], labels: 'none', stationLabels: true,
    stats: [{ v: '5,392 km', l: 'drainage network in the study extent' }, { v: '4', l: 'proposed monitoring points on the MOD' }],
    steps: [
      { layers: { reaches: 'dim', euph: 'dim', canals: 'dim', drains: 'off', mod: 'off' }, mods: false },
      { layers: { reaches: 'dim', euph: 'dim', canals: 'off', drains: 'on', mod: 'on' }, mods: false, line: 'Drainage canals and the Main Outfall Drain (the Third River).' },
      { layers: { reaches: 'dim', euph: 'dim', canals: 'off', drains: 'on', mod: 'on' }, mods: true, line: 'Four proposed monitoring points along the Main Outfall Drain.' },
      { layers: { reaches: 'dim', euph: 'dim', canals: 'off', drains: 'on', mod: 'on', pollution: 'on' }, mods: false, camera: { b: [[31.35, 44.25], [32.65, 45.5]] }, line: 'Reported pollution sources: mostly sewage discharged into rivers and drains.',
        stats: [{ v: '32', l: 'reported pollution sources located (34 in the source tables)' }, { v: '27', l: 'of them sewage discharges' }] }
    ],
    notes: 'Irrigation return flows are collected through local drainage channels and conveyed towards the Main Outfall Drain, also known as the Third River. Farmers already reuse drainage water in some locations, but its quality and seasonal availability are not sufficiently monitored. Monitoring is therefore needed to assess safe reuse options, salinity risks and possible pollution sources. The Ministry records 34 reported pollution sources in Babylon, Diwaniyah and Muthanna, mostly sewage outlets discharging into the rivers and drains; 32 of them have a usable location and are shown on the map.',
    action: 'Switch off the irrigation canals and activate drainage canals, the Main Outfall Drain and the four proposed MOD monitoring points. Trace the connection from the Hillah agricultural area to the MOD. Then show the reported pollution sources and click one for its details.'
  },
  {
    id: 'current', title: 'The Existing Monitoring Network', line: 'Three hydrometric stations, all in need of rehabilitation or relocation.',
    camera: { b: [[31.5, 44.1], [32.9, 45.4]] },
    layers: { reaches: 'on', euph: 'on', canals: 'dim', drains: 'dim', mod: 'dim' }, stations: { status: 'existing' }, labels: 'none', stationLabels: true,
    stats: [{ v: '3', l: 'existing stations' }, { v: '3 of 3', l: 'need rehabilitation, relocation or repair' }],
    steps: [{}, { open: 'EX-02', line: 'Each station entry shows the documented condition.' }],
    notes: 'The current network consists of three hydrometric locations. All three require rehabilitation, relocation or repair, and the network does not provide a complete real-time picture of the river system. Continuous, integrated water-quality monitoring is not yet available. This is the starting point for the monitoring improvements proposed by the project.',
    action: 'Select the Current network view. Explain the status indicators for the three existing stations and open one station entry to show the documented condition.'
  },
  {
    id: 'gaps', title: 'Identified Monitoring Gaps', line: 'Green: river stretches covered by an existing station. Red: not covered.',
    camera: { b: [[31.5, 44.1], [32.9, 45.4]] },
    layers: { reaches: 'off', euph: 'dim', canals: 'dim', drains: 'off', gaps: 'on' }, stations: { status: 'existing', gapSites: true }, labels: 'none', stationLabels: true,
    steps: [{ stations: { status: 'existing' } }, { stations: { status: 'existing', gapSites: true }, line: 'Proposed sites with no existing station nearby fill the gaps.' }],
    notes: 'The gap analysis shows which river sections are not adequately covered by the existing stations. It also identifies proposed sites without a nearby station and highlights the need for monitoring at major offtakes, branch entrances and governorate boundaries. This turns the current data gap into a transparent and spatially justified monitoring plan.',
    action: 'Select Identified gaps. Explain the indicative coverage radius, the uncovered river stretches and the proposed gap-filling locations. (The 25 km radius is a working assumption, not a design criterion.)'
  },
  {
    id: 'master', title: 'The Master Plan for the Hillah River Monitoring System', line: 'Step by step: from four first-priority stations to a network of 18.',
    camera: { b: [[31.5, 44.1], [32.9, 45.4]] },
    layers: { reaches: 'on', euph: 'on', canals: 'dim', drains: 'dim', mod: 'dim' }, labels: 'none', stationLabels: true, links: true,
    stats: [{ v: '14 + 4', l: 'river and canal stations plus MOD stations' }],
    steps: [
      { stations: { status: 'existing', priority: [1] }, mods: false, line: 'Phase 1: four first-priority stations, three at or next to an existing site.', stats: [{ v: '4', l: '1st-priority stations (Phase 1)' }, { v: '3', l: 'build on or replace existing stations' }] },
      { stations: { status: 'existing', priority: [1, 2] }, mods: false, line: 'Five second-priority stations extend the network.', stats: [{ v: '9', l: 'stations in 1st and 2nd priority' }] },
      { stations: { status: 'existing', priority: [1, 2, 3] }, mods: false, line: 'Five third-priority stations complete the 14 stations on the river and canals.', stats: [{ v: '14', l: 'proposed stations on the river and canals' }] },
      { stations: { status: 'existing', priority: [1, 2, 3] }, mods: true, layers: { reaches: 'on', euph: 'on', canals: 'off', drains: 'on', mod: 'on' }, line: 'Four stations on the Main Outfall Drain complete the 18-station concept.', stats: [{ v: '14 + 4 = 18', l: 'proposed stations' }] }
    ],
    notes: 'The Master Plan sets out a step-by-step approach for establishing a comprehensive monitoring network for the Hillah River System. Implementation begins with four first-priority stations. They establish the upstream boundary condition, support monitoring at the main branch division and strengthen water-allocation monitoring between the governorates. Three can build on or replace existing locations, while one is a new site. This creates a minimum viable network that will be expanded step by step. The plan proposes fourteen monitoring stations along the river and its main canals, complemented by four stations along the Main Outfall Drain. The proposed network covers strategically important locations and will provide a better understanding of water availability, distribution and quality across the project area. By bringing the collected information together in the WebGIS and linking it with the planned RIBASIM model, the Master Plan will support more informed and climate-resilient water-management decisions.',
    action: 'Merged storyboard steps 8 and 9 (comment of C. Staerz). Reveal the four Phase 1 stations and the links between existing stations and their proposed successors; then the 2nd- and 3rd-priority stations; then activate the MOD station layer to complete the 18-station concept.'
  },
  {
    id: 'tech', title: 'Future Monitoring Technologies at Selected Sites', line: 'Select a proposed site to see its photograph, purpose, parameters and technologies.',
    camera: { b: [[31.5, 44.1], [32.9, 45.4]], pad: [400, 76, 450, 100] },
    layers: { reaches: 'on', euph: 'on', canals: 'dim', drains: 'dim', mod: 'dim' }, stations: { priority: [1, 2, 3] }, labels: 'none', stationLabels: true, tech: true,
    steps: [{}, { open: 'H-01' }, { open: 'DA-01' }, { open: 'DI-05' }],
    notes: 'Selecting a proposed location should not only show the site\'s function and monitoring parameters, but also illustrate the technologies that could be installed there. Depending on the monitoring objective and site conditions, this may include camera-based observation, non-contact radar-based water-level and flow measurement, and multiparameter sondes for continuous water-quality monitoring. German companies have particular expertise in these fields and can offer suitable technological solutions for the planned monitoring network.',
    action: 'Select different proposed stations and display the relevant technology images alongside the site photograph, monitoring purpose and parameters. (The technology images are illustrative; their source and licence are to be confirmed.)'
  },
  {
    id: 'decision', title: 'Climate Resilient Decision Support', line: 'From monitoring data to better operational and strategic decisions.',
    camera: { b: [[31.5, 44.1], [32.9, 45.4]] },
    layers: { reaches: 'on', euph: 'on', canals: 'dim', drains: 'on', mod: 'on' }, stations: { status: 'existing', priority: [1, 2, 3] }, mods: true, labels: 'none', links: true, stats: [{ v: '18', l: 'proposed stations in the master plan' }],
    steps: [{}, { panel: 'model' }, { panel: 'future' }],
    notes: 'The value of the monitoring network lies in how the data are translated into better operational and strategic decisions. Real-time, quality-controlled information can support more transparent water allocation, improved operation of irrigation systems, earlier responses to droughts, floods and pollution events, and informed decisions on the safe reuse of drainage water. The monitoring data will also provide an essential input for the planned RIBASIM water-resources model. They can be used to calibrate and validate the model, assess water availability and demand, simulate different allocation and climate scenarios, and compare the impacts of alternative management measures. Once a sufficient multi-year record is available, the combined monitoring and modelling system can further support forecasting and long-term climate-resilient planning.',
    action: 'Return to the full network. Close by linking the map to future dashboards, alerts and decision-support functions, while making clear that predictive analytics depend on sufficient validated data.'
  }
];
CWRM.panels = {
  model: { title: 'Monitoring data feed the planned RIBASIM model', items: ['Calibrate and validate the model', 'Assess water availability and demand', 'Simulate allocation and climate scenarios', 'Compare alternative management measures'] },
  future: { title: 'Planned: dashboards, alerts and decision support', items: ['More transparent water allocation', 'Improved operation of irrigation systems', 'Earlier response to droughts, floods and pollution events', 'Informed decisions on safe reuse of drainage water'], foot: 'Forecasting and predictive analytics depend on a sufficient, validated multi-year record.' }
};
/* Q&A topics (Explore mode): ready-made views for questions. layers = groups switched on (all others off); chips = station groups shown;
   fit = where to fly (b = bounds, branch = a Hillah River System branch, mod / pol = the MOD stations / pollution sources, st + z = one station); branchKey and gapOnly filter the stations. */
CWRM.topics = [
  { id: 'hindiya', title: 'Hindiya Barrage and the system entrance', fit: { st: 'EX-01', z: 11 }, layers: ['euph', 'reaches'], chips: ['existing', 'p1'], open: 'EX-01' },
  { id: 'hillah', title: 'Hillah main channel', fit: { branch: 'Hillah' }, layers: ['euph', 'reaches', 'canals'], chips: ['existing', 'p1', 'p2', 'p3'], branchKey: 'H' },
  { id: 'daghara', title: 'Daghara branch', fit: { branch: 'Daghara' }, layers: ['euph', 'reaches', 'canals'], chips: ['existing', 'p1', 'p2', 'p3'], branchKey: 'DA' },
  { id: 'diwaniyah', title: 'Diwaniyah / Rumaitha branch', fit: { branch: 'Diwaniyah' }, layers: ['euph', 'reaches', 'canals'], chips: ['existing', 'p1', 'p2', 'p3'], branchKey: 'DI' },
  { id: 'irrigation', title: 'Irrigation canals and projects', fit: { b: [[31.35, 44.15], [32.85, 45.7]] }, layers: ['euph', 'reaches', 'canals', 'projects'], chips: [] },
  { id: 'drainage', title: 'Drainage network and the Main Outfall Drain', fit: { b: [[31.45, 43.75], [33.5, 45.95]] }, layers: ['reaches', 'drains', 'mod'], chips: [] },
  { id: 'mod', title: 'MOD monitoring stations', fit: { mod: true }, layers: ['drains', 'mod'], chips: ['mod'] },
  { id: 'pollution', title: 'Reported pollution sources', fit: { pol: true }, layers: ['reaches', 'drains', 'mod', 'pollution'], chips: [] },
  { id: 'existing', title: 'Existing stations and their condition', fit: { b: [[31.5, 44.1], [32.9, 45.4]] }, layers: ['euph', 'reaches'], chips: ['existing'] },
  { id: 'priority1', title: 'First-priority stations', fit: { b: [[31.5, 44.1], [32.9, 45.4]] }, layers: ['euph', 'reaches'], chips: ['existing', 'p1'] },
  { id: 'gaps', title: 'Monitoring gaps', fit: { b: [[31.5, 44.1], [32.9, 45.4]] }, layers: ['reaches', 'gaps'], chips: ['existing', 'p1', 'p2', 'p3'], gapOnly: true }
];
