import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#D84B7E] text-[#FDF4F7] py-1.5 sm:py-2 px-3 sm:px-4 text-center text-[10px] sm:text-xs tracking-wider sm:tracking-widest uppercase font-semibold border-b border-[#FCE7F0]/40 shadow-xs leading-snug">
      <span className="block truncate sm:inline">
        Complimentary Korean Gel Cleanser Sample on Orders Over ₹2,000 • Free Express Shipping Over ₹1,500
      </span>
    </div>
  );
};

