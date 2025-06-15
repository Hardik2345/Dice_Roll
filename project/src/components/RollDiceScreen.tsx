import React, { useState } from "react";
import { useGameContext } from "../context/GameContext";
import { Dice } from "./Dice";
import { Coupon } from "../types";
import api from "../services/api";

export function RollDiceScreen() {
  const { setCurrentStep, addCoupon } = useGameContext();
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const handleRollDice = async () => {
    setIsRolling(true);
    setShowResult(false);
    setError("");

    try {
      // Call backend to roll dice
      const response = await api.rollDice();

      if (response.data.success) {
        const result = response.data.diceResult;
        setDiceResult(result);
        setDiscountInfo(response.data);

        // Show dice rolling animation
        setTimeout(() => {
          setIsRolling(false);
          setShowResult(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Roll dice error:", error);
      setIsRolling(false);

      // Narrow error to type with response property
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { status?: number; data?: any } };

        if (err.response?.status === 401) {
          setError("Session expired. Please start again.");
          setTimeout(() => {
            setCurrentStep("landing");
          }, 2000);
        } else if (err.response?.data?.alreadyPlayed) {
          setError("You have already played this game!");
          setTimeout(() => {
            setCurrentStep("landing");
          }, 3000);
        } else {
          setError("Failed to roll dice. Please try again.");
        }
      } else {
        setError("Failed to roll dice. Please try again.");
      }
    }
  };

  const handleContinue = () => {
    if (!discountInfo) return;

    // Create coupon from backend response
    const newCoupon: Coupon = {
      id: Date.now().toString(),
      discount: parseInt(discountInfo.discount) * 10, // Convert percentage to amount
      minOrder: 2000,
      validFrom: new Date().toLocaleDateString("en-GB"),
      validTo: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-GB"),
      code: discountInfo.discountCode,
      isUsed: false,
      shopifyUrl: discountInfo.shopifyUrl,
    };

    addCoupon(newCoupon);
    setCurrentStep("couponReveal");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center max-w-sm mx-auto">
        {/* Subheading */}
        <p className="text-gray-600 text-lg font-medium mb-2">
          Ready, Set, Go!
        </p>

        {/* Main Heading */}
        <h1 className="text-gray-900 text-3xl md:text-4xl font-bold mb-12 tracking-tight">
          CLICK TO ROLL DICE
        </h1>

        {/* Dice */}
        <div className="mb-16">
          <Dice isRolling={isRolling} result={diceResult || undefined} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Result Display */}
        {showResult && diceResult && discountInfo && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200">
              <p className="text-2xl font-bold text-gray-800 mb-2">
                You rolled a {diceResult}!
              </p>
              <p className="text-gray-600 mb-3">
                {diceResult === 6
                  ? "🎉 Lucky you! Maximum score!"
                  : diceResult >= 4
                  ? "Great roll! Nice reward coming..."
                  : "Nice try! Every roll wins a prize!"}
              </p>
              <p className="text-lg font-semibold text-red-600">
                {discountInfo.message}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Code: {discountInfo.discountCode}
              </p>
              {discountInfo.isShopifyCode && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Valid Shopify discount code generated
                </p>
              )}
            </div>
          </div>
        )}

        {/* Roll Dice Button / Continue Button */}
        {!showResult ? (
          <button
            onClick={handleRollDice}
            disabled={isRolling}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 px-8 rounded-none hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRolling ? "ROLLING..." : "ROLL DICE"}
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="w-full bg-red-600 text-white font-bold text-lg py-4 px-8 rounded-none hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg animate-slide-up"
          >
            REVEAL MY REWARD
          </button>
        )}
      </div>
    </div>
  );
}
