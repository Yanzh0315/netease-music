import React from "react";
interface FeatureCardProps {
  title: string;
  subtitle: string;
  bgClass: string; 
  cover: string;
  onClick?:()=>void;
}

 function FeatureCard({ title, subtitle, bgClass, cover ,onClick}: FeatureCardProps) {
  return (
    <div
     onClick = {onClick}
    >
      <div className={`relative flex flex-col p-4 h-32 rounded-xl overflow-hidden bg:gradient-to-r ${bgClass} group cursor-pointer hover:shadow-2xl transition-all duration-300`}>
        <div className="z-10 absolute top-4 left-4">
          <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
          <p className="text-white/80 text-[10px] mt-1">{subtitle}</p>
        </div>
        <img
          src={cover || 'https://picsum.photos/200'}
          alt={title}
          className="absolute -right-4 -bottom-4 w-24 h-24 object-cover rounded-lg shadow-xl rotate-12 group-hover:scale-110 group-hover:-rotate-0 transition-all duration-500"
          key = {cover}
        />
      </div>
    </div>
  );
}
export default React.memo(FeatureCard)