// types/index.ts
export interface Coupon {
  id: string;
  discount: number;
  minOrder: number;
  validFrom: string;
  validTo: string;
  code: string;
  isUsed: boolean;
  shopifyUrl?: string; // Added for Shopify integration
}

export type GameStep =
  | "landing"
  | "phoneNumber"
  | "otpVerification"
  | "rollDice"
  | "couponReveal"
  | "myCoupons";

export interface GameState {
  currentStep: GameStep;
  phoneNumber: string;
  userName: string; // Added for backend integration
  otp: string;
  isVerified: boolean;
  wonCoupon: Coupon | null;
  allCoupons: Coupon[];
}
