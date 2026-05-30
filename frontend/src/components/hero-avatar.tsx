"use client";

import { motion } from "framer-motion";

interface HeroAvatarProps {
  isSilhouette?: boolean;
  skinTone?: string;
  equipped?: Record<string, string | null>;
}

export function HeroAvatar({ isSilhouette, skinTone = "#f1c27d", equipped }: HeroAvatarProps) {
  const fill = isSilhouette ? "#1e1e38" : skinTone;
  const shortsColor = isSilhouette ? "#111122" : "#3b82f6"; // Blue shorts

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 400" className="w-auto h-[75%] drop-shadow-2xl z-10 transition-all duration-500">
        <g style={{ filter: isSilhouette ? "blur(3px) brightness(0.5)" : "none", transition: "all 0.5s" }}>
          {/* Left Arm */}
          <rect x="35" y="140" width="24" height="110" rx="12" fill={fill} transform="rotate(10, 47, 140)" />
          {/* Right Arm */}
          <rect x="141" y="140" width="24" height="110" rx="12" fill={fill} transform="rotate(-10, 153, 140)" />
          
          {/* Legs */}
          <rect x="68" y="240" width="26" height="120" rx="13" fill={fill} />
          <rect x="106" y="240" width="26" height="120" rx="13" fill={fill} />
          
          {/* Torso */}
          <rect x="60" y="125" width="80" height="90" rx="30" fill={fill} />
          
          {/* Neck */}
          <rect x="85" y="110" width="30" height="30" rx="10" fill={fill} />
          
          {/* Shorts (Base) */}
          <rect x="60" y="200" width="80" height="45" rx="15" fill={shortsColor} />
          {/* Shorts (Legs) */}
          <rect x="68" y="235" width="26" height="35" rx="5" fill={shortsColor} />
          <rect x="106" y="235" width="26" height="35" rx="5" fill={shortsColor} />
          
          {/* Head */}
          <circle cx="100" cy="75" r="45" fill={fill} />
          
          {/* Face */}
          {!isSilhouette && (
            <g>
              {/* Eyes */}
              <circle cx="82" cy="70" r="5" fill="#111" />
              <circle cx="118" cy="70" r="5" fill="#111" />
              {/* Smile */}
              <path d="M 85 95 Q 100 110 115 95" stroke="#111" strokeWidth="3.5" fill="transparent" strokeLinecap="round" />
              {/* Cheeks */}
              <circle cx="70" cy="85" r="6" fill="#ff0000" opacity="0.15" />
              <circle cx="130" cy="85" r="6" fill="#ff0000" opacity="0.15" />
            </g>
          )}
        </g>
      </svg>

      {/* Equipped Emoji Overlays */}
      {!isSilhouette && equipped?.clothing === 'cl_suit' && (
         <div className="absolute top-[34%] text-[100px] z-20 pointer-events-none drop-shadow-lg">👔</div>
      )}
      {!isSilhouette && equipped?.clothing === 'cl_tshirt' && (
         <div className="absolute top-[34%] text-[100px] z-20 pointer-events-none drop-shadow-lg">👕</div>
      )}
      {!isSilhouette && equipped?.clothing === 'cl_coat' && (
         <div className="absolute top-[34%] text-[100px] z-20 pointer-events-none drop-shadow-lg">🥼</div>
      )}
      
      {!isSilhouette && equipped?.accessory === 'ac_glasses' && (
         <div className="absolute top-[17%] text-[70px] z-30 pointer-events-none drop-shadow-lg">👓</div>
      )}
      {!isSilhouette && equipped?.accessory === 'ac_crown' && (
         <div className="absolute top-[3%] text-[70px] z-30 pointer-events-none drop-shadow-lg">👑</div>
      )}
      {!isSilhouette && equipped?.accessory === 'ac_cap' && (
         <div className="absolute top-[5%] text-[70px] z-30 pointer-events-none drop-shadow-lg">🧢</div>
      )}
    </div>
  );
}
