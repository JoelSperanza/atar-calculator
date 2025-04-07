import scalingData from '../../data/Scaling_graph_data.csv'

export interface ScalingRow {
  Year: string
  Subject: string
  [key: string]: string | undefined
}

let cachedData: ScalingRow[] | null = null

export async function loadScalingData(): Promise<ScalingRow[]> {
  if (cachedData) {
    return cachedData
  }

  try {
    const response = await fetch('/data/Scaling_graph_data.csv')
    const text = await response.text()
    const rows = text.split('\n').filter(row => row.trim())
    const headers = rows[0].split(',').map(header => header.trim())
    console.log('CSV Headers:', headers.map(h => `"${h}"`))
    
    cachedData = rows.slice(1).map(row => {
      const values = row.split(',')
      const rowData: ScalingRow = { Year: '', Subject: '' }
      headers.forEach((header, i) => {
        rowData[header] = values[i]
      })
      return rowData
    })
    
    return cachedData
  } catch (error) {
    console.error('Error loading scaling data:', error)
    return []
  }
}

export function hasDataForSubjectAndYear(data: ScalingRow[], subject: string, year: string): boolean {
  const row = data.find(r => r.Subject === subject && r.Year === year)
  if (!row) return false
  
  // Check if any scaling score exists (not empty)
  return Object.entries(row).some(([key, value]) => {
    // Skip Year and Subject columns
    if (key === 'Year' || key === 'Subject') return false
    return value !== undefined && value !== ''
  })
}

export function getUniqueSubjects(data?: ScalingRow[]): Promise<string[]> {
  return loadScalingData().then(loadedData => {
    const allData = data || loadedData
    // Only include subjects that have data for at least one year
    return Array.from(new Set(allData
      .filter(row => hasDataForSubjectAndYear(allData, row.Subject, row.Year))
      .map(row => row.Subject)))
      .sort()
  })
}

// Get available years
export async function getAvailableYears(): Promise<string[]> {
  const data = await loadScalingData()
  const years = new Set(data.map(row => row.Year).filter(Boolean))
  return Array.from(years).sort().reverse() // Most recent first
}

// Get scaling data for specific subject and year
export async function getScalingData(subject: string, year: string): Promise<ScalingRow | undefined> {
  const data = await loadScalingData()
  return data.find(row => row.Subject === subject && row.Year === year)
} 