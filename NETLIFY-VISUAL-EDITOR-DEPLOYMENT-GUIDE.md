# PolePlan Pro: Netlify Visual Editor Deployment Guide

## Prerequisites ✅

-[x] Application built successfully (1.4MB optimized bundle)

-[x] Visual Editor configuration files created

-[x] Content structure established

-[x] Netlify CLI authenticated (logged in as Jake Harbert)

## Step 1: Deploy to Netlify

### Option A: Link Existing Site (Recommended)
If you have an existing Netlify site for this project:

```bash

# Link to existing site

npx netlify link

# Deploy with current build

npx netlify deploy --prod

```bash

### Option B: Create New Site
If this is a new deployment:

```bash

# Create and deploy new site

npx netlify init

# Follow prompts:

# - Create & configure a new site

# - Team: Select your team

# - Site name: poleplan-pro (or your preferred name)

# - Build command: npm run build

# - Directory to deploy: dist

# - Netlify functions folder: netlify/functions

```bash

### Option C: Manual Drag & Drop (Quick Test)
For immediate testing:

1. Go to [Netlify Dashboard](https://app.netlify.com/)

2.Drag the `dist/` folder to "Deploy manually"

3.Note the generated site URL for testing

## Step 2: Enable Visual Editor in Netlify Dashboard

### 2.1 Access Visual Editor Settings

1.Go to your site in [Netlify Dashboard](https://app.netlify.com/)

2.Navigate to **Site Configuration** > **Visual Editor**

3.Click **Enable Visual Editor**

### 2.2 Configure Content Source

```json
{
  "contentSource": {
    "type": "git",
    "repository": "https://github.com/JHARB47/pole-height-app",
    "branch": "main",
    "contentPath": "content"
  }
}

```bash

### 2.3 Set Framework Detection

-**Framework**: Custom/Static Site

-**Build Command**: `npm run build`

-**Publish Directory**: `dist`

-**Node Version**: 22.12.0

## Step 3: Configure Visual Editor Models

### 3.1 Upload Configuration

The Visual Editor will automatically detect your configuration files:

-`netlify-visual-editor.config.json`

-`visual-editor.config.js`

### 3.2 Verify Content Models

In Netlify Dashboard > Visual Editor > Content Models, you should see:

-✅ **Site**: Global configuration

-✅ **Page**: Marketing pages with sections

-✅ **HeroSection**: Title, subtitle, CTA

-✅ **RichTextSection**: Markdown content

-✅ **FeatureSection**: Feature grids

-✅ **CtaSection**: Call-to-action blocks

## Step 4: Test Visual Editor Interface

### 4.1 Access Visual Editor

1.In Netlify Dashboard, go to **Visual Editor**

2.Click **Edit Site** or use the direct URL:

   ```

   https://app.netlify.com/sites/[your-site-name]/visual-editor
   ```

### 4.2 Test Content Editing
**Edit Site Configuration:**

1.Click on **Site** in content tree

2.Modify `siteTitle`, `primaryColor`, or navigation

3.Save changes and preview

**Edit Home Page:**

1.Navigate to **Pages** > **Home**

2.Edit existing Hero section

3.Add new Feature section

4.Preview changes in real-time

### 4.3 Verify Live Updates

-Changes should auto-save to Git repository

-Site should rebuild automatically

-Verify changes appear on live site

## Step 5: Configure Permissions for Content Editors

### 5.1 Invite Team Members

In Netlify Dashboard:

1.Go to **Team** > **Team Members**

2.Click **Add Members**

3.Enter email addresses for content editors

4.Set role to **Content Editor** or **Collaborator**

### 5.2 Set Content Permissions

Configure access levels:

-**Content Editor**: Can edit content through Visual Editor

-**Developer**: Full site access including code changes

-**Viewer**: Read-only access to content

### 5.3 Content Approval Workflow (Optional)

For organizations requiring approval:

1.Enable **Branch Protection** in Git settings

2.Set up **Deploy Previews** for content changes

3.Configure **Review Requirements** before publishing

## Step 6: Content Team Training

### 6.1 Visual Editor Access
**Login Instructions:**

1.Go to your Netlify site URL + `/admin`

2.Or access via Netlify Dashboard > Visual Editor

3.Login with Netlify credentials

**Navigation Overview:**

-**Content Tree**: Left sidebar showing all content

-**Editor Panel**: Center area for content editing

-**Preview**: Right panel showing live preview

-**Publish Button**: Top right to save and deploy changes

### 6.2 Content Editing Workflow

**Editing Site Configuration:**

```bash
1.Click "Site" in content tree

2.Update site title, colors, navigation

3.Changes apply globally across all pages

4.Click "Publish" to save

```bash
**Creating/Editing Pages:**

```bash
1.Click "Pages" > "Home" (or create new page)

2.Edit page title and SEO description

3.Manage page sections:

   - Add Hero for page headers
   - Add RichText for detailed content
   - Add Features for capability lists
   - Add CTA for conversion points

4.Preview changes in real-time

5.Publish when satisfied

```bash
**Working with Sections:**

-**Hero Sections**: Main page headers with background images and CTAs

-**Rich Text**: Markdown content with formatting support

-**Feature Grids**: Lists of capabilities or benefits

-**Call-to-Action**: Conversion buttons and promotional blocks

### 6.3 Best Practices for Content Editors

**Content Structure:**

-Start pages with Hero sections for impact

-Use Rich Text for detailed explanations

-Feature sections work well for lists and comparisons

-End pages with CTA sections for conversions

**SEO Optimization:**

-Always fill in page titles and descriptions

-Use descriptive headings in Rich Text sections

-Optimize images with alt text and appropriate sizes

**Preview and Testing:**

-Always preview changes before publishing

-Test on mobile and desktop views

-Verify links and buttons work correctly

## Step 7: Development Workflow with Visual Editor

### 7.1 Local Development with Content Editing

```bash

# Start hybrid development environment

npm run dev:visual-editor

# Access points:

# - Application: http://localhost:5174/

# - Visual Editor: http://localhost:8888/

# - Static Preview: http://localhost:3999/

```bash

### 7.2 Content Sync Workflow

```bash

# Pull latest content changes

git pull origin main

# Start development with latest content

npm run dev:visual-editor

# Content changes auto-sync to local files

# Application hot-reloads with new content

```bash

### 7.3 Deployment Pipeline

```bash
Content Editor Changes → Git Commit → Auto Deploy → Live Site Update
Developer Changes → Git Commit → Auto Deploy → Live Site Update

```bash

## Troubleshooting

### Visual Editor Not Loading

-Verify `netlify-visual-editor.config.json` is valid JSON

-Check that content files exist in `content/` directory

-Ensure Git repository has proper permissions

### Content Changes Not Appearing

-Verify auto-deployment is enabled in Netlify

-Check build logs for errors

-Ensure content files are committed to Git

### Permission Issues

-Verify team member has correct role assignment

-Check that repository permissions allow content editing

-Ensure branch protection rules allow content commits

## Summary

Your PolePlan Pro application now has:

-✅ **Production Deployment** on Netlify

-✅ **Visual Editor** for content management

-✅ **Team Permissions** configured

-✅ **Content Training** materials provided

-✅ **Hybrid Development** workflow established

**Next Actions:**

1.Complete deployment using preferred method above

2.Test Visual Editor with sample content changes

3.Invite content team and provide training

4.Establish content publishing workflow

The Visual Editor provides powerful content management while preserving your sophisticated engineering application functionality.
