# Root Documentation Inventory

**Updated**: October 3, 2025

## Essential Documentation (Keep in Root)

### Project Core

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history and release notes
- `STATUS.md` - Current project status

### Setup & Configuration

- `NEON-SETUP.md` - Database setup guide
- `SECRETS-SETUP-TEMPLATE.md` - Environment secrets configuration
- `NETLIFY-SECRETS.md` - Netlify-specific secrets
- `NETLIFY-VISUAL-EDITOR-DEPLOYMENT-GUIDE.md` - Visual editor deployment

### Deployment & Operations

- `DEPLOYMENT.md` - General deployment documentation
- `DEPLOYMENT-COMPLETE-GUIDE.md` - Comprehensive deployment guide
- `INCIDENT-PLAYBOOK.md` - Operational incident response

### Security

- `SECURITY-INCIDENT-REPORT.md` - Security incident documentation

### Development

- `GIT-WORKFLOW.md` - Git workflow and branching strategy
- `WORKFLOW-ENHANCEMENT-SUMMARY.md` - Development workflow improvements

### Planning & Architecture

- `ENHANCEMENT-ROADMAP.md` - Future feature roadmap
- `PHASE-2-ENHANCEMENTS.md` - Phase 2 development plans
- `ENTERPRISE-IMPLEMENTATION.md` - Enterprise architecture
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `PRODUCTION-READINESS-ANALYSIS.md` - Production checklist
- `DEPENDENCY-MODERNIZATION.md` - Dependency upgrade strategy
- `UI_IMPROVEMENTS.md` - UI/UX improvements
- `VISUAL-EDITOR-GUIDE.md` - Visual editor usage

### Cleanup

- `CLEANUP-PLAN.md` - This cleanup operation plan

## Archived Documentation

See `docs/archive/2025-10/` for:

- Historical cleanup reports
- Point-in-time status reports
- Deprecated/obsolete documentation

## Recommendations

### Consider Consolidating

1. **Deployment docs** (2 files): Merge DEPLOYMENT.md and DEPLOYMENT-COMPLETE-GUIDE.md
2. **Visual editor docs** (2 files): Could merge VISUAL-EDITOR-GUIDE.md and NETLIFY-VISUAL-EDITOR-DEPLOYMENT-GUIDE.md
3. **Secrets docs** (2 files): Consider merging SECRETS-SETUP-TEMPLATE.md and NETLIFY-SECRETS.md

### Consider Moving to docs/

- IMPLEMENTATION_SUMMARY.md → docs/IMPLEMENTATION.md
- DEPENDENCY-MODERNIZATION.md → docs/DEPENDENCY-STRATEGY.md
- ENTERPRISE-IMPLEMENTATION.md → docs/enterprise/ARCHITECTURE.md

Total root MD files: 22 (down from 37)
Archived: 15 files
