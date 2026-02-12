import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

import { Separator } from "@/components/ui/separator"
import { CourseCard, PageWrapper } from "@/components"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

import { useQuery } from "@tanstack/react-query"


const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const UNIVERSITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID
const PROGRAMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID


const UniversityDetail = () => {
  const { universityId } = useParams()
  const navigate = useNavigate()

  const {
  data,
  isLoading,
  isError,
} = useQuery({
  queryKey: ["university-detail", universityId],
  queryFn: async () => {
    const [uniRes, progRes] = await Promise.all([
      databases.getDocument(
        DATABASE_ID,
        UNIVERSITIES_COLLECTION_ID,
        universityId
      ),
      databases.listDocuments(
        DATABASE_ID,
        PROGRAMS_COLLECTION_ID,
        [Query.equal("universityId", universityId)]
      ),
    ])

    return {
      university: uniRes,
      programs: progRes.documents,
    }
  },
  enabled: !!universityId,
})

  if (isLoading) {
  return (
    <PageWrapper>
      <p className="text-sm text-muted-foreground">
        Loading university…
      </p>
    </PageWrapper>
  )
}


  if (isError || !data?.university) {
  return (
    <PageWrapper>
      <p className="text-sm text-muted-foreground">
        University not found
      </p>
    </PageWrapper>
  )
}

const { university, programs } = data


  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {university.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a course to continue
        </p>
      </div>

      {/* Divider */}
      <Separator />
      {/* Courses section */}
      <div className="
  mt-6 rounded-xl border p-4
  border-gray-200 bg-gray-50
  dark:border-gray-700 dark:bg-gray-800
">
        {programs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No programs available</EmptyTitle>
              <EmptyDescription>
                This university has not added any programs yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programs.map((program) => (
              <CourseCard
                key={program.$id}
                course={program}
                onClick={() => navigate(`/programs/${program.$id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  )
}

export default UniversityDetail
