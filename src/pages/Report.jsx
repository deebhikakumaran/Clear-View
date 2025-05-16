
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Camera, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from "../config/firebase";
import { collection, addDoc, GeoPoint, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { incidentTypes } from '../utils/services';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import { serverTimestamp } from "firebase/firestore";

const Report = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);


  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUpload, setFileUpload] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    type: '',
    description: ''
  });

  const [errors, setErrors] = useState({
    type: '',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
            toast.error("Admin users cannot submit reports.");
            navigate("/admin");
          } 
          else {
            setUser({ id: userDoc.id, ...userDoc.data() });
            setIsAdmin(false);
          }
        } 
        catch (error) {
          console.error("Error checking admin role:", error);
        }
      }
      setCheckingRole(false);
    });

    return () => unsubscribe();
  }, [navigate]);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Please enable location services in your browser.');
        }
      );
    } 
    else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      type: '',
      description: '',
    };
    
    let isValid = true;

    if (!formData.type) {
      newErrors.type = 'Please select a pollution type';
      isValid = false;
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
      isValid = false;
    } 
    else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    } 
    else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleImageUpload = async () => {
    if (!fileUpload) return; 

    const formData = new FormData();
    formData.append("file", fileUpload);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!location) {
      toast.error("Location data is required. Please enable location services.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reportLocation = new GeoPoint(location.latitude, location.longitude);
      const uploadedUrl = await handleImageUpload();

      const reportData = {
        type: formData.type,
        description: formData.description,
        photo_url: uploadedUrl || "",
        location: reportLocation,
        user_id: auth?.currentUser?.uid ?? "anonymous",
        timestamp: serverTimestamp(),
        status: "pending",
      };

      await addDoc(collection(db, "reports"), reportData);
            
      setFormData({ type: '', description: '' });
      setFileUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success("Report submitted successfully!", {
        description: "Thank you for contributing to our environmental data.",
      });

      navigate('/')
    } 
    catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Failed to submit report. Please try again.");
    } 
    finally {
      setIsSubmitting(false);
    }
  };


  if (checkingRole) return null; 
  if (isAdmin) return null;     


  return (

    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-grow">
        <div className="min-h-screen bg-gradient-to-b from-[#F2FCE2] to-white py-12 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#556B2F] mb-2">Report Environmental Issue</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Help us track and address pollution in your community.
              </p>
            </div>
            
            <div className="bg-white border border-[#F2FCE2] rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#6B8E23]/10 to-[#F2FCE2]/20 border-b border-[#F2FCE2] p-6">
                <h2 className="text-2xl font-bold text-[#556B2F] flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6 text-[#6B8E23]" />
                  Submit a Pollution Report
                </h2>
                <p className="text-gray-600 mt-1">
                  Provide details about the environmental issue you've observed. All reports are reviewed by our team.
                </p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="type" className="font-medium block">Pollution Type</label>
                    <select 
                      id="type"
                      name="type"
                      className="w-full p-2 border border-[#6B8E23]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23]/30"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select type of pollution</option>
                      {incidentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-sm font-medium text-red-500 mt-1">{errors.type}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="font-medium block">Description</label>
                    <textarea 
                      id="description"
                      name="description"
                      placeholder="Describe the pollution issue in detail..." 
                      className="w-full min-h-[120px] p-2 border border-[#6B8E23]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8E23]/30"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                    {errors.description && (
                      <p className="text-sm font-medium text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-medium flex items-center block">
                      <Camera className="mr-2 h-4 w-4" />
                      Photo Evidence (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={(e) => setFileUpload(e.target.files[0])}
                      className="w-full cursor-pointer border border-[#6B8E23]/30 rounded-md p-2"
                    />
                    
                    {fileUpload && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Preview:</p>
                        <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden border border-[#F2FCE2]">
                          <img 
                            src={URL.createObjectURL(fileUpload)} 
                            alt="Selected" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-medium flex items-center block">
                      <MapPin className="mr-2 h-4 w-4" />
                      Location
                    </label>
                    {location ? (
                      <div className="bg-[#F2FCE2]/50 rounded-lg p-4 border border-[#6B8E23]/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Your coordinates:</span>
                          <span className="font-mono text-sm bg-white px-3 py-1 rounded-md shadow-sm border border-[#6B8E23]/20">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    ) : locationError ? (
                      <div className="bg-red-50 text-red-700 rounded-lg p-4 border border-red-200 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        <span className="text-sm">{locationError}</span>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 text-yellow-700 rounded-lg p-4 border border-yellow-200 flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Getting your location...
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !location}
                    className="w-full bg-[#6B8E23] hover:bg-[#556B2F] text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting Report...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </form>
              </div>
              
              <div className="flex flex-col space-y-4 bg-gray-50 border-t border-[#F2FCE2] p-6">
                <div className="text-sm text-gray-600 w-full">
                  <div className="flex items-center mb-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-[#6B8E23]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Your report will be reviewed by our team within 24-48 hours
                  </div>
                  <div className="flex items-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-[#6B8E23]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reports with evidence help us take appropriate action faster
                  </div>
                </div>
                
                <div className="w-full pt-2 border-t border-[#F2FCE2]/50">
                  <div className="text-sm text-gray-500">
                    {user ? (
                      <span className="flex items-center">
                        Reporting as: <span className="font-semibold ml-1 text-[#556B2F]">{user.name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-between">
                        <span>Reporting anonymously</span>
                        <a href="/login" className="text-[#6B8E23] hover:underline font-medium">Login to track your reports</a>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Thank you for helping make our community cleaner and healthier.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>

  );
};

export default Report;
