import React from 'react';
import { Coupon } from '../types';

interface CouponCardProps {
  coupon: Coupon;
  onShop?: () => void;
}

export function CouponCard({ coupon, onShop }: CouponCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div className="flex">
        {/* Left Section - Discount */}
        <div className="bg-red-600 text-white p-6 flex-shrink-0 flex flex-col justify-center items-center min-w-[120px] relative">
          <div className="text-2xl font-bold">₹{coupon.discount}</div>
          <div className="text-sm opacity-90">OFF</div>
          
          {/* Sparkle decoration */}
          <div className="absolute top-2 right-2 text-white/60 text-sm">✨</div>
        </div>

        {/* Right Section - Details */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                on orders above ₹{coupon.minOrder}+
              </div>
            </div>
            <button
              onClick={onShop}
              className="text-red-600 font-medium hover:underline flex items-center gap-1"
            >
              SHOP →
            </button>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>Valid: {coupon.validFrom} - {coupon.validTo}</div>
            <div>Not Applicable On Flash Sale Items</div>
            <div className="font-medium">Code: {coupon.code}</div>
          </div>
          
          {coupon.isUsed && (
            <div className="mt-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                Used
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}