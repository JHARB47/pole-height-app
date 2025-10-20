// @ts-nocheck

import React from "react";
import { useParams } from "react-router-dom";
import SafeLink from "../components/SafeLink.jsx";
import { setPageMeta } from "../utils/meta";
import { stackbitData, stackbitObjectId } from "../utils/stackbit";

function HeroSection({ section, sectionIndex, pageSource }) {
  const sectionObjectId = stackbitObjectId(
    pageSource,
    `sections[${sectionIndex}]`,
  );
  const bg = section.backgroundImage
    ? `url(${section.backgroundImage})`
    : "linear-gradient(135deg,#0ea5e9,#6366f1)";
  return (
    <section 
      style={{ background: bg, color: "white", padding: "48px 16px" }}
      {...stackbitData(sectionObjectId)}
    >
      <div className="max-w-5xl mx-auto">
        <h1 
          style={{ fontSize: 36, fontWeight: 800 }}
          {...stackbitData(sectionObjectId, "title")}
        >
          {section.title || "Welcome"}
        </h1>
        {section.subtitle && (
          <p
            style={{ marginTop: 8, opacity: 0.9 }}
            {...stackbitData(sectionObjectId, "subtitle")}
          >
            {section.subtitle}
          </p>
        )}
        {section.ctaUrl && (
          <SafeLink
            to={section.ctaUrl}
            style={{
              display: "inline-block",
              marginTop: 16,
              background: "#22c55e",
              color: "#0b1220",
              padding: "10px 14px",
              borderRadius: 8,
              fontWeight: 600,
            }}
            {...stackbitData(sectionObjectId, "ctaUrl#@href")}
          >
            <span {...stackbitData(sectionObjectId, "ctaLabel")}>
              {section.ctaLabel || "Get Started"}
            </span>
          </SafeLink>
        )}
      </div>
    </section>
  );
}

function RichTextSection({ section, sectionIndex, pageSource }) {
  const sectionObjectId = stackbitObjectId(
    pageSource,
    `sections[${sectionIndex}]`,
  );
  return (
    <section
      className="max-w-5xl mx-auto px-4 py-8"
      {...stackbitData(sectionObjectId)}
    >
      <div
        style={{ whiteSpace: "pre-wrap" }}
        {...stackbitData(sectionObjectId, "content")}
      >
        {section.content}
      </div>
    </section>
  );
}

function FeatureSection({ section, sectionIndex, pageSource }) {
  const sectionObjectId = stackbitObjectId(
    pageSource,
    `sections[${sectionIndex}]`,
  );
  const items = section.features || [];
  return (
    <section
      className="max-w-5xl mx-auto px-4 py-8"
      {...stackbitData(sectionObjectId)}
    >
      <h2
        style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}
        {...stackbitData(sectionObjectId, "heading")}
      >
        {section.heading || "Features"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((f, i) => {
          const itemObjectId = stackbitObjectId(
            pageSource,
            `sections[${sectionIndex}].features[${i}]`,
          );
          return (
            <div
              key={i}
              className="rounded-lg border border-slate-200 p-4 bg-white"
              {...stackbitData(itemObjectId)}
            >
              <div
                style={{ fontWeight: 700 }}
                {...stackbitData(itemObjectId, "title")}
              >
                {f.title}
              </div>
              <div
                style={{ opacity: 0.9, marginTop: 6 }}
                {...stackbitData(itemObjectId, "text")}
              >
                {f.text}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CtaSection({ section, sectionIndex, pageSource }) {
  const sectionObjectId = stackbitObjectId(
    pageSource,
    `sections[${sectionIndex}]`,
  );
  return (
    <section
      className="max-w-5xl mx-auto px-4 py-8 text-center"
      {...stackbitData(sectionObjectId)}
    >
      <div className="rounded-lg border border-slate-200 p-6 bg-white">
        <p
          style={{ fontSize: 18, marginBottom: 12, opacity: 0.9 }}
          {...stackbitData(sectionObjectId, "text")}
        >
          {section.text}
        </p>
        {section.buttonLabel && section.buttonUrl && (
          <SafeLink
            to={section.buttonUrl}
            className="inline-block px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
            {...stackbitData(sectionObjectId, "buttonUrl#@href")}
          >
            <span {...stackbitData(sectionObjectId, "buttonLabel")}>
              {section.buttonLabel}
            </span>
          </SafeLink>
        )}
      </div>
    </section>
  );
}

const sectionRenderer = {
  HeroSection,
  RichTextSection,
  FeatureSection,
  CtaSection,
};

// Eagerly import all content pages so routes work in production builds
const pages = import.meta.glob("../../content/pages/*.json", {
  eager: true,
  import: "default",
});

function getPageEntry(slug) {
  for (const [key, data] of Object.entries(pages)) {
    if (key.endsWith(`/${slug}.json`)) {
      return { page: data, source: key };
    }
  }
  return null;
}

export default function ContentPage({ slug: propSlug }) {
  const params = useParams();
  const slug = propSlug || params.slug || "home";
  const entry = getPageEntry(slug);

  if (!entry) {
    return (
      <section
        className="max-w-4xl mx-auto px-4 py-10"
        aria-labelledby="nf-title"
      >
        <h1 id="nf-title" style={{ fontSize: 28, fontWeight: 800 }}>
          Page not found
        </h1>
        <p className="mt-2">
          We couldn't find the requested page. Try the{" "}
          <SafeLink to="/">home page</SafeLink> or launch the{" "}
          <SafeLink to="/app">PolePlan Pro</SafeLink>.
        </p>
      </section>
    );
  }

  const { page, source } = entry;
  const sections = page.sections || [];
  const pageObjectId = stackbitObjectId(source);

  setPageMeta({
    title: page.title || "Pole Plan Pro",
    description: page.seoDescription,
  });

  return (
    <div {...stackbitData(pageObjectId)}>
      {page.title ? (
        <span className="sr-only" {...stackbitData(pageObjectId, "title")}>
          {page.title}
        </span>
      ) : null}
      {page.seoDescription ? (
        <span
          className="sr-only"
          {...stackbitData(pageObjectId, "seoDescription")}
        >
          {page.seoDescription}
        </span>
      ) : null}
      {sections.map((s, i) => {
        const Type = sectionRenderer[s.type] || RichTextSection;
        return (
          <Type key={i} section={s} sectionIndex={i} pageSource={source} />
        );
      })}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <SafeLink
          to="/app"
          style={{
            display: "inline-block",
            background: "#22c55e",
            color: "#0b1220",
            padding: "10px 14px",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          Launch PolePlan Pro
        </SafeLink>
      </section>
    </div>
  );
}
