import { useEffect, useState } from 'react'
import { getAvailableYears } from '../../utils/scalingData'

interface YearSelectorProps {
  selectedYears: string[]
  onYearToggle: (year: string) => void
}

export function YearSelector({ selectedYears, onYearToggle }: YearSelectorProps) {
  const [years, setYears] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadYears = async () => {
      try {
        const availableYears = await getAvailableYears()
        setYears(availableYears)
      } catch (error) {
        console.error('Failed to load years:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadYears()
  }, [])

  return (
    <div className="year-selector">
      <h3>Select Years</h3>
      <div className="checkbox-list">
        {isLoading ? (
          <p>Loading years...</p>
        ) : years.length === 0 ? (
          <p>No years available</p>
        ) : (
          years.map((year) => (
            <label key={year} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => onYearToggle(year)}
              />
              <span>{year}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
} 