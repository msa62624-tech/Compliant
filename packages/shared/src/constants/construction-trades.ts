/**
 * Comprehensive list of construction trades and specialties
 * Used for contractor classification, insurance program requirements, and project assignments
 */

export const CONSTRUCTION_TRADES = {
  // General Construction
  GENERAL_CONTRACTOR: "General Contractor",
  CONSTRUCTION_MANAGER: "Construction Manager",
  PROJECT_MANAGER: "Project Manager",

  // Site Work & Earthwork
  SITE_WORK: "Site Work",
  EXCAVATION: "Excavation & Grading",
  DEMOLITION: "Demolition",
  LAND_CLEARING: "Land Clearing",
  EARTHWORK: "Earthwork",
  PILE_DRIVING: "Pile Driving",
  CAISSON_DRILLING: "Caisson Drilling",
  BLASTING: "Blasting",
  DEWATERING: "Dewatering",
  SHORING: "Shoring & Underpinning",

  // Concrete & Masonry
  CONCRETE_FORMING: "Concrete Forming",
  CONCRETE_PLACEMENT: "Concrete Placement & Finishing",
  CONCRETE_PUMPING: "Concrete Pumping",
  PRECAST_CONCRETE: "Precast Concrete",
  POST_TENSIONING: "Post-Tensioning",
  MASONRY: "Masonry",
  BRICK_LAYING: "Brick Laying",
  STONE_WORK: "Stone Work",
  TILE_SETTING: "Tile & Stone Setting",
  TERRAZZO: "Terrazzo",

  // Structural
  STRUCTURAL_STEEL: "Structural Steel Erection",
  STEEL_FABRICATION: "Steel Fabrication",
  REINFORCING_STEEL: "Reinforcing Steel (Rebar)",
  METAL_DECKING: "Metal Decking",
  ORNAMENTAL_METALS: "Ornamental Metals & Railings",
  MISCELLANEOUS_METALS: "Miscellaneous Metals",

  // Exterior Envelope
  WATERPROOFING: "Waterproofing",
  DAMPPROOFING: "Dampproofing",
  CAULKING: "Caulking & Sealants",
  ROOFING: "Roofing",
  ROOFING_MEMBRANE: "Roofing Membrane",
  ROOFING_METAL: "Metal Roofing",
  ROOFING_SHINGLE: "Shingle Roofing",
  SIDING: "Siding",
  EXTERIOR_INSULATION: "Exterior Insulation & Finish Systems (EIFS)",
  BUILDING_ENVELOPE: "Building Envelope Consultant",

  // Windows, Doors & Glass
  WINDOW_INSTALLATION: "Window Installation",
  CURTAIN_WALL: "Curtain Wall",
  STOREFRONT: "Storefront Systems",
  GLAZING: "Glazing",
  DOOR_INSTALLATION: "Door Installation",
  OVERHEAD_DOORS: "Overhead Doors & Loading Docks",
  AUTOMATIC_DOORS: "Automatic Door Systems",
  HARDWARE: "Door Hardware & Access Control",

  // Finishes - Interior
  DRYWALL: "Drywall & Gypsum Board",
  PLASTERING: "Plastering & Stucco",
  PAINTING: "Painting & Coating",
  WALLCOVERING: "Wallcovering",
  FLOORING: "Flooring",
  CARPET_INSTALLATION: "Carpet Installation",
  HARDWOOD_FLOORING: "Hardwood Flooring",
  RESILIENT_FLOORING: "Resilient Flooring (Vinyl, Rubber)",
  EPOXY_FLOORING: "Epoxy & Resinous Flooring",
  POLISHED_CONCRETE: "Polished Concrete",
  CERAMIC_TILE: "Ceramic Tile Installation",
  ACOUSTICAL_CEILINGS: "Acoustical Ceilings",
  SUSPENDED_CEILINGS: "Suspended Ceiling Systems",
  SPECIALTY_CEILINGS: "Specialty Ceilings",

  // Carpentry & Millwork
  ROUGH_CARPENTRY: "Rough Carpentry",
  FINISH_CARPENTRY: "Finish Carpentry",
  ARCHITECTURAL_MILLWORK: "Architectural Millwork",
  CASEWORK: "Casework & Cabinetry",
  CUSTOM_WOODWORK: "Custom Woodwork",
  WOOD_FRAMING: "Wood Framing",
  MASS_TIMBER: "Mass Timber Construction",

  // Specialties
  SIGNAGE: "Signage",
  LOCKERS: "Lockers & Shelving",
  PARTITIONS: "Toilet & Shower Partitions",
  WALL_PROTECTION: "Wall Protection Systems",
  CORNER_GUARDS: "Corner Guards & Bumpers",
  LOUVERS: "Louvers & Vents",
  FLAGPOLES: "Flagpoles",
  IDENTIFYING_DEVICES: "Identifying Devices",
  PEDESTRIAN_CONTROL: "Pedestrian Control Devices",

  // Equipment
  COMMERCIAL_EQUIPMENT: "Commercial Equipment",
  KITCHEN_EQUIPMENT: "Kitchen Equipment",
  LABORATORY_EQUIPMENT: "Laboratory Equipment",
  HEALTHCARE_EQUIPMENT: "Healthcare Equipment",
  LAUNDRY_EQUIPMENT: "Laundry Equipment",
  PARKING_EQUIPMENT: "Parking Control Equipment",
  LOADING_DOCK_EQUIPMENT: "Loading Dock Equipment",
  WASTE_HANDLING: "Waste Handling Equipment",

  // Furnishings
  FURNITURE: "Furniture & Fixtures",
  WINDOW_TREATMENTS: "Window Treatments",
  ARTWORK: "Artwork & Accessories",
  INTERIOR_PLANTS: "Interior Plants & Planters",

  // Fire Protection
  FIRE_SUPPRESSION: "Fire Suppression Systems",
  FIRE_SPRINKLERS: "Fire Sprinkler Systems",
  FIRE_ALARM: "Fire Alarm Systems",
  FIRE_EXTINGUISHERS: "Fire Extinguishers",
  FIRE_STOPPING: "Fire Stopping & Smoke Sealing",
  KITCHEN_FIRE_SUPPRESSION: "Kitchen Fire Suppression",

  // Plumbing
  PLUMBING: "Plumbing",
  PLUMBING_FIXTURES: "Plumbing Fixtures",
  PIPE_INSULATION: "Pipe Insulation",
  WATER_TREATMENT: "Water Treatment Systems",
  FUEL_SYSTEMS: "Fuel Systems",
  NATURAL_GAS: "Natural Gas Piping",
  MEDICAL_GAS: "Medical Gas Systems",
  PROCESS_PIPING: "Process Piping",
  BACKFLOW_PREVENTION: "Backflow Prevention",

  // HVAC (Heating, Ventilation, Air Conditioning)
  HVAC: "HVAC",
  MECHANICAL: "Mechanical Systems",
  SHEET_METAL: "Sheet Metal",
  DUCTWORK: "Ductwork & Duct Insulation",
  AIR_CONDITIONING: "Air Conditioning",
  HEATING: "Heating Systems",
  VENTILATION: "Ventilation Systems",
  REFRIGERATION: "Refrigeration",
  BOILERS: "Boilers",
  CHILLERS: "Chillers",
  COOLING_TOWERS: "Cooling Towers",
  AIR_HANDLING: "Air Handling Units",
  HVAC_CONTROLS: "HVAC Control Systems",
  ENERGY_RECOVERY: "Energy Recovery Systems",

  // Electrical
  ELECTRICAL: "Electrical",
  ELECTRICAL_POWER: "Electrical Power Distribution",
  LIGHTING: "Lighting & Lighting Controls",
  EMERGENCY_POWER: "Emergency Power Systems",
  GENERATORS: "Generator Installation",
  UPS_SYSTEMS: "UPS & Power Conditioning",
  SOLAR_PANELS: "Solar Panel Installation",
  ELECTRICAL_TESTING: "Electrical Testing & Commissioning",
  GROUNDING: "Grounding & Lightning Protection",
  CABLE_TRAY: "Cable Tray & Conduit",

  // Low Voltage & Communications
  FIRE_ALARM_LOW_VOLTAGE: "Fire Alarm (Low Voltage)",
  SECURITY_SYSTEMS: "Security & Access Control Systems",
  CCTV: "CCTV & Surveillance",
  AUDIO_VISUAL: "Audio Visual Systems",
  TELECOMMUNICATIONS: "Telecommunications",
  DATA_CABLING: "Data & Voice Cabling",
  STRUCTURED_CABLING: "Structured Cabling Systems",
  NURSE_CALL: "Nurse Call Systems",
  SOUND_SYSTEMS: "Sound & Public Address Systems",
  BUILDING_AUTOMATION: "Building Automation Systems (BAS)",
  INTERCOM: "Intercom Systems",
  CLOCK_SYSTEMS: "Clock & Program Systems",

  // Conveying Systems
  ELEVATORS: "Elevators",
  ESCALATORS: "Escalators",
  MOVING_WALKS: "Moving Walks",
  LIFTS: "Wheelchair Lifts & Platform Lifts",
  MATERIAL_HANDLING: "Material Handling Systems",
  CONVEYORS: "Conveyors",
  HOISTS: "Hoists & Cranes",
  DUMBWAITERS: "Dumbwaiters",

  // Site Improvements
  LANDSCAPING: "Landscaping",
  IRRIGATION: "Irrigation Systems",
  SITE_UTILITIES: "Site Utilities",
  PAVING: "Paving & Surfacing",
  ASPHALT: "Asphalt Paving",
  CONCRETE_PAVING: "Concrete Paving",
  STRIPING: "Pavement Marking & Striping",
  FENCING: "Fencing & Gates",
  RETAINING_WALLS: "Retaining Walls",
  SITE_LIGHTING: "Site Lighting",
  SITE_FURNISHINGS: "Site Furnishings",
  PLAYGROUND_EQUIPMENT: "Playground Equipment",
  ATHLETIC_FIELDS: "Athletic Fields & Courts",

  // Utilities
  WATER_DISTRIBUTION: "Water Distribution",
  SANITARY_SEWER: "Sanitary Sewer",
  STORM_DRAINAGE: "Storm Drainage",
  ELECTRICAL_UTILITIES: "Electrical Utilities",
  GAS_UTILITIES: "Gas Distribution Utilities",
  TELECOMMUNICATIONS_UTILITIES: "Telecommunications Utilities",

  // Environmental & Remediation
  ASBESTOS_ABATEMENT: "Asbestos Abatement",
  LEAD_ABATEMENT: "Lead Paint Abatement",
  MOLD_REMEDIATION: "Mold Remediation",
  HAZMAT: "Hazardous Materials Removal",
  ENVIRONMENTAL_REMEDIATION: "Environmental Remediation",
  RADON_MITIGATION: "Radon Mitigation",

  // Specialized Systems
  CLEAN_ROOM: "Clean Room Construction",
  INDUSTRIAL_PROCESS: "Industrial Process Systems",
  FOOD_SERVICE: "Food Service Systems",
  POOLS: "Pool & Spa Systems",
  FOUNTAINS: "Fountains & Water Features",
  AQUARIUMS: "Aquariums",
  THEATERS: "Theater & Stage Equipment",
  SHOOTING_RANGES: "Shooting Range Systems",
  BOWLING_ALLEYS: "Bowling Alley Equipment",

  // Testing & Inspection
  TESTING: "Testing & Inspection",
  BALANCING: "Testing, Adjusting & Balancing (TAB)",
  COMMISSIONING: "Building Commissioning",
  SPECIAL_INSPECTION: "Special Inspection",
  GEOTECHNICAL: "Geotechnical Engineering",
  STRUCTURAL_OBSERVATION: "Structural Observation",

  // Restoration & Preservation
  HISTORIC_RESTORATION: "Historic Restoration",
  BUILDING_RESTORATION: "Building Restoration",
  FACADE_RESTORATION: "Facade Restoration & Cleaning",
  MASONRY_RESTORATION: "Masonry Restoration",

  // Temporary Facilities
  TEMPORARY_FACILITIES: "Temporary Facilities",
  SCAFFOLDING: "Scaffolding",
  TEMPORARY_POWER: "Temporary Power & Lighting",
  TEMPORARY_PROTECTION: "Temporary Protection",
  BARRICADES: "Barricades & Enclosures",
  TEMPORARY_HVAC: "Temporary HVAC",

  // Rigging & Hoisting
  RIGGING: "Rigging",
  CRANE_SERVICES: "Crane Services",
  HEAVY_HAULING: "Heavy Hauling",

  // Other Specialties
  SURVEYING: "Surveying",
  LAYOUT: "Construction Layout",
  CUTTING_CORING: "Concrete Cutting & Coring",
  BUILDING_WRAP: "Building Wrap & Housewrap",
  INSULATION: "Insulation (Thermal & Acoustical)",
  JOINT_SEALANTS: "Joint Sealants",
  EXPANSION_JOINTS: "Expansion Joint Systems",
  ACCESS_FLOORING: "Access Flooring",
  PARKING_STRUCTURES: "Parking Structure Restoration",
  BRIDGE_WORK: "Bridge Construction & Repair",
  TUNNEL_WORK: "Tunnel Construction",
  MARINE_WORK: "Marine Construction",
  UNDERWATER_CONSTRUCTION: "Underwater Construction",
  INDUSTRIAL_COATINGS: "Industrial Coatings & Linings",
  PROTECTIVE_COATINGS: "Protective Coatings",
  FIREPROOFING: "Fireproofing",
  RADIATION_PROTECTION: "Radiation Protection",
  SOUND_ISOLATION: "Sound Isolation & Vibration Control",
  AUDIO_ACOUSTICS: "Audio Acoustics",

  // Renewable Energy
  SOLAR_PHOTOVOLTAIC: "Solar Photovoltaic Systems",
  WIND_TURBINES: "Wind Turbines",
  GEOTHERMAL: "Geothermal Systems",

  // Technology & Smart Building
  BUILDING_INFORMATION_MODELING: "Building Information Modeling (BIM)",
  SMART_BUILDING: "Smart Building Systems",
  IoT_SYSTEMS: "IoT Building Systems",
  ENERGY_MANAGEMENT: "Energy Management Systems",

  // Maintenance & Operations
  FACILITY_MAINTENANCE: "Facility Maintenance",
  JANITORIAL: "Janitorial Services",
  PEST_CONTROL: "Pest Control",
  SNOW_REMOVAL: "Snow Removal",

  // Miscellaneous
  GENERAL_TRADES: "General Trades",
  SPECIALTY_CONTRACTOR: "Specialty Contractor",
  VENDOR: "Vendor/Supplier",
  CONSULTANT: "Consultant",
  ARCHITECT: "Architect",
  ENGINEER: "Engineer",
  LANDSCAPE_ARCHITECT: "Landscape Architect",
} as const;

