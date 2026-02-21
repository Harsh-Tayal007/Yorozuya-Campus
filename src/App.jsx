import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"

import { SidebarProvider } from "@/context/SidebarContext"

const App = () => {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppRoutes />
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
