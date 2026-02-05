import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ForumTabs = ({ tab, onChange, canUseUniversity, canUseBranch }) => {
  return (
    <Tabs value={tab} onValueChange={onChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All</TabsTrigger>

        <TabsTrigger
          value="university"
          disabled={!canUseUniversity}
        >
          University
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
