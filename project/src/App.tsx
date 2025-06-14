import React from "react";
import { GameProvider, useGameContext } from "./context/GameContext";
import { LandingPage } from "./components/LandingPage";
import { RollDiceScreen } from "./components/RollDiceScreen";
import { PhoneNumberModal } from "./components/PhoneNumberModal";
import { OtpVerificationModal } from "./components/OtpVerificationModal";
import { CouponReveal } from "./components/CouponReveal";
import { MyCouponsPage } from "./components/MyCouponsPage";

function GameScreen() {
  const { state } = useGameContext();

  const renderCurrentScreen = () => {
    switch (state.currentStep) {
      case "landing":
        return <LandingPage />;
      case "phoneNumber":
        return (
          <>
            <LandingPage />
            <PhoneNumberModal />
          </>
        );
      case "otpVerification":
        return (
          <>
            <LandingPage />
            <OtpVerificationModal />
          </>
        );
      case "rollDice":
        return <RollDiceScreen />;
      case "couponReveal":
        return <CouponReveal />;
      case "myCoupons":
        return <MyCouponsPage />;
      default:
        return <LandingPage />;
    }
  };

  return <>{renderCurrentScreen()}</>;
}

function App() {
  return (
    <GameProvider>
      <div className="font-sans antialiased">
        <GameScreen />
      </div>
    </GameProvider>
  );
}

export default App;
