import { Outlet } from "react-router-dom"
import { Navbar } from "@/components"

const PublicLayout = () => {
  return (
    <div className="
      min-h-screen
      bg-gradient-to-b
      from-slate-50
      to-slate-100
      dark:from-[#0f172a]
      dark:to-[#020617]
    ">
      <Navbar />
      <main className="pt-[68px]">
        <Outlet />
      </main>
      {/* optional Footer */}
    </div>
  )
}

export default PublicLayout
