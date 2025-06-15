import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { GameState, GameStep, Coupon } from "../types";

interface GameContextType {
  state: GameState;
  setCurrentStep: (step: GameStep) => void;
  setPhoneNumber: (phone: string) => void;
  setUserName: (name: string) => void;
  setOtp: (otp: string) => void;
  setVerified: (verified: boolean) => void;
  addCoupon: (coupon: Coupon) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameAction =
  | { type: "SET_CURRENT_STEP"; payload: GameStep }
  | { type: "SET_PHONE_NUMBER"; payload: string }
  | { type: "SET_USER_NAME"; payload: string }
  | { type: "SET_OTP"; payload: string }
  | { type: "SET_VERIFIED"; payload: boolean }
  | { type: "ADD_COUPON"; payload: Coupon }
  | { type: "RESET_GAME" };

const initialState: GameState = {
  currentStep: "landing",
  phoneNumber: "",
  userName: "",
  otp: "",
  isVerified: false,
  wonCoupon: null,
  allCoupons: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_PHONE_NUMBER":
      return { ...state, phoneNumber: action.payload };
    case "SET_USER_NAME":
      return { ...state, userName: action.payload };
    case "SET_OTP":
      return { ...state, otp: action.payload };
    case "SET_VERIFIED":
      return { ...state, isVerified: action.payload };
    case "ADD_COUPON":
      return {
        ...state,
        wonCoupon: action.payload,
        allCoupons: [action.payload, ...state.allCoupons],
      };
    case "RESET_GAME":
      return { ...initialState, allCoupons: state.allCoupons };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setCurrentStep = (step: GameStep) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  };

  const setPhoneNumber = (phone: string) => {
    dispatch({ type: "SET_PHONE_NUMBER", payload: phone });
  };

  const setUserName = (name: string) => {
    dispatch({ type: "SET_USER_NAME", payload: name });
  };

  const setOtp = (otp: string) => {
    dispatch({ type: "SET_OTP", payload: otp });
  };

  const setVerified = (verified: boolean) => {
    dispatch({ type: "SET_VERIFIED", payload: verified });
  };

  const addCoupon = (coupon: Coupon) => {
    dispatch({ type: "ADD_COUPON", payload: coupon });
  };

  const resetGame = () => {
    dispatch({ type: "RESET_GAME" });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        setCurrentStep,
        setPhoneNumber,
        setUserName,
        setOtp,
        setVerified,
        addCoupon,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
