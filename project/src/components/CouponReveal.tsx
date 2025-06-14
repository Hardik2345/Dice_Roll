import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';

interface CouponRevealProps {
  shopUrl?: string;
}

export function CouponReveal({ shopUrl = '#' }: CouponRevealProps) {
  const { state, setCurrentStep } = useGameContext();
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Trigger reveal animation after component mounts
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleShopNow = () => {
    if (shopUrl === '#') {
      setCurrentStep('myCoupons');
    } else {
      window.open(shopUrl, '_blank');
    }
  };

  const coupon = state.wonCoupon;

  if (!coupon) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="text-center max-w-sm mx-auto">
        {/* Sparkles Animation */}
        <div className="relative mb-8">
          <div className="absolute -top-8 left-1/4 text-white text-2xl animate-bounce">✨</div>
          <div className="absolute -top-6 right-1/4 text-white text-xl animate-pulse delay-300">✨</div>
          <div className="absolute top-4 -left-8 text-white text-lg animate-bounce delay-500">✨</div>
          <div className="absolute top-2 -right-6 text-white text-xl animate-pulse delay-700">✨</div>
        </div>

        {/* Coupon Container */}
        <div className={`relative transition-all duration-1000 ${isRevealed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          {/* Red Envelope */}
          <div className="relative w-64 h-80 mx-auto mb-8">
            {/* Envelope Back */}
            <div className="absolute inset-0 bg-red-600 rounded-lg shadow-2xl"></div>
            
            {/* Envelope Flap */}
            <div className="absolute -top-6 left-0 right-0 h-16 bg-red-700 transform origin-bottom rotate-12 rounded-t-lg"></div>
            
            {/* Coupon Paper */}
            <div className={`absolute inset-4 bg-white rounded-lg shadow-lg transition-all duration-1000 ${isRevealed ? 'translate-y-0' : 'translate-y-8'}`}>
              <div className="p-6 text-center h-full flex flex-col justify-center">
                {/* Logo/Brand */}
                <div className="mb-4">
                  <div className="w-12 h-8 bg-red-600 mx-auto rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">HB</span>
                  </div>
                </div>
                
                {/* Discount Amount */}
                <div className="mb-2">
                  <span className="text-3xl font-bold text-red-600">₹{coupon.discount} OFF</span>
                </div>
                
                {/* Min Order */}
                <div className="text-sm text-gray-600 mb-4">
                  orders above<br />₹{coupon.minOrder}+
                </div>
                
                {/* Coupon Code */}
                <div className="text-xs text-gray-500 border-t pt-2">
                  Code: {coupon.code}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Congratulations Text */}
        <div className={`mb-6 transition-all duration-1000 delay-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-white text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-white/80">You've won an exclusive discount!</p>
        </div>

        {/* Shop Now Button */}
        <button
          onClick={handleShopNow}
          className={`w-full bg-white text-red-600 font-bold text-lg py-4 px-8 rounded-none hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '1s' }}
        >
          SHOP NOW
        </button>
      </div>
    </div>
  );
}