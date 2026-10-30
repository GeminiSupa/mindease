"use client";

import { useEffect } from "react";

export default function ScrollAnimations() {
  useEffect(() => {
    const root = document.documentElement;
    const elements = document.querySelectorAll<HTMLElement>("[data-animate]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.add("motion-ready");

    if (reduceMotion.matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return () => root.classList.remove("motion-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => observer.observe(el));

    const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tiltElements = canTilt
      ? Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"))
      : [];

    const cleanups = tiltElements.map((element) => {
      const onMove = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        element.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
        element.style.setProperty("--tilt-y", `${(x - 0.5) * 9}deg`);
        element.style.setProperty("--glow-x", `${x * 100}%`);
        element.style.setProperty("--glow-y", `${y * 100}%`);
      };
      const onLeave = () => {
        element.style.removeProperty("--tilt-x");
        element.style.removeProperty("--tilt-y");
        element.style.removeProperty("--glow-x");
        element.style.removeProperty("--glow-y");
      };

      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);
      return () => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
