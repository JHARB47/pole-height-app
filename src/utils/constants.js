// Clearance targets at midspan by surface category
export const SURFACE_CATEGORIES = {
  pedestrian: { label: "Pedestrian-only area", commMin: 12, powerMin: 12 },
  residentialDrive: {
    label: "Residential driveway/yard",
    commMin: 15.5,
    powerMin: 16,
  },
  publicRoad: {
    label: "Public road (truck traffic)",
    commMin: 16,
    powerMin: 18,
  },
  railroad: {
    label: "Railroad crossing (CSX, etc.)",
    commMin: 23.5,
    powerMin: 25,
  },
};

// Vertical separation requirements
export const VERTICAL_SEPARATION = {
  powerToComm: 40 / 12,
  commToComm: 12 / 12,
};

// Minimum attachment heights
export const MIN_ATTACH_HEIGHTS = {
  primaryMin: 22,
  secondaryMin: 18,
  commMin: 15.5,
};

// Default sag percentages
export const SAG_DEFAULTS = {
  ADSS: 0.015,
  Coax: 0.02,
  Copper: 0.02,
  Triplex: 0.03,
};

// Suggested guy angle range
export const GUY_ANGLE_RANGE = { min: 30, max: 60 };

// Wood pole class capacity hints
export const POLE_CLASS_HINT_LBF = {
  "Class 1": 3800,
  "Class 2": 3000,
  "Class 3": 2400,
  "Class 4": 2000,
  "Class 5": 1600,
};

// FirstEnergy requirements
export const FE_REQUIRED = {
  proposal: [
    "Company Name",
    "Responsible Users",
    "State",
    "County",
    "City/Village/Township",
    "Location Description",
    "Proposal Number",
    "Project Summary",
    "Attachment Type",
    "Reason for Work",
    "FirstEnergy Contract Number",
    "Policy/Safety Acceptance",
    "Attaching Company Approval/Date",
    "Billing Address",
    "Primary Contact",
  ],
  poleProfileMeta: [
    "Pole Number",
    "Street Location",
    "Field Data Date",
    "Pole Data Collector",
    "Attachment Type",
    "Field Class",
    "Field Height",
    "Transformer (Y/N)",
    "Lamp (Y/N)",
    "Guy Required (Y/N)",
    "Conduit Riser (Y/N)",
    "First Down Guy (Y/N)",
    "Second Down Guy (Y/N)",
    "Pole-to-Pole Guy (Y/N)",
    "Sidewalk Guy (Y/N)",
    "Brace Pole (Y/N)",
    "Slack Span (Y/N)",
    "Span Length (ft) Before",
    "Span Length (ft) After",
    "Lowest Power Supply (checkbox)",
    "Lowest Power Side/Height/Midspan (Before/After)",
    "Existing Comms owners/side/height/midspan",
    "Proposed Side/Height/Midspan (worst case)",
    "Span Environment",
    "Make Ready Suggestions",
  ],
};

// West Virginia companies (seed list; not exhaustive)
export const WV_COMPANIES = {
  power: [
    {
      name: "Appalachian Power (AEP)",
      short: "Appalachian Power",
      parent: "AEP",
    },
    { name: "Wheeling Power (AEP)", short: "Wheeling Power", parent: "AEP" },
    {
      name: "Monongahela Power (Mon Power)",
      short: "Mon Power",
      parent: "FirstEnergy",
    },
    { name: "Potomac Edison", short: "Potomac Edison", parent: "FirstEnergy" },
    {
      name: "Harrison Rural Electrification Association (HREA)",
      short: "HREA",
      parent: "Cooperative",
    },
    {
      name: "Black Diamond Power Company",
      short: "Black Diamond Power",
      parent: "Investor-owned",
    },
    {
      name: "City of New Martinsville Electric",
      short: "New Martinsville Electric",
      parent: "Municipal",
    },
    {
      name: "City of Philippi Electric",
      short: "Philippi Electric",
      parent: "Municipal",
    },
  ],
  communication: [
    { name: "Frontier Communications", short: "Frontier" },
    { name: "Optimum (formerly Suddenlink)", short: "Optimum" },
    { name: "Armstrong", short: "Armstrong" },
    { name: "Citynet", short: "Citynet" },
    { name: "Lumen (CenturyLink/Level 3)", short: "Lumen" },
    { name: "Zayo", short: "Zayo" },
    { name: "Segra (Lumos Networks)", short: "Segra" },
    { name: "Comcast Xfinity", short: "Comcast" },
    { name: "Charter Spectrum", short: "Spectrum" },
    { name: "AT&T", short: "AT&T" },
    { name: "Verizon", short: "Verizon" },
    { name: "T-Mobile", short: "T-Mobile" },
  ],
};
