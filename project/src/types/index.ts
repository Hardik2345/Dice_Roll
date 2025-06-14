export interface Coupon {
  id: string;
  discount: number;
  minOrder: number;
  validFrom: string;
  validTo: string;
  code: string;
  isUsed: boolean;
}

export type GameStep = 
  | 'landing'
  | 'rollDice'
  | 'phoneNumber'
  | 'otpVerification'
  | 'couponReveal'
  | 'myCoupons';

export interface GameState {
  currentStep: GameStep;
  phoneNumber: string;
  otp: string;
  isVerified: boolean;
  wonCoupon: Coupon | null;
  allCoupons: Coupon[];
}