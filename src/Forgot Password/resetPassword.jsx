import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

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

    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (validateForm()) {
      setIsLoading(true);

      try {
        const response = await fetch(
          `https://crm-be.fly.dev/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              newPassword: formData.newPassword,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setResetSuccess(
            data.message || "Password has been reset successfully!"
          );
          setFormData({
            newPassword: "",
            confirmPassword: "",
          });

          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setResetError(
            data.message || "Failed to reset password. Please try again."
          );
        }
      } catch (error) {
        setResetError("Server error. Please try again later.");
        console.error("Reset password error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-gray-900 text-gray-100">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>

        {resetError && (
          <div className="p-3 text-sm bg-red-900/50 text-red-200 rounded-md">
            {resetError}
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 text-sm bg-green-900/50 text-green-200 rounded-md">
            {resetSuccess}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 text-sm">
            <label htmlFor="newPassword" className="block text-gray-400">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.newPassword ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <label htmlFor="confirmPassword" className="block text-gray-400">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              className={`w-full px-4 py-3 rounded-md border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
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
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-center sm:px-6 text-gray-400">
            Remember your password?
            <a href="/" className="underline text-gray-100 ml-1">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
