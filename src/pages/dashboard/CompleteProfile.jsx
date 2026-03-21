// src/pages/dashboard/CompleteProfile.jsx
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { GraduationCap, ArrowRight } from "lucide-react"

const CompleteProfile = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60
                   backdrop-blur-sm p-8 text-center space-y-5 shadow-xl"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl
                        bg-violet-500/10 border border-violet-500/20 mx-auto">
          <GraduationCap size={24} className="text-violet-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Set up your academic information to access your personalised dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/settings?tab=academic")}
          className="w-full h-10 rounded-xl text-sm font-semibold text-white
                     flex items-center justify-center gap-2
                     transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            boxShadow: "0 4px 16px rgba(109,40,217,0.35)",
          }}
        >
          Set Up Academic Profile
          <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  )
}

export default CompleteProfile