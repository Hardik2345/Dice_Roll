import React, { useState } from "react";
import { X } from "lucide-react";
import { useGameContext } from "../context/GameContext";

export function PhoneNumberModal() {
  const { setCurrentStep, setPhoneNumber } = useGameContext();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setCurrentStep("landing"); // Changed from 'rollDice' to 'landing'
  };

  const handleNext = () => {
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setError("");
    setPhoneNumber(phone);
    setCurrentStep("otpVerification");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      {/* Background Dice
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 opacity-20">
          <div className="w-full h-full bg-gray-300 rounded-lg border-2 border-gray-400 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 p-2">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
          </div>
        </div>
      </div> */}

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
            ENTER MOBILE NUMBER
          </h2>

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
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-none hover:bg-red-700 transition-colors"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}
