import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"

const Dashboard = () => {
  return (
    <div className="space-y-6">
      
      {/* Page Context */}
      <div>
        <h2 className="text-2xl font-semibold">
          Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          Quick access to your academic sections
        </p>
      </div>

      <AcademicQuickAccess mode="dashboard" />

    </div>
  )
}

export default Dashboard
