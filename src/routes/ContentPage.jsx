// @ts-nocheck
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { setPageMeta } from '../utils/meta'

function HeroSection({ section }) {
  const bg = section.backgroundImage ? `url(${section.backgroundImage})` : 'linear-gradient(135deg,#0ea5e9,#6366f1)'
  return (
    <section style={{background: bg, color: 'white', padding: '48px 16px'}}>
      <div className="max-w-5xl mx-auto">
        <h1 style={{fontSize: 36, fontWeight: 800}}>{section.title || 'Welcome'}</h1>
        {section.subtitle && <p style={{marginTop: 8, opacity: 0.9}}>{section.subtitle}</p>}
        {section.ctaUrl && (
          <Link to={section.ctaUrl} style={{display:'inline-block',marginTop:16,background:'#22c55e',color:'#0b1220',padding:'10px 14px',borderRadius:8,fontWeight:600}}> 
            {section.ctaLabel || 'Get Started'}
          </Link>
        )}
      </div>
    </section>
  )
}

function RichTextSection({ section }) {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div style={{whiteSpace:'pre-wrap'}}>{section.content}</div>
    </section>
  )
}

function FeatureSection({ section }) {
  const items = section.features || []
  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>{section.heading || 'Features'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((f, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4 bg-white">
            <div style={{fontWeight:700}}>{f.title}</div>
            <div style={{opacity:0.9, marginTop: 6}}>{f.text}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CtaSection({ section }) {
  return (
    <section className="max-w-4xl mx-auto px-4 py-10 text-center">
      <div style={{fontSize: 20}}>{section.text}</div>
      {section.buttonUrl && (
        <Link to={section.buttonUrl} style={{display:'inline-block',marginTop:16,background:'#0ea5e9',color:'#042f2e',padding:'10px 14px',borderRadius:8,fontWeight:700}}> 
          {section.buttonLabel || 'Continue'}
        </Link>
      )}
    </section>
  )
}

const sectionRenderer = {
  HeroSection,
  RichTextSection,
  FeatureSection,
  CtaSection,
}

// Eagerly import all content pages so routes work in production builds
const pages = import.meta.glob('../../content/pages/*.json', { eager: true, import: 'default' })

function getPageBySlug(slug) {
  const key = Object.keys(pages).find((k) => k.endsWith(`/${slug}.json`))
  return key ? pages[key] : null
}

export default function ContentPage({ slug: propSlug }) {
  const params = useParams()
  const slug = propSlug || params.slug || 'home'
  const page = getPageBySlug(slug)

  if (!page) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="nf-title">
        <h1 id="nf-title" style={{fontSize:28,fontWeight:800}}>Page not found</h1>
        <p className="mt-2">We couldn’t find the requested page.
          Try the <Link to="/">home page</Link> or launch the <Link to="/app">PolePlan Pro</Link>.</p>
      </section>
    )
  }

  const sections = page.sections || []
  setPageMeta({ title: page.title || 'Pole Plan Pro', description: page.seoDescription })
  return (
    <>
      {sections.map((s, i) => {
        const Type = sectionRenderer[s.type] || RichTextSection
        return <Type key={i} section={s} />
      })}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/app" style={{display:'inline-block',background:'#22c55e',color:'#0b1220',padding:'10px 14px',borderRadius:8,fontWeight:700}}>Launch PolePlan Pro</Link>
      </section>
    </>
  )
}
