import React from 'react';
import Ballpit from './ui/Ballpit';
import { SolivaLogo } from './SolivaLogo';

const MaintenancePage: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#A97B4F]">
      {/* Background Gradient Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #D8C1A0 0%, #C7A27A 55%, #A97B4F 100%)',
          opacity: 1
        }}
      />

      {/* Middle Layer: Ballpit Animation */}
      <div className="absolute inset-0 z-10">
        <Ballpit 
          count={120}
          colors={['#FF7A00', '#FF9A3C', '#FFC36A', '#FFE2B8']}
          minSize={0.4}
          maxSize={1.1}
        />
      </div>

      {/* Foreground Layer: Centered Content */}
      <div className="relative z-20 text-center px-6 max-w-2xl animate-fade-in">
        
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <SolivaLogo height={70} variant="primary" />
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-serif text-[#43392b] mb-6 tracking-tight font-medium">
          Scheduled Maintenance
        </h1>

        {/* Description */}
        <p className="text-[#6d5e4a] text-xl md:text-2xl font-sans leading-relaxed mb-12 font-light">
          We are making improvements to deliver a better Soliva experience.
        </p>

        {/* Status Text */}
        <div className="pt-8 border-t border-[#43392b]/5">
          <p className="text-[#b47828] text-sm font-semibold tracking-[0.2em] uppercase">
            We'll be back shortly.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');

        :root {
          --font-serif: "Playfair Display", serif;
          --font-sans: "Plus Jakarta Sans", sans-serif;
        }

        .font-serif { font-family: var(--font-serif); }
        .font-sans { font-family: var(--font-sans); }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        body {
          background-color: #FAF6F0;
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
