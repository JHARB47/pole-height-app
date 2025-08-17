// Manifest of official permit resources by agency and environment.
// We only include URLs and guidance, not the templates themselves.

const permitTemplates = {
  agencies: {
    wvdot: {
      name: 'West Virginia Division of Highways (WVDOT)',
      environments: ['wvHighway'],
      resources: [
        {
          label: 'MM-109 Right of Way Entry Permit (PDF)',
          url: 'https://transportation.wv.gov/highways/right-of-way/Documents/Railroads%20%26%20Utils%202023/MM-109%20Right%20of%20Way%20Entry%20Permit%20Application.pdf',
          notes: 'Primary application for right-of-way entry; attach plans, traffic control, and calculations.'
        },
        {
          label: 'Alternate MM-109 link',
          url: 'https://transportation.wv.gov/highways/engineering/files/MM-109.pdf',
          notes: 'Alternate mirror link referenced by WV regulations.'
        }
      ],
      requirements: [
        'Completed MM-109 application with applicant and contact info',
        'Location details with GPS where available',
        'Plan/profile drawing showing ground clearance and midspan',
        'Traffic control plan (if work impacts traffic)',
        'Bond/deposit as required by district',
        'Proof of utility coordination as applicable'
      ]
    },
    penndot: {
      name: 'PennDOT (Pennsylvania Department of Transportation)',
      environments: ['paHighway'],
      resources: [
        {
          label: 'HOP ePermitting Portal',
          url: 'https://www.epermitting.penndot.gov/EPS/home/home.jsp',
          notes: 'Highway Occupancy Permit (HOP) applications are submitted online.'
        },
        {
          label: 'Form M-945A: Application for Highway Occupancy Permit (PDF)',
          url: 'https://www.pa.gov/content/dam/copapwp-pagov/en/penndot/documents/public/pubsforms/forms/m-945a.pdf',
          notes: 'Reference application document. Actual submission via ePermitting.'
        },
        {
          label: 'General HOP Guidance',
          url: 'https://www.pa.gov/services/penndot/apply-for-a-penndot-highway-occupancy-permit.html',
          notes: 'Overview of HOP process and forms.'
        }
      ],
      requirements: [
        'Online application via HOP ePermitting',
        'Location plan and traffic control (if applicable)',
        'Utility coordination and restoration details',
        'Clearance calculations and drawings for overhead crossings'
      ]
    },
    odot: {
      name: 'Ohio Department of Transportation (ODOT)',
      environments: ['ohHighway'],
      resources: [
        {
          label: 'ODOT Permits (Utility)',
          url: 'https://www.transportation.ohio.gov/wps/portal/gov/odot/programs/utility',
          notes: 'Utility accommodation and permitting resources for state routes.'
        }
      ],
      requirements: [
        'Utility permit application through ODOT district',
        'Plans showing location, clearances, and traffic control',
        'Compliance with utility accommodation policy'
      ]
    },
    mdot: {
      name: 'Maryland DOT State Highway Administration (MDOT SHA)',
      environments: ['mdHighway'],
      resources: [
        {
          label: 'MDOT SHA Utility Permits',
          url: 'https://www.roads.maryland.gov/Pages/default.aspx?PageId=775',
          notes: 'Utility permit information and contacts for state highways.'
        }
      ],
      requirements: [
        'Utility permit application with location plans',
        'Clearance/encroachment drawings and traffic control where needed',
        'District coordination and conditions'
      ]
    },
    csx: {
      name: 'CSX Transportation (Railroad)',
      environments: ['railroad'],
      resources: [
        {
          label: 'CSX Property Portal – Utility Permits',
          url: 'https://www.csx.com/index.cfm/customers/value-added-services/property-real-estate/permitting-utility-wireless-infrastructure-installations-and-rights-of-entry/utility-permits/',
          notes: 'Submit applications online; see fees and processing info.'
        },
        {
          label: 'Application for Facility/Utility Installations (sample PDF)',
          url: 'https://www.csx.com/index.cfm/library/files/customers/property-real-estate/permitting/utility-permits/facility-encroachment-application/',
          notes: 'Reference form; current process uses CSX Property Portal.'
        }
      ],
      requirements: [
        'Online application via CSX Property Portal',
        'Plan/profile drawings with vertical and horizontal clearances',
        'Insurance and fee payment per CSX requirements'
      ]
    }
  }
};

export function getTemplatesForEnvironment(env) {
  const out = [];
  const { agencies } = permitTemplates;
  for (const key of Object.keys(agencies)) {
    const a = agencies[key];
    if ((a.environments || []).includes(env)) out.push({ key, ...a });
  }
  return out;
}

export default permitTemplates;
