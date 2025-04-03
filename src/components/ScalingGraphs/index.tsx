import { useState, useEffect } from 'react'
import { getUniqueSubjects, loadScalingData, hasDataForSubjectAndYear, type ScalingRow } from '../../utils/scalingData'
import { ScalingGraph } from './ScalingGraph'
import './ScalingGraphs.css'

interface Selection {
  subject: string
  year: string
}

const YEARS = ['2020', '2021', '2022', '2023', '2024']

export function ScalingGraphs() {
  const [subjects, setSubjects] = useState<string[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ScalingRow[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedData = await loadScalingData()
        setData(loadedData)
        const loadedSubjects = await getUniqueSubjects(loadedData)
        setSubjects(loadedSubjects)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const isSelected = (subject: string, year: string) => {
    return selections.some(s => s.subject === subject && s.year === year)
  }

  const toggleSelection = (subject: string, year: string) => {
    setSelections(prev => {
      const exists = prev.some(s => s.subject === subject && s.year === year)
      if (exists) {
        return prev.filter(s => !(s.subject === subject && s.year === year))
      } else {
        return [...prev, { subject, year }]
      }
    })
  }

  const isYearSelected = (year: string) => {
    return subjects.every(subject => 
      !hasDataForSubjectAndYear(data, subject, year) || isSelected(subject, year)
    )
  }

  const isSubjectSelected = (subject: string) => {
    return YEARS.every(year => 
      !hasDataForSubjectAndYear(data, subject, year) || isSelected(subject, year)
    )
  }

  const toggleYear = (year: string) => {
    const isAllSelected = isYearSelected(year)
    setSelections(prev => {
      const withoutYear = prev.filter(s => s.year !== year)
      if (isAllSelected) {
        return withoutYear
      } else {
        const newSelections = subjects
          .filter(subject => hasDataForSubjectAndYear(data, subject, year))
          .map(subject => ({ subject, year }))
        return [...withoutYear, ...newSelections]
      }
    })
  }

  const toggleSubject = (subject: string) => {
    const isAllSelected = isSubjectSelected(subject)
    setSelections(prev => {
      const withoutSubject = prev.filter(s => s.subject !== subject)
      if (isAllSelected) {
        return withoutSubject
      } else {
        const newSelections = YEARS
          .filter(year => hasDataForSubjectAndYear(data, subject, year))
          .map(year => ({ subject, year }))
        return [...withoutSubject, ...newSelections]
      }
    })
  }

  if (isLoading) {
    return <div className="scaling-graphs-container">Loading...</div>
  }

  return (
    <div className="scaling-graphs-container">
      <div className="selection-grid">
        <button 
          className="clear-all-button"
          onClick={() => setSelections([])}
        >
          Clear All
        </button>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                {YEARS.map(year => (
                  <th key={year} className="year-header">
                    <label className="header-checkbox">
                      <input
                        type="checkbox"
                        checked={isYearSelected(year)}
                        onChange={() => toggleYear(year)}
                      />
                      <span>{'\''+year.slice(2)}</span>
                    </label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject}>
                  <td className="subject-name">
                    <label className="row-checkbox">
                      <input
                        type="checkbox"
                        checked={isSubjectSelected(subject)}
                        onChange={() => toggleSubject(subject)}
                      />
                      {subject}
                    </label>
                  </td>
                  {YEARS.map(year => (
                    <td key={year} className="selection-cell">
                      {hasDataForSubjectAndYear(data, subject, year) && (
                        <input
                          type="checkbox"
                          checked={isSelected(subject, year)}
                          onChange={() => toggleSelection(subject, year)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="graph-container">
        <ScalingGraph selections={selections} />
      </div>
    </div>
  )
} 