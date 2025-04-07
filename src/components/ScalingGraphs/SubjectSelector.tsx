import { useEffect, useState } from 'react'
import { getUniqueSubjects } from '../../utils/scalingData'
import './ScalingGraphs.css'

interface SubjectSelectorProps {
  selectedSubjects: string[]
  onSubjectToggle: (subject: string) => void
}

export function SubjectSelector({ selectedSubjects, onSubjectToggle }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const uniqueSubjects = await getUniqueSubjects()
        setSubjects(uniqueSubjects)
      } catch (error) {
        console.error('Failed to load subjects:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSubjects()
  }, [])

  return (
    <div className="subject-selector">
      <h3>Select Subjects</h3>
      <div className="checkbox-list">
        {isLoading ? (
          <p>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p>No subjects available</p>
        ) : (
          subjects.map((subject) => (
            <label key={subject} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => onSubjectToggle(subject)}
              />
              <span>{subject}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
} 