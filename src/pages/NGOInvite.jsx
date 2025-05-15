import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
          DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Separator } from '../components/ui/separator';
import { MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import { getNewNGOInvites, getNGObyId } from "../utils/services";
import { Badge } from '../components/ui/badge';


function NGOInvite() {
    const navigate = useNavigate();
    const [newInvites, setNewInvites] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const newNGO = async () => {
        try {
            const newNGO = await getNewNGOInvites();
            setNewInvites(newNGO);
            console.log("All invites:", newNGO);
        } 
        catch (error) {
            console.error("Error loading invites:", error);
            toast.error("Failed to load invites");
        } 
        finally {
        setLoading(false);
        }
    };
    
    useEffect(() => {
        newNGO();
    }, []);

    const updateNGOStatus = async (ngoId, newStatus) => {
        const ngoRef = doc(db, "users", ngoId);
    
        try {
            await updateDoc(ngoRef, {
                approvalStatus: newStatus,
            });
            toast.success(`NGO status updated to ${newStatus}`);
            return true;
        } 
        catch (error) {
            toast.error("Error updating NGO status.");
            return null;
        }
    };

    const changeStatus = async (ngoId, newStatus) => {
        const updatedNGO = await updateNGOStatus(ngoId, newStatus);
        if (updatedNGO) {
            newNGO();
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
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
            <h2 className="text-xl font-medium">Loading new invites...</h2>
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
                    <h1 className="text-3xl font-bold mb-6">NGO Verification</h1>

                    <div className="bg-white rounded-lg border shadow-sm mb-8">
                        <div className="p-6">
                        <h2 className="text-xl font-semibold mb-2">New NGO Invites</h2>
                        <p className="text-muted-foreground">Manage and approve NGOs</p>
                        </div>
                        <Separator />
                        <div className="p-6">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Registration Number</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Contact Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {newInvites.length > 0 ? (
                                newInvites.map((ngo) => (
                                <TableRow key={ngo.id}>
                                    <TableCell className="font-medium">{ngo.name}</TableCell>
                                    <TableCell>{ngo.regNum}</TableCell>
                                    <TableCell>{ngo.contactPerson}</TableCell>
                                    <TableCell>
                                    {ngo.contactNo}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(ngo.approvalStatus)}>
                                        {ngo.approvalStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem className="cursor-pointer" 
                                                    onClick={() => getNGObyId(ngo.id)
                                                    .then((ngoDetails) => { console.log(ngoDetails) })}> 
                                                <Eye className="mr-2 h-4 w-4" />
                                                View details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                            <DropdownMenuItem 
                                                onClick={() => changeStatus(ngo.id, 'approved')}
                                                className="cursor-pointer"
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => changeStatus(ngo.id, 'rejected')}
                                                className="cursor-pointer"
                                            >
                                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                                Reject
                                            </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                    No new NGO invites found
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </div>
                    </div>
                </div>
            </div>`
        </main>

        <Footer />
        </div>
    )
}

export default NGOInvite
