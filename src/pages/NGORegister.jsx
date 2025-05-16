
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, User, Building, Upload, Info, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '../components/ui/alert-dialog';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import { serverTimestamp } from "firebase/firestore";

const NGORegister = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [description, setDescription] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [document, setDocument] = useState(null);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({
    orgName: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    regNumber: '',
    document: ''
  });

  const validateForm = () => {
    let valid = true;

    const newErrors = {
      orgName: '',
      contactName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      regNumber: '',
      document: ''
    };

    if (!orgName) {
      newErrors.orgName = 'Organization name is required';
      valid = false;
    }

    if (!contactName) {
      newErrors.contactName = 'Contact person name is required';
      valid = false;
    }

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } 
    else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } 
    else if (!/^\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
      valid = false;
    }

    if (!regNumber) {
      newErrors.regNumber = 'Registration number is required';
      valid = false;
    }

    if (!document) {
      newErrors.document = 'Please upload your NGO registration certificate';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } 
    else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } 
    else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (document.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          document: 'File size should not exceed 5MB'
        });
        return;
    }

    setErrors({
        ...errors,
        document: ''
    });
    
    setIsSubmitting(true);
    try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);   
    const user = userCredential.user;

    const uploadedUrl = await handleFileChange();

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: orgName,
        role: "ngo",
        description: description,
        regNum: regNumber,
        contactPerson: contactName,
        contactNo: phone,
        createdAt: serverTimestamp(),
        approvalStatus: "pending",
        docProofURL: uploadedUrl || "",
        points: 0,
    });
    
    setSuccessDialogOpen(true);
    
    setOrgName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setDescription('');
    setRegNumber('');
    setDocument(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    
    toast.success("Registration submitted successfully!");
    } 
    catch (error) {
        toast.error('Registration failed. Please try again.');
        console.error('NGO Registration error:', error);
    } 
    finally {
        setIsSubmitting(false);
    }
    
  };

  const handleFileChange = async () => {
    if (!document) return; 

    const formData = new FormData();
    formData.append("file", document);
    formData.append("upload_preset", "clear-view-preset"); 
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME); 

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
        });

        const data = await response.json();
        console.log("Cloudinary response:", data.secure_url, data.url, data);
        toast.success("Image uploaded successfully!");
        return data.secure_url;
    } 
    catch (err) {
        console.error("Cloudinary upload error:", err);
        toast.error("Failed to upload image.");
        return null;
    }
      
    
  };

  return (

    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-grow">
        <div className="py-12 px-6 md:px-12 flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-md overflow-hidden">
                <div className="text-center p-6 border-b">
                <h2 className="text-2xl font-bold text-[#556B2F]">Register as an Organization/NGO</h2>
                {/* <p className="text-sm text-gray-500 mt-2">Join Clear View to collaborate on environmental initiatives</p> */}
                </div>
                <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="orgName" className="text-sm font-medium">
                        Organization Name*
                        </label>
                        <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="orgName"
                            type="text"
                            placeholder="Organization Name"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                        />
                        </div>
                        {errors.orgName && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.orgName}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="contactName" className="text-sm font-medium">
                        Contact Person*
                        </label>
                        <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="contactName"
                            type="text"
                            placeholder="Contact Person's Name"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                        />
                        </div>
                        {errors.contactName && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.contactName}</p>
                        )}
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                        Email*
                        </label>
                        <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="email"
                            type="email"
                            placeholder="organization@example.com"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        </div>
                        {errors.email && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.email}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                        Phone Number*
                        </label>
                        <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="phone"
                            type="tel"
                            placeholder="Phone Number"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        </div>
                        {errors.phone && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.phone}</p>
                        )}
                    </div>
                    </div>

                    <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                        Organization Description
                    </label>
                    <textarea
                        id="description"
                        placeholder="Brief description of your organization's mission and activities"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="regNumber" className="text-sm font-medium">
                        NGO Registration Number*
                        </label>
                        <div className="relative">
                        <Info className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="regNumber"
                            type="text"
                            placeholder="Registration Number"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                        />
                        </div>
                        {errors.regNumber && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.regNumber}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="document" className="text-sm font-medium">
                        Registration Certificate*
                        </label>
                        <div className="relative">
                        <label 
                            htmlFor="document"
                            className="flex items-center gap-3 w-full p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                        >
                            <Upload className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-500 truncate">
                            {document ? document.name : 'Upload certificate (PDF, JPG, PNG)'}
                            </span>
                        </label>
                        <input
                            id="document"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => setDocument(e.target.files[0])}
                        />
                        </div>
                        <p className="text-xs text-gray-500">Max file size: 5MB</p>
                        {errors.document && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.document}</p>
                        )}
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                        Password*
                        </label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5"
                        >
                            {showPassword ? (
                            <Eye className="h-5 w-5 text-gray-400" />
                            ) : (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                        </div>
                        {errors.password && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.password}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm Password*
                        </label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-[#6B8E23]"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5"
                        >
                            {showConfirmPassword ? (
                            <Eye className="h-5 w-5 text-gray-400" />
                            ) : (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                        </div>
                        {errors.confirmPassword && (
                        <p className="text-sm font-medium text-red-500 mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>
                    </div>
                    
                    <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full p-3 bg-[#6B8E23] hover:bg-[#556B2F] text-white rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting Application...
                        </>
                        ) : (
                        'Submit Application'
                        )}
                    </button>
                    </div>
                </form>
                </div>
                <div className="p-6 border-t text-center">
                <div className="text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-[#6B8E23] hover:text-[#556B2F] transition-colors">
                    Sign in
                    </Link>
                </div>
                </div>
            </div>

            <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl text-center">Application Submitted</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                    <div className="flex justify-center my-4">
                        <div className="bg-green-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        </div>
                    </div>
                    <p className="text-base">
                        Your NGO registration has been submitted successfully. Our team will review your application and verification documents.
                    </p>
                    <p className="mt-4 text-sm text-gray-600">
                        You will receive an email notification once your application is approved.
                    </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-center mt-4">
                    <Link to="/login">
                    <button className="px-4 py-2 bg-[#6B8E23] hover:bg-[#556B2F] text-white rounded-md transition-colors">
                        Return to Login
                    </button>
                    </Link>
                </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </main>

      <Footer />
    </div>


    
  );
};

export default NGORegister;