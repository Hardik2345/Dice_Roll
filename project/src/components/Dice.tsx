import React, { useState, useEffect } from "react";

interface DiceProps {
  isRolling?: boolean;
  size?: "small" | "medium" | "large";
  showSparkles?: boolean;
  result?: number; // New prop to specify which face to show
}

export function Dice({
  isRolling = false,
  size = "large",
  showSparkles = false,
  result,
}: DiceProps) {
  const [finalRotation, setFinalRotation] = useState({ x: -15, y: 25 });
  const [isSettling, setIsSettling] = useState(false);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32 md:w-40 md:h-40",
  };

  const dotSizes = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4 md:w-5 md:h-5",
  };

  const cubeSize = size === "small" ? 64 : size === "medium" ? 96 : 128;

  // Define rotations for each face to be on top
  const faceRotations = [
    { x: 0, y: 0 }, // Face 1
    { x: 0, y: 180 }, // Face 2
    { x: 0, y: -90 }, // Face 3
    { x: 0, y: 90 }, // Face 4
    { x: -90, y: 0 }, // Face 5
    { x: 90, y: 0 }, // Face 6
  ];

  useEffect(() => {
    if (isRolling && result) {
      // Reset settling state
      setIsSettling(false);

      // When rolling starts with a specific result, use that
      const rotation = faceRotations[result - 1];

      // Start settling phase (blur) before final result
      // setTimeout(() => {
      //   setIsSettling(true);
      // }, 1700);

      // Set a timeout to apply the rotation after the animation
      setTimeout(() => {
        setFinalRotation(rotation);
        // setIsSettling(false);
      }, 1900); // Apply just before animation ends
    } else if (isRolling) {
      // Reset settling state
      setIsSettling(false);

      // When rolling starts without a specific result, generate random face
      const randomFace = Math.floor(Math.random() * 6);
      const rotation = faceRotations[randomFace];

      // Start settling phase (blur) before final result
      // setTimeout(() => {
      //   setIsSettling(true);
      // }, 1700);

      // Set a timeout to apply the rotation after the animation
      setTimeout(() => {
        setFinalRotation(rotation);
        setIsSettling(false);
      }, 1900); // Apply just before animation ends
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, result]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Add CSS for continuous vertical axis rotation */}
      <style jsx>{`
        @keyframes continuousVerticalRotation {
          from {
            transform: rotateX(-15deg) rotateY(25deg) rotateZ(0deg);
          }
          to {
            transform: rotateX(345deg) rotateY(25deg) rotateZ(0deg);
          }
        }

        .continuous-vertical-rotation {
          animation: continuousVerticalRotation 0.4s linear infinite;
        }
      `}</style>

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
        className="relative dice-container"
        style={{
          perspective: "1000px",
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className={`relative transition-all ${
            isRolling && !isSettling ? "continuous-vertical-rotation" : ""
          } ${isRolling && !isSettling ? "" : "duration-300"} ease-out ${
            isSettling ? "blur-sm" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform:
              isRolling && !isSettling
                ? undefined // Let CSS animation handle the transform
                : `rotateX(${finalRotation.x}deg) rotateY(${finalRotation.y}deg)`,
          }}
        >
          {/* Face 1 - Front (1 dot) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `translateZ(${cubeSize / 2}px)`,
              background: `linear-gradient(135deg, 
                #ffffff 0%, 
                #f8f9fa 25%, 
                #e9ecef 50%, 
                #dee2e6 75%, 
                #ced4da 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.1),
                inset -4px -4px 8px rgba(255,255,255,0.8),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>

          {/* Face 2 - Back (2 dots) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `translateZ(-${cubeSize / 2}px) rotateY(180deg)`,
              background: `linear-gradient(135deg, 
                #f8f9fa 0%, 
                #e9ecef 25%, 
                #dee2e6 50%, 
                #ced4da 75%, 
                #adb5bd 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.15),
                inset -4px -4px 8px rgba(255,255,255,0.6),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>

          {/* Face 3 - Right (3 dots) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(90deg) translateZ(${cubeSize / 2}px)`,
              background: `linear-gradient(135deg, 
                #e9ecef 0%, 
                #dee2e6 25%, 
                #ced4da 50%, 
                #adb5bd 75%, 
                #95a5a6 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.2),
                inset -4px -4px 8px rgba(255,255,255,0.4),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '12px',
              alignItems: 'center',
              justifyItems: 'center'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-center self-center`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>

          {/* Face 4 - Left (4 dots) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(-90deg) translateZ(${cubeSize / 2}px)`,
              background: `linear-gradient(135deg, 
                #e9ecef 0%, 
                #dee2e6 25%, 
                #ced4da 50%, 
                #adb5bd 75%, 
                #95a5a6 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.2),
                inset -4px -4px 8px rgba(255,255,255,0.4),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              padding: '16px',
              alignItems: 'center',
              justifyItems: 'center'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>

          {/* Face 5 - Top (5 dots) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(90deg) translateZ(${cubeSize / 2}px)`,
              background: `linear-gradient(135deg, 
                #ffffff 0%, 
                #f8f9fa 25%, 
                #e9ecef 50%, 
                #dee2e6 75%, 
                #ced4da 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.1),
                inset -4px -4px 8px rgba(255,255,255,0.8),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '12px',
              alignItems: 'center',
              justifyItems: 'center'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-center self-center`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>

          {/* Face 6 - Bottom (6 dots) */}
          <div
            className="absolute dice-face"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(-90deg) translateZ(${cubeSize / 2}px)`,
              background: `linear-gradient(135deg, 
                #dee2e6 0%, 
                #ced4da 25%, 
                #adb5bd 50%, 
                #95a5a6 75%, 
                #7f8c8d 100%)`,
              borderRadius: '12px',
              boxShadow: `
                inset 0 0 0 2px rgba(0,0,0,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.25),
                inset -4px -4px 8px rgba(255,255,255,0.3),
                0 8px 16px rgba(0,0,0,0.2)
              `,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              padding: '12px',
              alignItems: 'center',
              justifyItems: 'center'
            }}
          >
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-start`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-center`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-center`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-start self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
            <div 
              className={`${dotSizes[size]} rounded-full justify-self-end self-end`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a)',
                boxShadow: `
                  inset 2px 2px 4px rgba(0,0,0,0.8),
                  inset -1px -1px 2px rgba(255,255,255,0.1),
                  0 2px 4px rgba(0,0,0,0.3)
                `
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}