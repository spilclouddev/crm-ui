import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (validateEmail()) {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuccess(data.message || "Password reset link sent to your email.");
          // Clear form
          setEmail("");
        } else {
          setError(
            data.message || "Failed to send reset link. Please try again."
          );
        }
      } catch (error) {
        setError("Server error. Please try again later.");
        console.error("Forgot password error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-gray-900 text-gray-100">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>

        {error && (
          <div className="p-3 text-sm bg-red-900/50 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm bg-green-900/50 text-green-200 rounded-md">
            {success}
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
              value={email}
              onChange={handleChange}
              placeholder="Enter your registered email"
              className={`w-full px-4 py-3 rounded-md border ${
                error ? "border-red-500" : "border-gray-700"
              } bg-gray-900 text-gray-100 focus:border-violet-400`}
            />
            {error && error.includes("Email") && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <p className="text-sm text-gray-400">
            Enter your registered email address and we'll send you a link to
            reset your password.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className={`block w-full p-3 text-center rounded-sm text-gray-900 ${
              isLoading
                ? "bg-violet-300 cursor-not-allowed"
                : "bg-violet-400 hover:bg-violet-500"
            } transition duration-300`}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-center sm:px-6 text-gray-400">
            Remember your password?
            <a href="/login" className="underline text-gray-100 ml-1">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
