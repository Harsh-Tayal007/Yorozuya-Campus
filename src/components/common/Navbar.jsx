import { Link, useNavigate } from "react-router-dom"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { DarkModeToggle } from "."
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

const Navbar = () => {
  const navigate = useNavigate()
  const { isInstallable, install } = usePWAInstall();

  const {
    authStatus,
    currentUser,
    isLoading,
    logout,
    hasRole,
    hasAnyPermission
  } = useAuth()

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches;

  if (isLoading) return null

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Left: Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight"
        >
          Unizuya
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isInstallable && !isStandalone && (
            <Button onClick={install} size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}

          <DarkModeToggle />

          <NavigationMenu>
            <NavigationMenuList>
              {authStatus ? (
                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-sm"
                      >
                        {currentUser?.name || currentUser?.email}
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                      {hasAnyPermission(["view:admin-dashboard"]) && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/dashboard">
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive"
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <Button asChild size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  )

}

export default Navbar
