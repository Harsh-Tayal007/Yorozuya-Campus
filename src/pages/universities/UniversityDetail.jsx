// src/pages/universities/UniversityDetail.jsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { School, Loader2 } from "lucide-react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import CourseCard from "@/components/university/CourseCard"

const DATABASE_ID              = import.meta.env.VITE_APPWRITE_DATABASE_ID
const UNIVERSITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID
const PROGRAMS_COLLECTION_ID   = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID

const UniversityDetail = () => {
  const { universityId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["university-detail", universityId],
    queryFn: async () => {
      const [uniRes, progRes] = await Promise.all([
        databases.getDocument(DATABASE_ID, UNIVERSITIES_COLLECTION_ID, universityId),
        databases.listDocuments(DATABASE_ID, PROGRAMS_COLLECTION_ID, [Query.equal("universityId", universityId)]),
      ])
      return { university: uniRes, programs: progRes.documents }
    },
    enabled: !!universityId,
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  )

  if (isError || !data?.university) return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">University not found</p>
    </div>
  )

  const { university, programs } = data

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <School size={18} className="text-sky-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{university.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {university.city ? `${university.city}, ${university.country}` : university.country}
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Programs ({programs.length})
        </p>
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No programs available yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map(program => (
              <CourseCard key={program.$id} course={program}
                onClick={() => navigate(`/programs/${program.$id}`)} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default UniversityDetail