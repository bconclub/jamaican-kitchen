import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Every route change starts the new page at the top (not wherever the last
// page was scrolled to).
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
