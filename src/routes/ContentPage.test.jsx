import React from 'react';
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import ContentPage from './ContentPage.jsx'

function renderWithRoute(pathname) {
  const router = createMemoryRouter([
    { path: '/', element: <ContentPage slug="home" /> },
    { path: '/:slug', element: <ContentPage /> },
  ], { initialEntries: [pathname] })
  render(<RouterProvider router={router} />)
}

describe('ContentPage', () => {
  it('renders home content', () => {
    renderWithRoute('/')
    expect(document.title).toBe('Home')
    expect(screen.getByText(/OSP Engineering & Permit Management/i)).toBeTruthy()
  })

  it('renders not found for unknown slug', () => {
    renderWithRoute('/nope')
    expect(screen.getByRole('heading', { name: /Page not found/i })).toBeTruthy()
  })
})
