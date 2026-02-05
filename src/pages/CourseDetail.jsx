import { useParams } from 'react-router-dom'
import { universities } from '../data/universities'
import { BranchCard, PageWrapper } from '../components'
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"


const CourseDetail = () => {
  const { universityId, courseId } = useParams()

  const university = universities.find(
    (u) => u.id === universityId
  )

  const course = university?.courses.find(
    (c) => c.id === courseId
  )

  if (!course) return <p>Course not found</p>

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {course.name}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select your branch to explore syllabus, resources & discussions
        </p>
      </div>

      {/* Divider */}
      <Separator />

      {/* Branch section */}
      <div className="
      mt-6 rounded-xl border p-5
      border-gray-200 bg-gray-50

      dark:border-gray-700 dark:bg-gray-800
    ">
        {course.branches.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No branches found</EmptyTitle>
              <EmptyDescription>
                This course does not have any branches yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {course.branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onClick={() => console.log(branch.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )

}

export default CourseDetail
