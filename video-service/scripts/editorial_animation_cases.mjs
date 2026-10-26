// Production-safe QA fixtures. Same AXAnimationPreview composition as existing animations.
export const cases = [
  {id:"VA-LF-015",name:"Two Aging Clocks",durationFrames:240,values:{
    title:"The battery ages in two ways",cycleLabel:"CHARGING CYCLES",
    calendarLabel:"CALENDAR TIME",takeaway:"Even while parked, the calendar clock keeps moving.",
    footer:"QUALITATIVE ILLUSTRATION — NOT MEASURED DEGRADATION"}},
  {id:"VA-LF-016",name:"Calendar Aging Inside a Cell",durationFrames:240,values:{
    title:"Chemistry continues while parked",anodeLabel:"NEGATIVE ELECTRODE",
    cathodeLabel:"POSITIVE ELECTRODE",reactionLabel:"Slow interface side reactions",
    footer:"SIMPLIFIED CELL SCHEMATIC — NOT AN ATOMIC-SCALE OR RATE MEASUREMENT"}},
  {id:"VA-LF-017",name:"Temperature × Stored SoC",durationFrames:240,values:{
    title:"Heat and stored charge shape aging stress",xAxisLabel:"STORED STATE OF CHARGE",
    yAxisLabel:"TEMPERATURE",footer:"QUALITATIVE RELATIVE-STRESS MAP — NO NUMERIC AGING RATES"}},
  {id:"VA-LF-018",name:"Geotab Fleet Evidence",durationFrames:240,values:{
    title:"Hot climates and battery health decline",vehicles:22000,models:21,difference:0.4,
    source:"GEOTAB EV FLEET ANALYSIS",footer:"APPROVED NARRATION FIGURES; OBSERVATIONAL RESULTS — NOT A CONTROLLED LAB TEST"}},
  {id:"VA-LF-019",name:"Range Estimate vs Battery Health",durationFrames:240,values:{
    title:"A lower estimate is not permanent capacity loss",rangeStart:82,rangeEnd:58,
    healthReference:79,footer:"INDEX EXAMPLE ONLY — NOT REAL SOH, RANGE OR VEHICLE TELEMETRY"}},
  {id:"VA-LF-020",name:"Temporary Fluctuation vs Persistent Trend",durationFrames:240,values:{
    title:"Different patterns answer different questions",topLabel:"RANGE ESTIMATE",
    bottomLabel:"CAPACITY TREND",footer:"SCHEMATIC CURVES; NO INFERRED MEASURED DEGRADATION DATA"}}
];
export const stressCases=[
  {id:"VA-LF-015",name:"stress",durationFrames:240,values:{
    title:"Both cycling wear and time-dependent chemistry influence how a lithium-ion battery ages",
    cycleLabel:"USE-RELATED CYCLING",calendarLabel:"ELAPSED CALENDAR TIME",
    takeaway:"The calendar clock keeps ticking during low-mileage ownership.",
    footer:"Illustrative interpretation; no numeric wear rates or universal time constants"}},
  {id:"VA-LF-016",name:"stress",durationFrames:240,values:{
    title:"Electrode–electrolyte side reactions can continue under storage conditions",
    anodeLabel:"NEGATIVE ELECTRODE",cathodeLabel:"POSITIVE ELECTRODE",
    reactionLabel:"Passivation and slow side chemistry",
    footer:"Not a literal depiction of reaction stoichiometry; no measured cell currents"}},
  {id:"VA-LF-017",name:"stress",durationFrames:240,values:{
    title:"Qualitative combined temperature and state-of-charge exposure over time",
    xAxisLabel:"STORAGE STATE OF CHARGE",yAxisLabel:"AMBIENT TEMPERATURE",
    footer:"Schematic engineering direction only; actual chemistry and pack management vary"}},
  {id:"VA-LF-018",name:"stress",durationFrames:240,values:{
    title:"A real-world observational fleet finding needs context and limitations",
    vehicles:22000,models:21,difference:0.4,source:"GEOTAB REPORTED CLIMATE ASSOCIATION",
    footer:"The comparison reflects combined usage patterns; never isolate calendar aging from this graphic"}},
  {id:"VA-LF-019",name:"stress",durationFrames:240,values:{
    title:"Displayed driving-range estimate and capacity health reference answer different questions",
    rangeStart:93,rangeEnd:44,healthReference:78,
    footer:"Illustrative indexes only; not actual SoH percentages or instrument data"}},
  {id:"VA-LF-020",name:"stress",durationFrames:240,values:{
    title:"One cold-morning reading versus a repeatable long-term capacity reduction",
    topLabel:"DAY-TO-DAY RANGE VARIATION",bottomLabel:"LONG-TERM CAPACITY PATTERN",
    footer:"Uncalibrated conceptual time traces — no dates or measured rates"}}
];
