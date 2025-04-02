import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
//http:localhost:5000/api/auth/login

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (validateForm()) {
      setIsLoading(true);

      try {
        const response = await fetch("https://crm-be.fly.dev/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token in localStorage
          localStorage.setItem("token", data.token);
          // Redirect to CRM dashboard
          navigate("/crm");
        } else {
          setLoginError(
            data.message || "Login failed. Please check your credentials."
          );
        }
      } catch (error) {
        setLoginError("Server error. Please try again later.");
        console.error("Login error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-gray-900 text-gray-100">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {loginError && (
          <div className="p-3 text-sm bg-red-900/50 text-red-200 rounded-md">
            {loginError}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 text-sm">
            <label htmlFor="email" className="block text-gray-400">
              Email
            </label>
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
            <label htmlFor="password" className="block text-gray-400">
              Password
            </label>
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
            <div className="flex justify-end text-xs text-gray-400">
              <Link
                to="/forgotpassword"
                className="cursor-pointer hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
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
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-center sm:px-6 text-gray-400">
          Don't have an account?
          <Link to="/signup" className="underline text-gray-100 ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;