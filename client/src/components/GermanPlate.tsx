interface GermanPlateProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GermanPlate({ plate, size = 'md' }: GermanPlateProps) {
  const sizeClasses = {
    sm: {
      container: 'rounded',
      stripe: 'w-6 py-1',
      stars: 'w-4 h-4',
      starSize: 'w-0.5 h-0.5',
      starTranslate: '-6px',
      countryText: 'text-[8px]',
      content: 'px-2 py-1 min-w-[100px]',
      plateText: 'text-sm',
    },
    md: {
      container: 'rounded-md',
      stripe: 'w-8 py-2',
      stars: 'w-5 h-5',
      starSize: 'w-0.5 h-0.5',
      starTranslate: '-7px',
      countryText: 'text-[10px]',
      content: 'px-3 py-2 min-w-[160px]',
      plateText: 'text-lg',
    },
    lg: {
      container: 'rounded-md',
      stripe: 'w-10 py-2',
      stars: 'w-6 h-6',
      starSize: 'w-1 h-1',
      starTranslate: '-8px',
      countryText: 'text-xs',
      content: 'px-4 py-3 min-w-[200px]',
      plateText: 'text-2xl',
    },
  };

  const s = sizeClasses[size];

  return (
    <div className={`inline-flex items-stretch ${s.container} overflow-hidden border-2 border-black shadow-md`}>
      {/* EU Blue Stripe */}
      <div className={`${s.stripe} bg-[#003399] flex flex-col items-center justify-center`}>
        <div className={`${s.stars} rounded-full border border-yellow-400 flex items-center justify-center relative mb-0.5`}>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute ${s.starSize} bg-yellow-400 rounded-full`}
              style={{
                transform: `rotate(${i * 30}deg) translateY(${s.starTranslate})`
              }}
            />
          ))}
        </div>
        <span className={`text-white ${s.countryText} font-bold`}>D</span>
      </div>
      
      {/* Plate Content */}
      <div className={`bg-white ${s.content} flex items-center justify-center`}>
        <span className={`${s.plateText} font-bold tracking-wide text-black font-mono`}>
          {plate}
        </span>
      </div>
    </div>
  );
}
