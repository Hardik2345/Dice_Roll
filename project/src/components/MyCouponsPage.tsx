import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameContext } from '../context/GameContext';
import { CouponCard } from './CouponCard';

export function MyCouponsPage() {
  const { state, setCurrentStep } = useGameContext();
  const [couponCode, setCouponCode] = useState('');

  const handleBack = () => {
    setCurrentStep('landing');
  };

  const handleApplyCoupon = () => {
    // Placeholder for coupon application logic
    console.log('Applying coupon:', couponCode);
    setCouponCode('');
  };

  const handleShopNow = () => {
    // Placeholder for shop navigation
    console.log('Navigating to shop');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">MY COUPONS</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 text-sm text-gray-500">
        HOME / LOGIN / MY COUPONS
      </div>

      <div className="px-4 pb-8">
        {/* Page Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">MY COUPONS</h2>

        {/* Manual Coupon Entry */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter Coupon Code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-none outline-none focus:border-red-600 transition-colors"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-red-600 text-white px-6 py-2 font-medium hover:bg-red-700 transition-colors"
            >
              APPLY
            </button>
          </div>
        </div>

        {/* Coupons List */}
        <div className="space-y-4">
          {state.allCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onShop={handleShopNow}
            />
          ))}
        </div>

        {/* No Coupons Message */}
        {state.allCoupons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <p className="text-gray-600 text-lg">No coupons available</p>
            <p className="text-gray-500 text-sm">Play the dice game to win exciting coupons!</p>
            <button
              onClick={() => setCurrentStep('landing')}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Play Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}