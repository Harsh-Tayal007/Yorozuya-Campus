// src/pages/dashboard/Dashboard.jsx
import { motion } from "framer-motion"
import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"
import UniversityNoticesWidget from "@/components/dashboard/UniversityNoticesWidget"

const Dashboard = () => {
  return (
    <div className="space-y-6">

      {/* Quick Access */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Quick Access
          </p>
          <p className="text-sm text-muted-foreground">
            Jump to your academic sections
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <AcademicQuickAccess mode="dashboard" />
        </motion.div>
      </div>

      {/* University Notices */}
      <UniversityNoticesWidget />

    </div>
  )
}

export default Dashboard