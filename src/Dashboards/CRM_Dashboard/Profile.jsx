import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileAvatar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          // If no token is found, redirect to login
          navigate('/');
          return;
        }
        
        const response = await fetch('https://crm-be.fly.dev/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Handle invalid token or other errors
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUserData({
          name: userData.name || 'User',
          email: userData.email || ''
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('crm_notifications');
    navigate('/');
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    // Redirect to forgot password page
    navigate('/forgotpassword');
    //http://localhost:5000/api/auth/forgot-password
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        className="ml-2 relative flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white overflow-hidden bg-gray-700"
        onClick={() => setShowProfileMenu(!showProfileMenu)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-6 w-6">
          <path fill="#787878" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/>
        </svg>
      </button>

      {/* Profile Menu Popup */}
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right z-50">
          <div className="flex flex-col justify-center p-6 shadow-md rounded-xl bg-gray-50 text-gray-800">
            {/* Smaller profile picture */}
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-300 flex items-center justify-center aspect-square">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-16 w-16">
                <path fill="#787878" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/>
              </svg>
            </div>
            <div className="space-y-4 text-center divide-y divide-gray-300">
              <div className="my-2 space-y-1">
                {isLoading ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Loading user data...</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold sm:text-2xl">{userData.name}</h2>
                    <p className="px-5 text-xs sm:text-base text-gray-600">{userData.email}</p>
                  </>
                )}
              </div>
              <div className="flex justify-center pt-2 space-x-4 align-center">
                {/* Added buttons */}
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;