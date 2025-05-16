
import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { db, auth } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getLeaderboard } from "../utils/services";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (!userDoc.exists()) {
              navigate("/login");
            } 
            else {
              setUser({ id: userDoc.id, ...userDoc.data() });
          }
          } 
          catch (error) {
            console.error("Error checking admin role:", error);
          }
        }
      });
  
      return () => unsubscribe();
  }, [navigate]);

  const loadLeaderboard = async () => {

    try {
      const leaderboardData = await getLeaderboard();
      setLeaderboardData(leaderboardData);
      console.log("Leaderboard Data:", leaderboardData);
    } 
    catch (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } 
    finally {
      setLoading(false);
    }
    
  };
  
  useEffect(() => {
    loadLeaderboard();
  }, []);
  
  const getUserRank = () => {
    if (!user) return null;
    
    const userIndex = leaderboardData.findIndex(entry => entry.name === user.name);
    if (userIndex === -1) return null;
    
    return {
      rank: userIndex + 1,
      count: leaderboardData[userIndex].count
    };
  };
  
  const userRank = getUserRank();
  
  return (
    <div className="flex flex-col min-h-screen">
        <NavBar />
  
        <main className="flex-grow">
          <div className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Community Leaderboard</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See who's leading the charge in environmental reporting
              </p>
            </div>
            
            {user && userRank && (
              <Card className="mb-10 p-8 bg-gradient-to-r from-[#6B8E23] to-[#8DAA53] text-white">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-6">
                      <span className="text-2xl font-bold">{userRank.rank}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">Your Ranking</h3>
                      <p className="opacity-90">Keep submitting reports to climb the leaderboard!</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="block text-3xl font-bold">{userRank.count}</span>
                    <span className="text-white/80">Reports</span>
                  </div>
                </div>
              </Card>
            )}
            
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-4 text-left font-bold">Rank</th>
                      <th className="px-6 py-4 text-left font-bold">User</th>
                      <th className="px-6 py-4 text-center font-bold">Points</th>
                      <th className="px-6 py-4 text-center font-bold">Impact Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <tr 
                        key={index} 
                        className={`border-b ${user && entry.name === user.name ? 'bg-[#F8FAEF]' : ''}`}
                      >
                        <td className="px-6 py-4">
                          {index < 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                              ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}
                            >
                              {index + 1}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {entry.name}
                          {user && entry.name === user.name && (
                            <span className="ml-2 text-xs bg-[#6B8E23] text-white px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{entry.points}</td>
                        {/* <td className="px-6 py-4 text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-[#6B8E23] h-2.5 rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (entry.points / leaderboardData[0].points) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </td> */}

                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center">
                            <div className="relative w-12 h-12">
                              <svg className="transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-gray-300"
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="text-[#6B8E23]"
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeDasharray={`${Math.min(100, (entry.points / leaderboardData[0].points) * 100)}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                {Math.round((entry.points / leaderboardData[0].points) * 100)}%
                              </div>
                            </div>
                          </div>
                        </td>

                      </tr>
                    ))}
                    
                    {leaderboardData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No data available yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          
        </main>
  
        <Footer />
    </div>
    
  );
};

export default Leaderboard;
