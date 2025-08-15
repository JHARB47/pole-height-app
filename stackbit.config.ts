import { defineStackbitConfig, type SiteMapEntry } from "@stackbit/types";
import { GitContentSource } from "@stackbit/cms-git";

export default defineStackbitConfig({
  stackbitVersion: '~0.6.0',

  contentSources: [
    new GitContentSource({
      rootPath: __dirname,
      contentDirs: ["content"],
      models: [
        {
          name: "Page",
          type: "page",
          urlPath: "/{slug}",
          filePath: "content/pages/{slug}.json",
          fields: [
            { name: "slug", type: "string", required: true },
            { name: "title", type: "string", required: true }
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
