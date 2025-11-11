import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react"; 

interface UserData {
  id: number;
  username: string;
  email: string;
}

export function UserSheet() {
    const router = useRouter();

    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/me'); 
          
          if (response.ok) {
            const data: UserData = await response.json();
            setUser(data);
          } else {
            setUser(null); 
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    }, []); 

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', { //
                method: 'POST',
            });

            if (response.ok) {
                setUser(null); 
                router.push('/login');
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <div>

                  {isLoading ? (
                    <p>Carregando...</p>
                  ) : user ? (


                    <>
                <SheetHeader>
                <SheetTitle>Hello {user.username} {user.email}</SheetTitle>
              
                    </SheetHeader>
                          <SheetFooter>
                          <button onClick={handleLogout} disabled={isLoading}>
                              Sair (Logout)
                          </button>
                      </SheetFooter>
                      </>
                  ) : (
                    <p>Você não está logado.</p>
                  )}
               


      
        </div>
    );
}