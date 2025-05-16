import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';

const UserDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          toast.error("Please log in to access the user dashboard.");
          return navigate("/login");
        }
  
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists() || userDoc.data()?.role === "admin") {
            toast.error("Access denied. Users only.");
            return navigate("/login");
          }

          if (!user.uid || user.uid !== id) {
            toast.error("Access denied.");
            return navigate("/login");
          }

          setUser({ id: userDoc.id, ...userDoc.data() });
        } 
        catch (err) {
          console.error("Error checking user role:", err);
          toast.error("An error occurred while checking access.");
          return navigate("/login");
        }
      });
  
      return () => unsubscribe();
  
  }, [navigate, id]);

  const loadReports = async () => {
      try {
        if (!user?.uid) return;

        const q = query(collection(db, "reports"), where("user_id", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const userReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReports(userReports);
      } 
      catch (error) {
        console.error("Error loading reports:", error);
        toast.error("Failed to load reports");
      } 
  };
  

  useEffect(() => {
    loadReports();
  }, [user?.uid]);
  
  if (!user) {
    return (
      <div className="py-12 px-6 md:px-12 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-[#6B8E23] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-medium">Loading profile...</h2>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'forwarded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
        <NavBar />
  
        <main className="flex-grow">
          <div className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="p-8">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-[#F8FAEF] rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-[#6B8E23]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                    <p className="text-gray-500 mb-4">{user.uid}</p>
                    
                    <div className="bg-[#F8FAEF] text-[#6B8E23] rounded-full px-4 py-1 font-medium text-sm mb-6">
                      {user.role === 'admin' ? 'Administrator' : 'Community Member'}
                    </div>
                    
                    <div className="w-full border-t border-gray-200 pt-6 mt-2">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total Points:</span>
                        <span className="font-medium text-xl">{user.points}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Reports Submitted:</span>
                        <span className="font-medium text-xl">{reports.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-medium text-xl">
                          {new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-8 bg-[#6B8E23] hover:bg-[#556B2F] text-white"
                      onClick={() => navigate('/report')}
                    >
                      Submit New Report
                    </Button>
                  </div>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-6">Your Reports</h3>
                
                {reports.length === 0 ? (
                  <Card className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-xl font-medium mb-2">No Reports Yet</h4>
                    <p className="text-gray-500 mb-6">
                      You haven't submitted any pollution reports yet.
                    </p>
                    <Button 
                      className="bg-[#6B8E23] hover:bg-[#556B2F] text-white"
                      onClick={() => navigate('/report')}
                    >
                      Submit Your First Report
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <Card key={report.id} className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg">{report.type}</h4>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{report.description}</p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Submitted on: {new Date(report.timestamp.seconds * 1000).toLocaleDateString()}</span>
                          <span>Location: {report.location.latitude.toFixed(4)}°{report.location.latitude > 0 ? 'N' : 'S'}, {report.location.longitude.toFixed(4)}°{report.location.longitude > 0 ? 'E' : 'W'}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </main>
  
        <Footer />
    </div>
    
  );
};

export default UserDashboard;