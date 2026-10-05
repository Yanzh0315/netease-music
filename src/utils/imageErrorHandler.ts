const DEFAULT_COVER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#3f3f46"/>
    <text x="50" y="62" font-size="44" text-anchor="middle" fill="#71717a">♪</text>
  </svg>`
)}`;

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  
  // 防止无限循环：已经是默认图了就不再处理
  if (img.src === DEFAULT_COVER) return;
  
  // 直接用默认图替换
  img.src = DEFAULT_COVER;
};