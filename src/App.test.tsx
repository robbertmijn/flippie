import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('explains that genealogy data stays in the browser', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /what stays in the family/i })).toBeInTheDocument()
    expect(screen.getByText(/processed locally in your browser/i)).toBeInTheDocument()
  })

  it('loads a CSV locally and displays the import report', async () => {
    render(<App />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const csv = 'Place,Title,Name,Type,Latitude,Longitude,Code,Enclosed_by,Date\n[P1],,Place,,,,,,\n\nPerson,Surname,Given,Call,Suffix,Prefix,Title,Gender,Birth date,Birth place,Birth source,Baptism date,Baptism place,Baptism source,Death date,Death place,Death source,Burial date,Burial place,Burial source,Note\n[I1],Example,Avery,,,,,,,,,,,,,,,,,,,\n\nMarriage,Husband,Wife,Date,Place,Source,Note\n[F1],,,,,,\n\nFamily,Child\n[F1],[I1]'
    fireEvent.change(input, { target: { files: [new File([csv], 'family.csv', { type: 'text/csv' })] } })
    await waitFor(() => expect(screen.getByRole('heading', { name: /your file is ready/i })).toBeInTheDocument())
    expect(screen.getByText('family.csv')).toBeInTheDocument()
    expect(screen.getByText('Parent–child links')).toBeInTheDocument()
  })
})
