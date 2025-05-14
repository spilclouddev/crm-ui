import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name) {
      newErrors.name = "Name is required";
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");
    
    if (validateForm()) {
      setIsLoading(true);
      //http://localhost:5000/api/auth/signup
      
      try {
  const response = await fetch(`${config.API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })
  });
        
        const data = await response.json();
        
        if (response.ok) {
          setSignupSuccess("Account created successfully! Redirecting to login...");
          // Clear form
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
          });
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setSignupError(data.message || "Registration failed. Please try again.");
        }
      } catch (error) {
        setSignupError("Server error. Please try again later.");
        console.error("Signup error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-gray-900 text-gray-100">
        <h1 className="text-2xl font-bold text-center">Create an Account</h1>
        
        {signupError && (
          <div className="p-3 text-sm bg-red-900/50 text-red-200 rounded-md">
            {signupError}
          </div>
        )}
        
        {signupSuccess && (
          <div className="p-3 text-sm bg-green-900/50 text-green-200 rounded-md">
            {signupSuccess}
          </div>
        )}
        
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 text-sm">
            <label htmlFor="name" className="block text-gray-400">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.name ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <label htmlFor="email" className="block text-gray-400">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.email ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <label htmlFor="password" className="block text-gray-400">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.password ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <label htmlFor="confirmPassword" className="block text-gray-400">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`block w-full p-3 text-center rounded-sm text-gray-900 ${
              isLoading 
              ? "bg-violet-300 cursor-not-allowed" 
              : "bg-violet-400 hover:bg-violet-500"
            } transition duration-300`}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        
                  {/* Social login section removed to match updated login component */}
        
        <p className="text-xs text-center sm:px-6 text-gray-400">
          Already have an account?
          <a href="/" className="underline text-gray-100 ml-1">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;