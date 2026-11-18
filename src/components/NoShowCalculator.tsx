'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPLN } from '@/lib/industry';

export function NoShowCalculator() {
  const [avgPrice, setAvgPrice] = useState(450);
  const [noShowsPerMonth, setNoShowsPerMonth] = useState(4);

  const monthlyLoss = avgPrice * noShowsPerMonth;
  const yearlyLoss = monthlyLoss * 12;
  const savedYearly = Math.round(yearlyLoss * 0.94);

  return (
    <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/90 backdrop-blur-md shadow-xl shadow-[#0D47A1]/5 overflow-hidden">
      <div className="bg-[#E3F2FD]/70 border-b border-[#90CAF9]/40 px-6 py-4 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#0D47A1]">
          Kalkulator strat (No-Show)
        </span>
        <span className="text-xs font-semibold text-[#2196F3] whitespace-nowrap shrink-0">
          Skuteczność: -94%
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <label htmlFor="avgPrice" className="font-medium text-[#334E68]">
              Średnia wartość Twojej usługi
            </label>
            <span className="text-sm font-bold tabular-nums text-[#0D47A1] whitespace-nowrap shrink-0">
              {formatPLN(avgPrice)}
            </span>
          </div>
          <input
            id="avgPrice"
            type="range"
            min={150}
            max={2500}
            step={50}
            value={avgPrice}
            onChange={(e) => setAvgPrice(Number(e.target.value))}
            className="snipper-slider mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E3F2FD]"
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-[#627D98]">
            <span>150 zł</span>
            <span>800 zł</span>
            <span>2500 zł</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <label htmlFor="noShows" className="font-medium text-[#334E68]">
              Odwołania i nieobecności w miesiącu
            </label>
            <span className="text-sm font-bold tabular-nums text-[#0D47A1] whitespace-nowrap shrink-0">
              {noShowsPerMonth} / mies.
            </span>
          </div>
          <input
            id="noShows"
            type="range"
            min={1}
            max={15}
            step={1}
            value={noShowsPerMonth}
            onChange={(e) => setNoShowsPerMonth(Number(e.target.value))}
            className="snipper-slider mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E3F2FD]"
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-[#627D98]">
            <span>1 wizyta</span>
            <span>8 wizyt</span>
            <span>15 wizyt</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-[6px] border border-[#90CAF9]/40 bg-[#E3F2FD]/50 p-3.5">
            <p className="text-[11px] font-medium text-[#334E68]">Roczna strata</p>
            <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-[#0A192F]">
              -{formatPLN(yearlyLoss)}
            </p>
            <p className="text-[11px] text-[#627D98] tabular-nums">
              -{formatPLN(monthlyLoss)} / mies.
            </p>
          </div>

          <div className="rounded-[6px] border border-[#0D47A1] bg-[#0D47A1] p-3.5 text-white">
            <p className="text-[11px] font-medium text-[#90CAF9]">Odzyskasz rocznie</p>
            <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-white">
              +{formatPLN(savedYearly)}
            </p>
            <p className="text-[11px] text-[#E3F2FD]">Plan START: 0 zł</p>
          </div>
        </div>

        <Link href="/panel?mode=register" className="product-link !w-full">
          Załóż darmowe konto
        </Link>
      </div>
    </div>
  );
}
