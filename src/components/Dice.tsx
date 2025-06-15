import React, { useState, useEffect } from "react";

interface DiceProps {
  isRolling?: boolean;
  size?: "small" | "medium" | "large";
  showSparkles?: boolean;
  finalValue?: number;
  onRollComplete?: (value: number) => void;
}

export function Dice({
  isRolling = false,
  size = "large",
  showSparkles = false,
  finalValue,
  onRollComplete,
}: DiceProps) {
  const [currentFace, setCurrentFace] = useState(1);
  const [rollResult, setRollResult] = useState<number | null>(null);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32 md:w-40 md:h-40",
  };

  const dotSizes = {
    small: "w-1.5 h-1.5",
    medium: "w-2 h-2",
    large: "w-2.5 h-2.5 md:w-3 md:h-3",
  };

  const cubeSize = size === "small" ? 64 : size === "medium" ? 96 : 128;

  // Define rotation transforms for each face
  const getFaceTransform = (face: number) => {
    switch (face) {
      case 1: return "rotateX(0deg) rotateY(0deg)";
      case 2: return "rotateX(0deg) rotateY(180deg)";
      case 3: return "rotateX(0deg) rotateY(90deg)";
      case 4: return "rotateX(0deg) rotateY(-90deg)";
      case 5: return "rotateX(-90deg) rotateY(0deg)";
      case 6: return "rotateX(90deg) rotateY(0deg)";
      default: return "rotateX(0deg) rotateY(0deg)";
    }
  };

  // Handle rolling animation with random face changes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRolling) {
      setRollResult(null);
      // Change faces rapidly during roll
      interval = setInterval(() => {
        setCurrentFace(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      // Stop rolling and set final result
      setTimeout(() => {
        clearInterval(interval);
        const result = finalValue || Math.floor(Math.random() * 6) + 1;
        setCurrentFace(result);
        setRollResult(result);
        onRollComplete?.(result);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRolling, finalValue, onRollComplete]);

  const renderDots = (face: number) => {
    const dotClass = `${dotSizes[size]} bg-gray-800 rounded-full`;
    
    switch (face) {
      case 1:
        return <div className={dotClass}></div>;
      
      case 2:
        return (
          <div className="flex justify-between items-center w-full h-full p-3">
            <div className={dotClass}></div>
            <div className={dotClass}></div>
          </div>
        );
      
      case 3:
        return (
          <div className="grid grid-cols-3 gap-2 w-full h-full p-2">
            <div className={`${dotClass} justify-self-start self-start`}></div>
            <div></div>
            <div></div>
            <div></div>
            <div className={`${dotClass} justify-self-center self-center`}></div>
            <div></div>
            <div></div>
            <div></div>
            <div className={`${dotClass} justify-self-end self-end`}></div>
          </div>
        );
      
      case 4:
        return (
          <div className="grid grid-cols-2 gap-4 w-full h-full p-3">
            <div className={`${dotClass} justify-self-start self-start`}></div>
            <div className={`${dotClass} justify-self-end self-start`}></div>
            <div className={`${dotClass} justify-self-start self-end`}></div>
            <div className={`${dotClass} justify-self-end self-end`}></div>
          </div>
        );
      
      case 5:
        return (
          <div className="grid grid-cols-3 gap-2 w-full h-full p-2">
            <div className={`${dotClass} justify-self-start self-start`}></div>
            <div></div>
            <div className={`${dotClass} justify-self-end self-start`}></div>
            <div></div>
            <div className={`${dotClass} justify-self-center self-center`}></div>
            <div></div>
            <div className={`${dotClass} justify-self-start self-end`}></div>
            <div></div>
            <div className={`${dotClass} justify-self-end self-end`}></div>
          </div>
        );
      
      case 6:
        return (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
            <div className={`${dotClass} justify-self-start self-start`}></div>
            <div className={`${dotClass} justify-self-end self-start`}></div>
            <div className={`${dotClass} justify-self-start self-center`}></div>
            <div className={`${dotClass} justify-self-end self-center`}></div>
            <div className={`${dotClass} justify-self-start self-end`}></div>
            <div className={`${dotClass} justify-self-end self-end`}></div>
          </div>
        );
      
      default:
        return <div className={dotClass}></div>;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Sparkles */}
      {showSparkles && (
        <>
          <div className="absolute -top-4 -left-4 text-white text-xl animate-pulse">
            ✨
          </div>
          <div className="absolute -top-6 -right-2 text-white text-lg animate-bounce delay-300">
            ✨
          </div>
          <div className="absolute -bottom-2 -left-6 text-white text-lg animate-pulse delay-500">
            ✨
          </div>
          <div className="absolute -bottom-4 -right-4 text-white text-xl animate-bounce delay-700">
            ✨
          </div>
        </>
      )}

      {/* 3D Dice Container */}
      <div
        className="relative"
        style={{
          perspective: "1000px",
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
        }}
      >
        <div
          className={`relative transition-transform duration-300 ease-out ${
            isRolling ? "animate-dice-roll" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: isRolling ? "" : getFaceTransform(currentFace),
          }}
        >
          {/* Face 1 - Front (1 dot) */}
          <div
            className="absolute bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `translateZ(${cubeSize / 2}px)`,
            }}
          >
            {renderDots(1)}
          </div>

          {/* Face 2 - Back (2 dots) */}
          <div
            className="absolute bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `translateZ(-${cubeSize / 2}px) rotateY(180deg)`,
            }}
          >
            {renderDots(2)}
          </div>

          {/* Face 3 - Right (3 dots) */}
          <div
            className="absolute bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(90deg) translateZ(${cubeSize / 2}px)`,
            }}
          >
            {renderDots(3)}
          </div>

          {/* Face 4 - Left (4 dots) */}
          <div
            className="absolute bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(-90deg) translateZ(${cubeSize / 2}px)`,
            }}
          >
            {renderDots(4)}
          </div>

          {/* Face 5 - Top (5 dots) */}
          <div
            className="absolute bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(90deg) translateZ(${cubeSize / 2}px)`,
            }}
          >
            {renderDots(5)}
          </div>

          {/* Face 6 - Bottom (6 dots) */}
          <div
            className="absolute bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400 rounded-lg shadow-lg flex items-center justify-center dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(-90deg) translateZ(${cubeSize / 2}px)`,
            }}
          >
            {renderDots(6)}
          </div>
        </div>
      </div>

      {/* Result Display */}
      {rollResult && !isRolling && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg animate-fadeInUp">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">You rolled</div>
              <div className="text-2xl font-bold text-gray-900">{rollResult}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}