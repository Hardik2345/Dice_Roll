import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { useGameContext } from "../context/GameContext";
import api from "../services/api";

export function OtpVerificationModal() {
  const { setCurrentStep, setVerified, state } = useGameContext();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError("");

    try {
      // Get name from context
      const response = await api.sendOTP({
        name: state.userName || "User",
        mobile: state.phoneNumber,
      });

      if (response.data.success) {
        // Reset OTP fields
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        // Show success message (optional)
        console.log("OTP resent successfully");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleStartGame = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Call backend to verify OTP
      const response = await api.verifyOTP(otpValue);

      if (response.data.success) {
        setVerified(true);
        setCurrentStep("rollDice");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);

      if (error.response?.status === 400) {
        if (error.response.data.error.includes("Session expired")) {
          setError("Session expired. Please start again.");
          setTimeout(() => {
            setCurrentStep("phoneNumber");
          }, 2000);
        } else {
          setError("Invalid OTP. Please try again.");
        }
      } else {
        setError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
            ALMOST THERE
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              ENTER YOUR 6 DIGIT OTP*
            </label>
            <p className="text-xs text-gray-500 text-center mb-4">
              (Use OTP: 123456 for testing)
            </p>
            <div className="flex gap-2 justify-center mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 border-2 border-gray-300 text-center text-xl font-bold outline-none focus:border-red-600 transition-colors"
                  maxLength={1}
                  disabled={loading}
                />
              ))}
            </div>

            <button
              onClick={handleResendOtp}
              disabled={resending || loading}
              className="block mx-auto text-red-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "RESENDING..." : "RESEND OTP"}
            </button>

            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "VERIFYING..." : "START GAME"}
          </button>
        </div>
      </div>
    </div>
  );
}
