import React, { useState } from "react";
import { X } from "lucide-react";
import { useGameContext } from "../context/GameContext";
import api from "../services/api";

export function PhoneNumberModal() {
  const { setCurrentStep, setPhoneNumber, setUserName } = useGameContext();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCurrentStep("landing");
  };

  const handleNext = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Call backend to send OTP
      const response = await api.sendOTP({
        name,
        mobile: phone,
        generateOTPAt: Date.now,
      });

      if (response.data.success) {
        // Store phone number and name in context
        setPhoneNumber(phone);
        setUserName(name);
        setCurrentStep("otpVerification");
      }
    } catch (error) {
      console.error("Send OTP error:", error);

      if (error.response?.data?.alreadyPlayed) {
        setError("You have already played this game!");
      } else {
        setError(
          error.response?.data?.error || "Failed to send OTP. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      {/* Modal */}
      <div className="bg-white w-full max-w-md mx-4 mb-4 rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ENTER YOUR DETAILS
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NAME*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-3 border border-gray-300 rounded-none outline-none text-gray-900 focus:border-red-600"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PHONE NUMBER*
            </label>
            <div className="flex border border-gray-300 rounded-none overflow-hidden">
              <div className="bg-gray-50 px-3 py-3 border-r border-gray-300 text-gray-700 font-medium">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Mobile number"
                className="flex-1 px-3 py-3 outline-none text-gray-900"
                maxLength={10}
              />
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SENDING OTP..." : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
