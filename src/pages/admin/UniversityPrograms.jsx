import { useParams } from "react-router-dom"

const UniversityPrograms = () => {
  const { id } = useParams()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">University Programs</h1>
      <p className="text-muted-foreground">
        Programs for university ID: <span className="font-mono">{id}</span>
      </p>
    </div>
  )
}

export default UniversityPrograms
