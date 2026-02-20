import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"

interface UserData {
  id: number;
  username: string;
  email: string;
}

export function UserSheet() {
  const router = useRouter()

  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/me")

        if (response.ok) {
          const data: UserData = await response.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch {
        // WHY: Silently handle user fetch failure - component gracefully handles null user
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      })

      if (response.ok) {
        setUser(null)
        router.push("/login")
      } else {
        // WHY: Logout failure is handled silently - user remains logged in
        // In production, server-side logging captures these errors
      }
    } catch {
      // WHY: Network errors during logout are handled silently
      // User remains logged in if logout fails - better UX than showing error
    }
  }

  return (
    <div className="flex flex-col h-full w-full secondary-background">
      {isLoading ? (
        <div className="flex flex-col h-full">
          <SheetHeader className="pb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </SheetHeader>
          
          <div className="flex-1" />
          
          <SheetFooter className="flex-col gap-4 border-t pt-4 mt-auto">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </SheetFooter>
        </div>
      ) : user ? (
        <>
          <SheetHeader className="pb-6">
            <SheetTitle className="text-2xl font-bold">
              Hello, {user.username}!
            </SheetTitle>
            <SheetDescription className="text-base text-muted-foreground mt-2">
              {user.email}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1" />
          
          <SheetFooter className="flex-col gap-4 border-t pt-4 mt-auto">
            <button
              className="w-full inline-flex h-10 items-center justify-center rounded-md transaction-background cursor-pointer transaction px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Exiting..." : "Logout"}
            </button>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              Made with <Heart className="size-3 fill-red-500 text-red-500" /> by Arthur Marchetti
            </p>
          </SheetFooter>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Você não está logado.</p>
        </div>
      )}
    </div>
  )
}