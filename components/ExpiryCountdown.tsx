'use client';

import { useEffect, useState } from 'react';

interface ExpiryCountdownProps {
  expiresAt: number;
}

export default function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    function calculateTime() {
      const now = Math.floor(Date.now() / 1000);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 justify-center py-2 px-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold uppercase tracking-wider border border-red-200 w-fit mx-auto">
        <span>❌</span> Expired
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase font-bold tracking-widest text-[#9E7A3F]">Time Remaining</span>
      <div className="flex gap-2 justify-center font-mono">
        <div className="flex flex-col items-center bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-md px-2 py-1 min-w-[36px]">
          <span className="text-sm font-bold text-[#1C1A16]">{timeLeft.days}</span>
          <span className="text-[8px] text-[#6B6558] uppercase font-medium">d</span>
        </div>
        <div className="flex flex-col items-center bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-md px-2 py-1 min-w-[36px]">
          <span className="text-sm font-bold text-[#1C1A16]">{timeLeft.hours}</span>
          <span className="text-[8px] text-[#6B6558] uppercase font-medium">h</span>
        </div>
        <div className="flex flex-col items-center bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-md px-2 py-1 min-w-[36px]">
          <span className="text-sm font-bold text-[#1C1A16]">{timeLeft.minutes}</span>
          <span className="text-[8px] text-[#6B6558] uppercase font-medium">m</span>
        </div>
        <div className="flex flex-col items-center bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-md px-2 py-1 min-w-[36px]">
          <span className="text-sm font-bold text-[#1C1A16]">{timeLeft.seconds}</span>
          <span className="text-[8px] text-[#6B6558] uppercase font-medium">s</span>
        </div>
      </div>
    </div>
  );
}