// Type for construction trade values
export type ConstructionTrade =
  (typeof CONSTRUCTION_TRADES)[keyof typeof CONSTRUCTION_TRADES];

// Array of all trades for dropdowns and selections
export const CONSTRUCTION_TRADES_ARRAY =
  Object.values(CONSTRUCTION_TRADES).sort();

// Categorized trades for better organization
export const CONSTRUCTION_TRADE_CATEGORIES = {
  "General Construction": [
    CONSTRUCTION_TRADES.GENERAL_CONTRACTOR,
    CONSTRUCTION_TRADES.CONSTRUCTION_MANAGER,
    CONSTRUCTION_TRADES.PROJECT_MANAGER,
  ],

  "Site Work & Earthwork": [
    CONSTRUCTION_TRADES.SITE_WORK,
    CONSTRUCTION_TRADES.EXCAVATION,
    CONSTRUCTION_TRADES.DEMOLITION,
    CONSTRUCTION_TRADES.LAND_CLEARING,
    CONSTRUCTION_TRADES.EARTHWORK,
    CONSTRUCTION_TRADES.PILE_DRIVING,
    CONSTRUCTION_TRADES.CAISSON_DRILLING,
    CONSTRUCTION_TRADES.BLASTING,
    CONSTRUCTION_TRADES.DEWATERING,
    CONSTRUCTION_TRADES.SHORING,
  ],

  "Concrete & Masonry": [
    CONSTRUCTION_TRADES.CONCRETE_FORMING,
    CONSTRUCTION_TRADES.CONCRETE_PLACEMENT,
    CONSTRUCTION_TRADES.CONCRETE_PUMPING,
    CONSTRUCTION_TRADES.PRECAST_CONCRETE,
    CONSTRUCTION_TRADES.POST_TENSIONING,
    CONSTRUCTION_TRADES.MASONRY,
    CONSTRUCTION_TRADES.BRICK_LAYING,
    CONSTRUCTION_TRADES.STONE_WORK,
    CONSTRUCTION_TRADES.TILE_SETTING,
    CONSTRUCTION_TRADES.TERRAZZO,
  ],

  Structural: [
    CONSTRUCTION_TRADES.STRUCTURAL_STEEL,
    CONSTRUCTION_TRADES.STEEL_FABRICATION,
    CONSTRUCTION_TRADES.REINFORCING_STEEL,
    CONSTRUCTION_TRADES.METAL_DECKING,
    CONSTRUCTION_TRADES.ORNAMENTAL_METALS,
    CONSTRUCTION_TRADES.MISCELLANEOUS_METALS,
  ],

  "MEP (Mechanical, Electrical, Plumbing)": [
    CONSTRUCTION_TRADES.PLUMBING,
    CONSTRUCTION_TRADES.HVAC,
    CONSTRUCTION_TRADES.ELECTRICAL,
    CONSTRUCTION_TRADES.FIRE_SUPPRESSION,
    CONSTRUCTION_TRADES.FIRE_ALARM,
  ],

  Finishes: [
    CONSTRUCTION_TRADES.DRYWALL,
    CONSTRUCTION_TRADES.PAINTING,
    CONSTRUCTION_TRADES.FLOORING,
    CONSTRUCTION_TRADES.CERAMIC_TILE,
    CONSTRUCTION_TRADES.ACOUSTICAL_CEILINGS,
    CONSTRUCTION_TRADES.FINISH_CARPENTRY,
  ],

  "Specialties & Equipment": [
    CONSTRUCTION_TRADES.ELEVATORS,
    CONSTRUCTION_TRADES.SECURITY_SYSTEMS,
    CONSTRUCTION_TRADES.AUDIO_VISUAL,
    CONSTRUCTION_TRADES.KITCHEN_EQUIPMENT,
    CONSTRUCTION_TRADES.SIGNAGE,
  ],
};

