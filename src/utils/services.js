import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "sonner";

export const getPendingReports = async () => {
  const q = query(collection(db, "reports"), where("status", "==", "pending"));
  const querySnapshot = await getDocs(q);

  const reports = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return reports;
};

export const getNewNGOInvites = async () => {
  const usersRef = collection(db, "users");
  
  const q = query(usersRef, where("approvalStatus", "==", "pending"), where("role", "==", "ngo"));
  const querySnapshot = await getDocs(q);

  const newNGOs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return newNGOs;
};

export const getAllReports = async () => {
  const querySnapshot = await getDocs(collection(db, "reports"));

  const reports = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return reports;
};


export const updateReportStatus = async (reportId, newStatus) => {
  const reportRef = doc(db, "reports", reportId);

  try {
    await updateDoc(reportRef, {
      status: newStatus,
    });
    console.log(`Report ${reportId} status updated to ${newStatus}`);
    toast.success(`Report status updated to ${newStatus}`);
    return true;
  } 
  catch (error) {
    console.error("Error updating report status:", error);
    toast.error("Error updating report status.");
    return null;
  }
};


export const incidentTypes = [
  'Water Discharge',
  'Air Emission',
  'Waste Dumping',
  'Oil Spill',
  'Chemical Leak',
  'Noise Pollution',
  'Deforestation',
  'Illegal Mining',
  'Soil Contamination',
  'Other'
];

export const getNGObyId = async (ngoId) => {
  const ngoRef = doc(db, "users", ngoId);
  const ngoSnap = await getDoc(ngoRef);

  if (ngoSnap.exists()) {
    return { id: ngoSnap.id, ...ngoSnap.data() };
  } 
  else {
    console.error("Error fetching NGO details", error);
  }
};

export const getReportById = async (reportId) => {
  const reportRef = doc(db, "reports", reportId);
  const reportSnap = await getDoc(reportRef);

  if (reportSnap.exists()) {
    return { id: reportSnap.id, ...reportSnap.data() };
  } 
  else {
    console.error("Error fetching report details", error);
  }
};

export const getReportsByUser = (userId) => {
  return reports.filter(report => report.userId === userId);
};

export const submitReport = (reportData) => {
  const id = (reports.length + 1).toString();
  const newReport = {
    id,
    ...reportData,
    status: 'Under Review',
    date: new Date().toISOString().slice(0, 10),
  };
  reports.push(newReport);
  return newReport;
};
