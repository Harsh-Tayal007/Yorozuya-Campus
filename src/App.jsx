import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"

import { SidebarProvider } from "@/context/SidebarContext"
import { useAuth } from "./context/AuthContext"
import ScrollToTop from "./components/common/navigation/ScrollToTop"
import { usePWAInstall } from "./hooks/usePWAInstall"
import CookieNotice from "./components/common/auth/CookieNotice"

const App = () => {
  const { isLoading } = useAuth()
  usePWAInstall()
  if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0b1220]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full rounded-full" />
    </div>
  )
}

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SidebarProvider>
        <AppRoutes />
        <CookieNotice />
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
