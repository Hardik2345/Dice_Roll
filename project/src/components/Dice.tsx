import React from "react";

interface DiceProps {
  isRolling?: boolean;
  size?: "small" | "medium" | "large";
  showSparkles?: boolean;
}

export function Dice({
  isRolling = false,
  size = "large",
  showSparkles = false,
}: DiceProps) {
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
          className={`relative transition-transform duration-2000 ease-out ${
            isRolling ? "animate-dice-roll" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: isRolling ? "" : "rotateX(-15deg) rotateY(25deg)",
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
            <div className={`${dotSizes[size]} bg-gray-800 rounded-full`}></div>
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
            <div className="flex justify-between items-center w-full h-full p-3">
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full`}
              ></div>
            </div>
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
            <div className="grid grid-cols-3 gap-2 w-full h-full p-2">
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-start`}
              ></div>
              <div></div>
              <div></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-center self-center`}
              ></div>
              <div></div>
              <div></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-end`}
              ></div>
            </div>
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
            <div className="grid grid-cols-2 gap-4 w-full h-full p-3">
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-start`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-start`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-end`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-end`}
              ></div>
            </div>
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
            <div className="grid grid-cols-3 gap-2 w-full h-full p-2">
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-start`}
              ></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-start`}
              ></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-center self-center`}
              ></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-end`}
              ></div>
              <div></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-end`}
              ></div>
            </div>
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
            <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-start`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-start`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-center`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-center`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-start self-end`}
              ></div>
              <div
                className={`${dotSizes[size]} bg-gray-800 rounded-full justify-self-end self-end`}
              ></div>
            </div>
          </div>
        </div>

        {/* Dynamic Shadow */}
        <div
          className={`absolute bg-black/30 rounded-full transition-all duration-2000 ${
            isRolling ? "animate-pulse scale-110" : "scale-100"
          }`}
          style={{
            width: `${cubeSize * 0.8}px`,
            height: `${cubeSize * 0.3}px`,
            left: "50%",
            top: `${cubeSize + 10}px`,
            transform: "translateX(-50%)",
            filter: "blur(8px)",
          }}
        ></div>
      </div>
    </div>
  );
}
