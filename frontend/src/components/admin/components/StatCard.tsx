import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  color = 'from-[#D84B7E] to-[#B5426C]',
  subtext,
  badge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white border border-[#F1BCCE]/60 shadow-xs hover:shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-[#D84B7E]/50 group' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {title}
            </span>
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FCE7F0] text-[#D84B7E] font-bold">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">
            {value}
          </h3>
        </div>

        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-xs shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          {change && (
            <div
              className={`flex items-center gap-1 font-semibold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{change}</span>
            </div>
          )}
          {subtext && <span className="text-gray-600 font-light truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
