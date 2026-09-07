import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('explains that genealogy data stays in the browser', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /what stays in the family/i })).toBeInTheDocument()
    expect(screen.getByText(/processed locally in your browser/i)).toBeInTheDocument()
  })

  it('does not enable import before the import phase is implemented', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /load a genealogy csv/i })).toBeDisabled()
  })
})
