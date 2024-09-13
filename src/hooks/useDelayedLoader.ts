import { useEffect, useState } from "react";

export default function useDelayedLoader(isLoading: boolean) {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoader(true);
      }, 200);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  return showLoader;
}
