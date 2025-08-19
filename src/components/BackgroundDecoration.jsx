import React from 'react';

export default function BackgroundDecoration() {
  return (
    <div className="fixed top-0 left-0 w-full h-full opacity-5 pointer-events-none z-0">
      <div 
        className="absolute top-0 left-0 w-full h-full animate-float"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, #ff7f30 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, #3d3b3a 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, #ff7f30 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}
