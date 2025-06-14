import React from "react";
import { useGameContext } from "../context/GameContext";
import { Dice } from "./Dice";

export function LandingPage() {
  const { setCurrentStep } = useGameContext();

  const handlePlayGame = () => {
    setCurrentStep("phoneNumber"); // Changed from "rollDice" to "phoneNumber"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-32 right-16 w-16 h-16 border border-white/20 rounded-full"></div>
        <div className="absolute top-1/3 right-8 w-12 h-12 border border-white/20 rounded-full"></div>
      </div>

      <div className="text-center max-w-sm mx-auto z-10">
        {/* Subheading */}
        <p className="text-white/90 text-lg font-medium mb-4 tracking-wide">
          Roll The Dice, Smell The Surprise!
        </p>

        {/* Main Heading */}
        <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-8">
          UNLOCK A MYSTERY DISCOUNT
          <br />
          ON YOUR NEXT SIGNATURE
          <br />
          SCENT
        </h1>

        {/* How it works link */}
        <div className="flex items-center justify-center mb-8">
          <button className="text-white/80 text-sm flex items-center gap-2 hover:text-white transition-colors">
            <span className="w-5 h-5 border border-white/60 rounded-full flex items-center justify-center text-xs">
              ?
            </span>
            HOW IT WORKS?
          </button>
        </div>

        {/* Dice */}
        <div className="mb-12">
          <Dice showSparkles />
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayGame}
          className="w-full bg-white text-red-600 font-bold text-lg py-4 px-8 rounded-none hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          PLAY THE GAME
        </button>
      </div>
    </div>
  );
}
