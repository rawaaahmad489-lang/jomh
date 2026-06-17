import { useEffect } from "react";

/**
 * useReveal — mirrors the original scroll-reveal logic.
 * Observes all `.reveal-text` elements inside `scrollContainerId`
 * and adds `.active` when they enter the viewport.
 *
 * @param {string} scrollContainerId  id of the scrollable container (default "mainContent")
 * @param {Array}  deps               extra dependencies that re-run the effect
 */
const useReveal = (scrollContainerId = "mainContent", deps = []) => {
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll(".reveal-text");
      reveals.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (top < windowHeight - 50) {
          el.classList.add("active");
        }
      });
    };

    // run once immediately
    reveal();

    // listen on the scrollable container AND window
    const container = document.getElementById(scrollContainerId);
    if (container) container.addEventListener("scroll", reveal);
    window.addEventListener("scroll", reveal);

    return () => {
      if (container) container.removeEventListener("scroll", reveal);
      window.removeEventListener("scroll", reveal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useReveal;