// Trade-specific insurance requirements (can be customized per trade)
export const TRADE_INSURANCE_REQUIREMENTS = {
  [CONSTRUCTION_TRADES.GENERAL_CONTRACTOR]: {
    glMinimum: 2000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 5000000,
  },
  [CONSTRUCTION_TRADES.ROOFING]: {
    glMinimum: 2000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 2000000,
  },
  [CONSTRUCTION_TRADES.ELECTRICAL]: {
    glMinimum: 2000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 2000000,
  },
  [CONSTRUCTION_TRADES.PLUMBING]: {
    glMinimum: 2000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 2000000,
  },
  [CONSTRUCTION_TRADES.HVAC]: {
    glMinimum: 2000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 2000000,
  },
  // Default for all other trades
  DEFAULT: {
    glMinimum: 1000000,
    wcMinimum: 1000000,
    autoMinimum: 1000000,
    umbrellaMinimum: 2000000,
  },
};

// Helper function to get insurance requirements for a trade
export function getTradeInsuranceRequirements(trade: string) {
  return (
    (TRADE_INSURANCE_REQUIREMENTS as any)[trade] ||
    TRADE_INSURANCE_REQUIREMENTS.DEFAULT
  );
}

// Helper function to search trades
export function searchTrades(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return CONSTRUCTION_TRADES_ARRAY.filter((trade) =>
    trade.toLowerCase().includes(lowerQuery),
  );
}

// Helper function to get category for a trade
export function getTradeCategoryName(trade: string): string | null {
  for (const [category, trades] of Object.entries(
    CONSTRUCTION_TRADE_CATEGORIES,
  )) {
    if ((trades as string[]).includes(trade)) {
      return category;
    }
  }
  return null;
}
