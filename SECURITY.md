# Security Policy

## Supported Versions

We support the currently deployed production build and the active development branch. Older releases are not maintained. If you rely on an older tag, upgrade to the latest main before requesting fixes.

| Version / Branch | Supported |
| ---------------- | --------- |
| main (latest)    | ✅         |
| Previous tags    | ❌         |

## Reporting a Vulnerability

- **Preferred channel:** Open a private advisory via GitHub Security Advisories (Security → Report a vulnerability) for `JHARB47/pole-height-app`.
- **Do not open public issues or PRs** for vulnerabilities.
- **What to include:** impact, affected endpoints/flows, reproduction steps, logs or proof-of-concept, and any mitigation attempted. Avoid sending secrets or user data.
- **Acknowledgement:** We aim to acknowledge reports within **2 business days** and provide a remediation path or timeline within **7 business days** for valid, reproducible issues.
- **Out of scope:** Social engineering, physical attacks, self-XSS, use of previously compromised credentials, dependency vulnerabilities without a working exploit, and findings that require privileged Netlify/GitHub access not available to normal users.
- **Data handling:** Do not exfiltrate data. If sensitive data is encountered, stop testing and report immediately.

## Coordinated Disclosure

- Keep reports confidential until a fix is available or we jointly agree to disclose.
- We will request retesting after a patch and will publish fixes via the standard release process (Netlify deploy from `main`).
- Bounties are not offered at this time; responsible disclosure credit may be given at our discretion.

## Scope Notes (Tech Stack Awareness)

- Runtime: Node.js 22.20.0; frontend: React + Vite; hosting: Netlify with serverless functions; database: PostgreSQL (Neon). Issues specific to these components are in scope if they affect confidentiality, integrity, or availability of the application or its data.

## Legal

By reporting, you affirm that you comply with applicable law, test only in ways that avoid harming users or data, and cease testing upon request. Unauthorized access to data, service disruption, or data exfiltration is prohibited. This policy does not grant permission to perform actions that would otherwise be unlawful.
