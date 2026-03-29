import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"

import { SidebarProvider } from "@/context/SidebarContext"
import { useAuth } from "./context/AuthContext"
import ScrollToTop from "./components/common/navigation/ScrollToTop"
import { usePWAInstall } from "./hooks/usePWAInstall"
import CookieNotice from "./components/common/auth/CookieNotice"
import { AppLoader } from "./components"

const App = () => {
  const { isLoading } = useAuth()
  usePWAInstall()
  if (isLoading) return <AppLoader
   />

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
