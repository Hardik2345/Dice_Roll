import React, { useState } from "react";
import { useGameContext } from "../context/GameContext";
import { Dice } from "./Dice";
import { Coupon } from "../types";

export function RollDiceScreen() {
  const { setCurrentStep, addCoupon } = useGameContext();
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const handleRollDice = async () => {
    setIsRolling(true);
    setDiceResult(null);
  };

  const handleRollComplete = (result: number) => {
    setIsRolling(false);
    setDiceResult(result);

    // Generate coupon based on dice result
    setTimeout(() => {
      const discountAmounts = [100, 200, 300, 500, 700, 900];
      const minOrderAmounts = [500, 1000, 1500, 2000, 2500, 3000];
      
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        discount: discountAmounts[result - 1],
        minOrder: minOrderAmounts[result - 1],
        validFrom: "01/01/2025",
        validTo: "31/12/2025",
        code: `DICE${result}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        isUsed: false,
      };

      addCoupon(newCoupon);
      setCurrentStep("couponReveal");
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
        <div className="mb-20">
          <Dice 
            isRolling={isRolling} 
            onRollComplete={handleRollComplete}
          />
        </div>

        {/* Roll Dice Button */}
        <button
          onClick={handleRollDice}
          disabled={isRolling}
          className="w-full bg-red-600 text-white font-bold text-lg py-4 px-8 rounded-none hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isRolling ? "ROLLING..." : diceResult ? "ROLL AGAIN" : "ROLL DICE"}
        </button>

        {diceResult && !isRolling && (
          <p className="text-gray-600 text-sm mt-4">
            Generating your coupon...
          </p>
        )}
      </div>
    </div>
  );
}