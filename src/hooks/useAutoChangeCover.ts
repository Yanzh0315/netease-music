import { useState,useEffect } from "react";


export function useAutoChangeCover(coverList:string[],interval:10000){
    const [currentIndex,setCurrentIndex] = useState(0);    
    useEffect(()=>{
        if(!coverList || coverList.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex)=>(prevIndex+1) %  coverList.length);
        }, interval);

        return () => clearInterval(timer)

    },[coverList,interval])
    
    return coverList && coverList.length > 0 ? coverList[currentIndex] : '';
}