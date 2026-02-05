import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"
import { useAuth } from "@/context/AuthContext"

import { Navbar } from "@/components"

import { Toaster } from "@/components/ui/sonner"


const App = () => {
 

   const { isLoading } = useAuth()

  if (isLoading) {
    return null // or <Loader />
  }
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <Navbar />
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}

export default App
