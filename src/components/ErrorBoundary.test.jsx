import { render, screen } from '@testing-library/react'
import React from 'react'
import ErrorBoundary from './ErrorBoundary.jsx'

function Boom() {
  throw new Error('Boom!')
}

describe('ErrorBoundary', () => {
  it('renders fallback on child error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy()
    expect(screen.getByText(/Boom!/i)).toBeTruthy()
  })
})
