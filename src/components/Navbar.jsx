import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { db, auth } from "../config/firebase";
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import RegisterTypeDialog from "./RegisterTypeDialog";
import { Button } from './ui/button';
import { div } from '@tensorflow/tfjs';

function Navbar() {
  
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setUser({ id: userDoc.id, ...userDoc.data() });
            setIsAdmin(true);
          } 
          else {
            setUser({ id: userDoc.id, ...userDoc.data() });
            setIsAdmin(false);
          }
        } 
        catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } 
      else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } 
    catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <header className="bg-[#1A1F2C] text-white py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-xl">Clear View</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>

      <header className="bg-[#1A1F2C] text-white py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {!isAuthenticated && (
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">Clear View</span>
            </Link>
          )}
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="flex items-center space-x-2">
              <img
                src="logo.svg"
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">Clear View</span>
            </Link>
          )}
          {isAuthenticated && !isAdmin && (
            <Link to={`/user-dashboard/${user.uid}`} className="flex items-center space-x-2">
              <img
                src="logo.svg"
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">Clear View</span>
            </Link>
          )}

          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && !isAdmin && (
              <Link
                to={`/user-dashboard/${user.uid}`}
                className={`hover:text-[#F2FCE2] transition-colors ${
                  isActive(`/user-dashboard/${user.uid}`) ? "text-[#6B8E23] font-semibold" : ""
                }`}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={`hover:text-[#F2FCE2] transition-colors ${
                  isActive("/admin") ? "text-[#6B8E23] font-semibold" : ""
                }`}
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/map-view"
              className={`hover:text-[#F2FCE2] transition-colors ${
                isActive("/map-view") ? "text-[#6B8E23] font-semibold" : ""
              }`}
            >
              Map View
            </Link>
            <Link
              to="/report"
              className={`hover:text-[#F2FCE2] transition-colors ${
                isActive("/report") ? "text-[#6B8E23] font-semibold" : ""
              }`}
            >
              Report
            </Link>

            {isAuthenticated && (
              <Link
                to="/leaderboard"
                className={`hover:text-[#F2FCE2] transition-colors ${
                  isActive("/leaderboard") ? "text-[#6B8E23] font-semibold" : ""
                }`}
              >
                Leaderboard
              </Link>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                variant="ghost"
                className="text-white hover:text-[#F2FCE2]"
                onClick={logout}
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login">
                  <button
                    variant="ghost"
                    className="text-white hover:text-[#F2FCE2]"
                  >
                    Login
                  </button>
                </Link>
                <Button 
                  className="bg-[#6B8E23] hover:bg-[#556B2F] text-white rounded-full px-6"
                  onClick={() => setRegisterDialogOpen(true)}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>

      </header>

      <RegisterTypeDialog 
          isOpen={registerDialogOpen}
          onOpenChange={setRegisterDialogOpen}
        />
    </>
    
  )
}

export default Navbar
