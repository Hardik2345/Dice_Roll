import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { useGameContext } from "../context/GameContext";
// import { Coupon } from "../types";

export function OtpVerificationModal() {
  const { setCurrentStep, setVerified, state } = useGameContext();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleClose = () => {
    setCurrentStep("phoneNumber");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    // Simulate OTP resend
    console.log("Resending OTP to:", state.phoneNumber);
  };

  const handleStartGame = () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 4) {
      setError("Please enter complete 4-digit OTP");
      return;
    }

    // Simulate OTP verification
    if (otpValue === "1234") {
      setError("");
      setVerified(true);

      // Changed: Now go to rollDice instead of generating coupon and going to couponReveal
      setCurrentStep("rollDice");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      {/* Background Dice with sparkles */}
      {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
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
          <div className="absolute -top-4 -left-4 text-white text-xl animate-pulse">
            ✨
          </div>
          <div className="absolute -top-6 -right-2 text-white text-lg animate-bounce delay-300">
            ✨
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
            ALMOST THERE
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              ENTER YOUR 4 DIGIT OTP*
            </label>
            <div className="flex gap-3 justify-center mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 border-2 border-gray-300 text-center text-xl font-bold outline-none focus:border-red-600 transition-colors"
                  maxLength={1}
                />
              ))}
            </div>

            <button
              onClick={handleResendOtp}
              className="block mx-auto text-red-600 font-medium hover:underline"
            >
              RESEND OTP
            </button>

            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-none hover:bg-red-700 transition-colors"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}
