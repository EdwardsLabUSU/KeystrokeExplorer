import { useCallback, useEffect, useState } from "react"

export const useResize = () => {
    const [width, setWidth] = useState(window.innerWidth);
    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      }, []);
  
    return { width, height }
}

export const useContainerDimensions = myRef => {
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    
    const handleResize = useCallback(() => {
        setWidth(myRef.current.offsetWidth)
        setHeight(myRef.current.offsetHeight)
    }, [myRef])

    useEffect(() => {
        window.addEventListener('load', handleResize)
        window.addEventListener('resize', handleResize)

        return () => {
        window.removeEventListener('load', handleResize)
        window.removeEventListener('resize', handleResize)
        }
    }, [myRef, handleResize])

    return { width, height }

};