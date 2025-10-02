# PolePlan Pro - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Authentication](#user-authentication)
3. [Managing Your Data](#managing-your-data)
4. [GIS/GPS Validation](#gisgps-validation)
5. [CSV Export Customization](#csv-export-customization)
6. [Multi-Tenant Features](#multi-tenant-features)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

PolePlan Pro is a comprehensive pole attachment calculation and permit management tool designed for utility engineers and field technicians. This guide will help you understand the key features and how to use them effectively.

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Active user account (contact your administrator for access)
- Basic understanding of utility pole attachments and NESC standards

---

## User Authentication

### Creating an Account

1. **Registration**
   - Navigate to the registration page
   - Provide required information:
     - Email address
     - Password (minimum 8 characters)
     - First and last name
     - Organization code (provided by your administrator)
   - Click "Register" to create your account

2. **Email Verification**
   - Check your email for a verification link
   - Click the link to verify your account
   - You can now log in with your credentials

### Logging In

#### Standard Login
1. Navigate to the login page
2. Enter your email and password
3. Click "Log In"
4. You'll be redirected to the dashboard

#### Single Sign-On (SSO)
PolePlan Pro supports SSO through:
- **Azure Active Directory**: For enterprise Microsoft users
- **Google Workspace**: For Google-based organizations
- **SAML**: For custom identity providers

To use SSO:
1. Click the appropriate SSO button on the login page
2. You'll be redirected to your identity provider
3. Complete authentication with your organization's credentials
4. You'll be redirected back to PolePlan Pro

### Managing Your Profile

Access your profile settings by clicking your name in the top-right corner:

- **Profile Information**: Update your name, email, and phone
- **Password**: Change your password
- **Preferences**: Set your timezone and default units
- **API Keys**: Generate API keys for integrations (if enabled)

---

## Managing Your Data

### User-Specific Data

All data you create in PolePlan Pro is **user-specific** by default. This means:

- ✅ Only you can see and edit your projects
- ✅ Your data is isolated from other users
- ✅ You can share specific projects with team members

### Projects

#### Creating a Project
1. Click "New Project" on the dashboard
2. Enter project details:
   - **Project Name**: Descriptive name for the project
   - **Description**: Optional detailed description
   - **Location**: Primary location (address or coordinates)
   - **Tags**: Organize with custom tags
3. Click "Create Project"

#### Project Organization
- **Status**: Mark projects as Active, Draft, or Archived
- **Tags**: Add tags for easy filtering (e.g., "permit-ready", "field-survey")
- **Search**: Quickly find projects by name, tag, or location

#### Sharing Projects
To share a project with team members:
1. Open the project
2. Click "Share" in the project menu
3. Enter email addresses of team members
4. Set permissions:
   - **View Only**: Can see data but not edit
   - **Edit**: Can modify project data
   - **Admin**: Can edit and share with others
5. Click "Share"

### Data Export

You can export your data in multiple formats:
- **CSV**: Spreadsheet format for analysis
- **GeoJSON**: Geographic data for GIS tools
- **KML**: For viewing in Google Earth
- **Shapefile**: For professional GIS applications
- **PDF**: Permit-ready reports

---

## GIS/GPS Validation

PolePlan Pro includes comprehensive GPS coordinate validation to ensure data accuracy.

### Coordinate Entry

When entering pole coordinates:

1. **Latitude** must be between -90° and 90°
2. **Longitude** must be between -180° and 180°
3. Coordinates use the **WGS84** datum (standard GPS format)

### Validation Feedback

#### Valid Coordinates
✅ Green checkmark indicates valid coordinates
- Coordinates are within valid ranges
- Data can be exported and used in calculations

#### Invalid Coordinates
❌ Red error message with specific issue:
- **Out of Range**: "Latitude must be between -90 and 90 degrees"
- **Invalid Format**: "Longitude must be a valid number"
- **Missing Data**: "Latitude provided without longitude"

#### Warnings
⚠️ Yellow warning for potential issues:
- **Null Island**: Coordinates at [0, 0] are flagged as likely errors
- **Large Distance**: Spans with unusually large distances between poles
- **Missing Data**: Poles without coordinates (calculations will be limited)

### Best Practices

1. **Use Decimal Degrees**
   ```
   ✅ Good: 45.5231, -122.6765
   ❌ Avoid: 45° 31' 23" N, 122° 40' 35" W
   ```

2. **Double-Check Coordinates**
   - View poles on the map to verify locations
   - Check that coordinates match expected geography
   - Verify coordinate order (latitude first, then longitude)

3. **Import from GPS Devices**
   - Use CSV import for bulk coordinate entry
   - Supported GPS formats: Garmin, Trimble, ikeGPS, Katapult Pro
   - The system will automatically validate all imported coordinates

### Error Resolution

#### "Invalid Latitude/Longitude"
- Check that values are numeric
- Verify latitude is between -90 and 90
- Verify longitude is between -180 and 180
- Remove any non-numeric characters (except decimal point and minus sign)

#### "Latitude Without Longitude"
- Both coordinates must be provided together
- If you only have one coordinate, leave both fields blank
- You can add coordinates later after field verification

#### "Coordinates at [0, 0]"
- This warning indicates likely incorrect data
- Re-check your GPS device or data source
- Update coordinates with correct values

---

## CSV Export Customization

PolePlan Pro offers flexible CSV export options to match your workflow and regulatory requirements.

### Opening the Export Dialog

1. Select poles or spans you want to export
2. Click "Export" button
3. Select "CSV" from the format options
4. The CSV Customization Dialog opens

### Regulatory Framework Selection

Choose the appropriate framework for your region:

#### NESC (National Electrical Safety Code)
- Standard for United States
- Includes required clearances and safety factors
- Default for most US utilities

#### CSA (Canadian Standards Association)
- Standard for Canada
- Includes province-specific requirements
- Additional fields for Canadian regulations

#### IEC (International Electrotechnical Commission)
- International standard
- Used in many countries worldwide
- Flexible for global projects

#### Custom Framework
- Define your own requirements
- Select any fields you need
- No mandatory fields enforced

### Using Export Presets

Quick-start templates for common scenarios:

#### Basic Export
- **Fields**: Pole ID, Height, Class, Coordinates
- **Use Case**: Simple pole inventory
- **Size**: Minimal file size

#### Complete Export
- **Fields**: All available data
- **Use Case**: Comprehensive data backup
- **Size**: Largest file, all details included

#### Permit Application
- **Fields**: All data required for permit submission
- **Use Case**: Submitting to utility for approval
- **Size**: Medium, includes compliance data

#### Field Survey
- **Fields**: Data collection fields with timestamp and inspector
- **Use Case**: Field data collection and verification
- **Size**: Medium, includes metadata

### Column Selection

Columns are organized by category:

#### Basic Information
- Pole ID, Height, Class
- Fundamental pole data

#### Location
- Latitude, Longitude, Address
- Geographic information

#### Electrical
- Voltage, Power Height, Transformer Status
- Power system data

#### Clearances
- Ground, Road, Power-to-Comm
- NESC compliance measurements

#### Attachment
- Attachment Height, Type
- Communication equipment data

#### Span Data
- Span Distance, Adjacent Pole Height
- Span calculations and measurements

#### Compliance
- Compliance Status, Permit Status
- Regulatory approval tracking

#### Metadata
- Timestamp, Inspector, Notes
- Data collection information

### Selecting Columns

1. **Select All in Category**: Toggle all columns in a category on/off
2. **Individual Selection**: Check/uncheck specific columns
3. **Required Fields**: Framework-required fields are highlighted

### Format Options

#### Tick Mark Format
- **Enabled**: Heights displayed as `15' 6"`
- **Disabled**: Heights displayed as `15ft 6in`
- Choose based on your utility's preference

### Validation

Before export, the dialog validates your selections:

✅ **Valid**: All required fields included, ready to export
❌ **Invalid**: Missing required fields for selected framework

**Example Error:**
```
Missing required fields for NESC: powerHeight, voltage
```

### Exporting

1. Configure your preferences
2. Click "Export CSV"
3. File downloads to your browser's download folder
4. Filename format: `poles_export_YYYY-MM-DD.csv`

---

## Multi-Tenant Features

For organizations using PolePlan Pro with multiple clients or projects.

### Organization Context

Your organization account provides:
- **Shared User Directory**: Team members in your organization
- **Subscription Tier**: Features available to your organization
- **Billing**: Centralized billing for all users

### Client Partitioning (Optional)

If your organization serves multiple clients:

1. **Client Selection**
   - Switch between clients using the client selector
   - Data is filtered to show only the selected client's projects

2. **Client-Specific Data**
   - Projects tagged with client ID
   - Reports generated with client branding
   - Separate permit submissions per client

3. **Cross-Client Features**
   - Admins can view all client data
   - Generate consolidated reports across clients
   - Manage user access per client

### User Roles

#### User (Basic)
- Create and edit own projects
- View shared projects
- Export data

#### Engineer
- All User permissions
- Share projects with others
- Generate permits
- Access advanced calculations

#### Admin
- All Engineer permissions
- Manage organization users
- Configure client settings
- View audit logs
- Access all projects

#### Super Admin
- All Admin permissions
- System-wide configuration
- Multi-organization access (support staff only)

---

## Troubleshooting

### Login Issues

**Problem**: Can't log in
- ✅ Verify email and password are correct
- ✅ Check that your account is activated
- ✅ Try password reset if needed
- ✅ Contact your administrator if account is locked

**Problem**: SSO not working
- ✅ Verify you're using the correct SSO provider
- ✅ Check with IT that SSO is configured
- ✅ Try clearing browser cache and cookies
- ✅ Use regular login as fallback

### Data Issues

**Problem**: Can't see my projects
- ✅ Check that you're logged in as the correct user
- ✅ Verify no filters are applied
- ✅ Check project status (archived projects hidden by default)
- ✅ Contact support if projects are missing

**Problem**: Coordinates not saving
- ✅ Verify coordinates are valid (see GIS Validation section)
- ✅ Check browser console for errors
- ✅ Try refreshing the page
- ✅ Clear localStorage and re-enter data

### Export Issues

**Problem**: CSV export fails
- ✅ Verify you have selected valid data to export
- ✅ Check that all required columns are selected
- ✅ Try a different regulatory framework
- ✅ Export smaller batches if dataset is large

**Problem**: Exported data incorrect
- ✅ Review column selection in export dialog
- ✅ Check format options (tick marks vs. standard)
- ✅ Verify source data is correct
- ✅ Try "Complete Export" preset to see all fields

### GIS Validation Issues

**Problem**: Valid coordinates marked as invalid
- ✅ Check coordinate format (decimal degrees required)
- ✅ Verify latitude/longitude order
- ✅ Ensure no special characters in coordinates
- ✅ Copy-paste coordinates exactly as provided

**Problem**: Map not showing poles
- ✅ Verify coordinates are entered
- ✅ Check that coordinates are valid
- ✅ Zoom out to see if poles are outside view
- ✅ Refresh the map layer

### Performance Issues

**Problem**: Slow loading
- ✅ Check internet connection
- ✅ Try a different browser
- ✅ Clear browser cache
- ✅ Archive old projects to reduce data load

---

## Getting Help

### Support Resources

- **Documentation**: This guide and technical documentation
- **Video Tutorials**: Available at [help.poleplanpro.com](https://poleplanpro.com)
- **Email Support**: support@poleplanpro.com
- **Phone Support**: Available for Enterprise customers

### Reporting Issues

When reporting issues, please include:
1. Detailed description of the problem
2. Steps to reproduce
3. Screenshots if applicable
4. Browser and operating system information
5. Any error messages displayed

---

## Keyboard Shortcuts

- **Ctrl/Cmd + S**: Save current project
- **Ctrl/Cmd + E**: Open export dialog
- **Ctrl/Cmd + N**: New project
- **Ctrl/Cmd + F**: Search projects
- **Esc**: Close dialogs

---

## Best Practices

### Data Entry
1. Enter coordinates first before other pole data
2. Use consistent units throughout a project
3. Add notes for unusual configurations
4. Save frequently (auto-save every 5 minutes)

### Project Organization
1. Use descriptive project names
2. Tag projects consistently
3. Archive completed projects
4. Share projects with team early

### Quality Control
1. Review GIS validation warnings
2. Verify calculated clearances
3. Cross-check with field data
4. Have a second engineer review permits

---

**Version**: 1.0.0  
**Last Updated**: October 1, 2025  
**© 2025 PolePlan Pro. All rights reserved.**
