import React, { useState } from "react";
import { useGameContext } from "../context/GameContext";
import { Dice } from "./Dice";
import { Coupon } from "../types";

export function RollDiceScreen() {
  const { setCurrentStep, addCoupon } = useGameContext();
  const [isRolling, setIsRolling] = useState(false);

  const handleRollDice = async () => {
    setIsRolling(true);

    // Simulate dice roll animation
    setTimeout(() => {
      setIsRolling(false);

      // Generate random coupon after dice roll
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        discount: 900,
        minOrder: 2000,
        validFrom: "01/01/2025",
        validTo: "31/12/2025",
        code: `DICE${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        isUsed: false,
      };

      addCoupon(newCoupon);
      setCurrentStep("couponReveal"); // Go to coupon reveal after generating coupon
    }, 2000);
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
          <Dice isRolling={isRolling} />
        </div>

        {/* Roll Dice Button */}
        <button
          onClick={handleRollDice}
          disabled={isRolling}
          className="w-full bg-red-600 text-white font-bold text-lg py-4 px-8 rounded-none hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isRolling ? "ROLLING..." : "ROLL DICE"}
        </button>
      </div>
    </div>
  );
}
