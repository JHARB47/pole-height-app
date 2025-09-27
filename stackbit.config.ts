import { defineStackbitConfig, type SiteMapEntry } from "@stackbit/types";
import { GitContentSource } from "@stackbit/cms-git";

export default defineStackbitConfig({
  stackbitVersion: '~0.6.0',

  contentSources: [
    new GitContentSource({
      contentDirs: ["content"],
      models: [
        {
          name: "Page",
          type: "page",
          urlPath: "/{slug}",
          filePath: "content/pages/{slug}.json",
          fields: [
            { name: "slug", type: "string", required: true, label: "Slug" },
            { name: "title", type: "string", required: true, label: "Title" },
            { name: "body", type: "text", label: "Body" },
            { name: "seoDescription", type: "string", label: "SEO Description" },
            {
              name: "sections",
              label: "Sections",
              type: "list",
              items: {
                type: "model",
                models: [
                  "HeroSection",
                  "RichTextSection",
                  "FeatureSection",
                  "CtaSection"
                ]
              }
            }
          ]
        },
        {
          name: "NavItem",
          type: "object",
          label: "Navigation Item",
          labelField: "label",
          fields: [
            { name: "label", type: "string", label: "Label", required: true },
            { name: "url", type: "string", label: "URL", required: true }
          ]
        },
        {
          name: "SiteSettings",
          type: "data",
          label: "Site Settings",
          filePath: "content/site.json",
          fields: [
            { name: "siteTitle", type: "string", label: "Site Title", required: true },
            { name: "logo", type: "image", label: "Logo" },
            { name: "primaryColor", type: "string", label: "Primary Color" },
            { name: "secondaryColor", type: "string", label: "Secondary Color" },
            {
              name: "navigation",
              label: "Navigation",
              type: "list",
              items: { type: "model", models: ["NavItem"] }
            }
          ]
        },
        {
          name: "HeroSection",
          type: "object",
          label: "Hero Section",
          labelField: "title",
          fields: [
            { name: "title", type: "string", label: "Title" },
            { name: "subtitle", type: "string", label: "Subtitle" },
            { name: "backgroundImage", type: "image", label: "Background Image" },
            { name: "ctaLabel", type: "string", label: "CTA Label" },
            { name: "ctaUrl", type: "string", label: "CTA URL" }
          ]
        },
        {
          name: "RichTextSection",
          type: "object",
          label: "Rich Text Section",
          labelField: "content",
          fields: [
            { name: "content", type: "markdown", label: "Content" }
          ]
        },
        {
          name: "FeatureItem",
          type: "object",
          label: "Feature Item",
          labelField: "title",
          fields: [
            { name: "title", type: "string", label: "Title" },
            { name: "text", type: "string", label: "Text" },
            { name: "icon", type: "string", label: "Icon (optional)" }
          ]
        },
        {
          name: "FeatureSection",
          type: "object",
          label: "Feature Section",
          labelField: "heading",
          fields: [
            { name: "heading", type: "string", label: "Heading" },
            {
              name: "features",
              label: "Features",
              type: "list",
              items: { type: "model", models: ["FeatureItem"] }
            }
          ]
        },
        {
          name: "CtaSection",
          type: "object",
          label: "Call To Action Section",
          labelField: "text",
          fields: [
            { name: "text", type: "string", label: "Text" },
            { name: "buttonLabel", type: "string", label: "Button Label" },
            { name: "buttonUrl", type: "string", label: "Button URL" }
          ]
        }
      ]
    })
  ],
  siteMap: ({ documents, models }) => {
    const pageModelNames = new Set(models.filter(m => m.type === "page").map(m => m.name));
    return documents
      .filter(d => pageModelNames.has(d.modelName))
      .map((document) => {
        const data: any = (document as any).data || {};
  const slug: string | undefined = data.slug;
  if (!slug) return null as unknown as SiteMapEntry; // filtered below
        const isHome = slug === "home" || slug === "index";
        return {
          stableId: document.id,
          urlPath: isHome ? "/" : `/${slug}`,
          document,
          isHomePage: isHome,
        } as SiteMapEntry;
      })
      .filter(Boolean) as SiteMapEntry[];
  }
});
