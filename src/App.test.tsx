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

  it('searches for a root person and shows completeness analysis', async () => {
    render(<App />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const csv = 'Place,Title,Name,Type,Latitude,Longitude,Code,Enclosed_by,Date\n\nPerson,Surname,Given,Call,Suffix,Prefix,Title,Gender,Birth date,Birth place,Birth source,Baptism date,Baptism place,Baptism source,Death date,Death place,Death source,Burial date,Burial place,Burial source,Note\n[I1],Example,Avery,,,,,,1980,,,,,,,,,,,,\n[I2],Example,Robin,,,,,,1950,,,,,,,,,,,,\n\nMarriage,Husband,Wife,Date,Place,Source,Note\n[F1],[I2],,,,,\n\nFamily,Child\n[F1],[I1]'
    fireEvent.change(input, { target: { files: [new File([csv], 'family.csv', { type: 'text/csv' })] } })

    const search = await screen.findByRole('searchbox', { name: /search people/i })
    fireEvent.change(search, { target: { value: 'Avery' } })
    fireEvent.click(screen.getByRole('button', { name: 'Avery Example' }))

    expect(screen.getByText('Ancestor coverage by generation')).toBeInTheDocument()
    expect(screen.getByText('Record completeness by generation')).toBeInTheDocument()
    expect(screen.getByText('Date precision across unique people')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Avery Example' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Interactive ancestor tree')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ancestor ahnentafel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name for ancestor 2')).toHaveValue('Robin Example')
    expect(screen.getByText('≈ 30')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Death date for ancestor 2'), { target: { value: '2020' } })
    expect(screen.getByText('≈ 70')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fan chart' }))
    expect(screen.getByLabelText('Interactive radial ancestor fan chart')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Avery Example, root person/i }))
    expect(screen.getByRole('dialog', { name: 'Avery Example' })).toBeInTheDocument()
    expect(screen.getByText('1980')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close person details/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
