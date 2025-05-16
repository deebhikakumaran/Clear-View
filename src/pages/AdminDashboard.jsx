import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAllReports, getPendingReports, getReportById } from "../utils/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
          DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportDetailDialog from '../components/ReportDetailDialog';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingReports, setPendingReports] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("Please log in to access the admin dashboard.");
        return navigate("/login");
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
          toast.error("Access denied. Admins only.");
          return navigate("/login");
        }
      } 
      catch (err) {
        console.error("Error checking user role:", err);
        toast.error("An error occurred while checking access.");
        return navigate("/login");
      }
    });

    return () => unsubscribe();

  }, [navigate]);

  const loadReports = async () => {
      try {
        const pendingReports = await getPendingReports();
        setPendingReports(pendingReports);
        const allReports = await getAllReports();
        setReports(allReports);
        console.log("All Reports:", allReports);
      } 
      catch (error) {
        console.error("Error loading reports:", error);
        toast.error("Failed to load reports");
      } 
      finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      // case 'verified':
      //   return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateUserPoints = async (userId, points) => {
    const userRef = doc(db, "users", userId);

    console.log('Before updating user points', userId)

    try {
      await updateDoc(userRef, {
        points: points,
      });

      console.log('User points updated')
      return true;
      
    } 
    catch (error) {
      console.error("Error updating user points:", error);
      toast.error("Error updating user points.");
      return null;
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    const reportRef = doc(db, "reports", reportId);
  
    try {
      await updateDoc(reportRef, {
        status: newStatus,
      });

      console.log('Updated status.......')


      const reportSnap = await getDoc(reportRef);

      console.log('reportSNAP', reportSnap)

      if (reportSnap.exists() && reportSnap.data()?.user_id !== "anonymous") {
        const userId = reportSnap.data().user_id;
        const isPhotoUpload = reportSnap.data().photo_url;

        let updatedUser = ""

        if(isPhotoUpload){
          updatedUser = await updateUserPoints(userId, 20);
        }
        else{
          updatedUser = await updateUserPoints(userId, 10);
        }
        
        if (updatedUser) {
          console.log('USER POINTS UPDATED')
          toast.success("User points is updated");
        }
      } 
      
      toast.success(`Report status updated to ${newStatus}`);
      return true;
    } 
    catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Error updating report status.");
      return null;
    }
  };

  const changeStatus = async (reportId, newStatus) => {
    console.log('Changing.......')
    const updatedReport = await updateReportStatus(reportId, newStatus);
    if (updatedReport) {
      loadReports();
    }
  };


  const countsByStatus = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});


  if (loading) {
    return (
      <div className="py-12 px-6 md:px-12 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-[#6B8E23] mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 className="text-xl font-medium">Loading reports...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-grow">
        <div className="py-12 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Reports</CardTitle>
                  <CardDescription className="text-muted-foreground">All submitted reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{reports.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Verified</CardTitle>
                  <CardDescription className="text-muted-foreground">Confirmed reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{countsByStatus['approved']+countsByStatus['rejected'] || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Under Review</CardTitle>
                  <CardDescription className="text-muted-foreground">Reports being investigated</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{countsByStatus['pending'] || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resolved</CardTitle>
                  <CardDescription className="text-muted-foreground">Addressed reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{countsByStatus['approved'] || 0}</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border shadow-sm mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">Recent Reports</h2>
                <p className="text-muted-foreground">Manage and update report statuses</p>
              </div>
              <Separator />
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>View Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.length > 0 ? (
                      pendingReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.type}</TableCell>
                          <TableCell>{report.location.latitude.toFixed(4)}°{report.location.latitude > 0 ? 'N' : 'S'}, {report.location.longitude.toFixed(4)}°{report.location.longitude > 0 ? 'E' : 'W'}</TableCell>
                          <TableCell>{report.user_id}</TableCell>
                          <TableCell>{new Date(report.timestamp.seconds * 1000).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  {/* <MoreHorizontal className="h-4 w-4" /> */}
                                  Change Status
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* <DropdownMenuLabel>Change Status</DropdownMenuLabel> */}
                                <DropdownMenuItem 
                                  onClick={() => changeStatus(report.id, 'approved')}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => changeStatus(report.id, 'rejected')}
                                  className="cursor-pointer"
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>                     
                            <ReportDetailDialog report={report} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No reports found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
