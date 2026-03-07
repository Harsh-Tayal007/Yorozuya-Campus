import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ForumTabs = ({
  tab,
  canUseUniversity,
  canUseCourse,
  canUseBranch,
}) => {
  return (
    <Tabs value={tab}>
      <TabsList className="grid w-full grid-cols-4 h-11 rounded-xl bg-muted/40">
        <TabsTrigger value="all">
          All
        </TabsTrigger>

        <TabsTrigger
          value="university"
          disabled={!canUseUniversity}
        >
          University
        </TabsTrigger>

        <TabsTrigger
          value="course"
          disabled={!canUseCourse}
        >
          Course
        </TabsTrigger>

        <TabsTrigger
          value="branch"
          disabled={!canUseBranch}
        >
          Branch
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export default ForumTabs