//   const handleMouseDown = (e:React.MouseEvent)=>{
//     if(!audioRef.current || !progressContainerRef.current || !audioRef.current.duration)return;
//     //获取进度条的长度
//     const rect = progressContainerRef.current.getBoundingClientRect();
//     //百分比
//     let percent = (e.clientX - rect.left)/rect.width
//     percent = Math.max(0,Math.min(1,percent));
//     if(progressRef.current) progressRef.current.style.width = `${percent * 100}&`;
//     audioRef.current.currentTime = percent * audioRef.current.duration;

//     isDranggingRef.current = true;
//     document.addEventListener('mousemove',handleMouseMove)
//     document.addEventListener('mouseup',handleMouseUp)
//   };

//   const handleMouseMove = (e:MouseEvent)=>{
//     if(!isDranggingRef.current || !audioRef.current || !progressContainerRef.current || !audioRef.current.duration) return;

//     const rect = progressContainerRef.current.getBoundingClientRect();
//      let percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
//      if(progressRef.current)progressRef.current.style.width = `${percent * 100}%`;
//   };

//   const handleMouseUp = (e:MouseEvent)=>{
//     if(!isDranggingRef.current || !audioRef.current || !progressContainerRef.current || !audioRef.current.duration)return;
    
//     isDranggingRef.current = false ; 
//     document.removeEventListener('mousemove',handleMouseMove);
//     document.removeEventListener('mouseup',handleMouseUp);
  
//     const rect = progressContainerRef.current.getBoundingClientRect();
//     let percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
//     audioRef.current.currentTime = percent * audioRef.current.duration;
//   };


//  const calcVolume = (clientY : number)=>{
//     if(!volumeBarRef.current) return 0;
//     const rect = volumeBarRef.current.getBoundingClientRect();

//     let percent = (rect.bottom - clientY) / rect.height;
//     return Math.max(0,Math.min(1,percent));
//   }
//   //鼠标按下
//   const handleVolumeMouseDown = (e:React.MouseEvent)=>{
//     e.preventDefault();
//     isDranggingVolumeRef.current = true;
//     setVolume(calcVolume(e.clientY));

//     document.addEventListener('mousemove',handleVolumeMouseMove);
//     document.addEventListener('mouseup',handleVolumeMouseUp);
//   };
//   // 鼠标移动
//   const handleVolumeMouseMove = (e:MouseEvent)=>{
//     if(!isDranggingVolumeRef.current) return ;
//     setVolume(calcVolume(e.clientY))
//   };
//   //鼠标松开
//   const handleVolumeMouseUp = ()=>{
//     isDranggingVolumeRef.current = false;
//     document.removeEventListener('mousemove',handleVolumeMouseMove);
//     document.removeEventListener('mouseup',handleVolumeMouseUp);
//   }