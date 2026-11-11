"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

let initialization;

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${source}`));
    document.head.appendChild(script);
  });
}

function loadModule(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${source}`));
    document.body.appendChild(script);
  });
}

export default function SiteEnhancements({ markup }) {
  const prefersReducedMotion = useReducedMotion();
  const [motionEnabled, setMotionEnabled] = useState(true);

  useEffect(() => {
    let storedMotion = null;
    try {
      storedMotion = window.localStorage.getItem("audira-motion");
    } catch (error) {
      console.warn("AUDIRA motion preference could not be read.", error);
    }

    const enabled = storedMotion === "on"
      || (storedMotion !== "off" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMotionEnabled(enabled);

    const onMotionChange = (event) => {
      setMotionEnabled(event.detail.enabled);
    };
    let readinessFallback;
    const onEnhancementsReady = () => {
      window.clearTimeout(readinessFallback);
      document.body.classList.add("is-ready");
    };
    document.addEventListener("audira:motion", onMotionChange);
    document.addEventListener("audira:initialized", onEnhancementsReady, { once: true });
    readinessFallback = window.setTimeout(onEnhancementsReady, 2500);
    if (window.__audiraInitialized) onEnhancementsReady();

    if (!initialization) {
      initialization = (async () => {
        try {
          gsap.registerPlugin(ScrollTrigger);
          window.gsap = gsap;
          window.ScrollTrigger = ScrollTrigger;
          window.Lenis = Lenis;

          try {
            await loadScript("/site-interactions.js");
          } catch (error) {
            console.error("AUDIRA motion interactions could not be loaded.", error);
          } finally {
            window.__audiraInitialized = true;
            document.dispatchEvent(new Event("audira:initialized"));
          }

          try {
            window.THREE = await import("three");
            await loadModule("/three-scene.js");
          } catch (error) {
            console.error("AUDIRA 3D product scene could not be loaded.", error);
          }
        } catch (error) {
          console.error("AUDIRA motion enhancements could not be initialized.", error);
        } finally {
          window.__audiraInitialized = true;
          document.dispatchEvent(new Event("audira:initialized"));
        }
      })();
    }

    return () => {
      document.removeEventListener("audira:motion", onMotionChange);
      document.removeEventListener("audira:initialized", onEnhancementsReady);
      window.clearTimeout(readinessFallback);
    };
  }, []);

  const reducedMotion = motionEnabled ? (prefersReducedMotion ? "always" : "user") : "always";

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    <div aria-hidden="true" className="motion-intro">
      <motion.div
        className="motion-intro-lockup"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: motionEnabled && !prefersReducedMotion ? 0.75 : 0.01,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span className="motion-intro-wordmark">AUDIRA<span>.</span></span>
        <span className="motion-intro-tagline">FEEL EVERY FREQUENCY</span>
        <span className="motion-intro-rule"><i /></span>
      </motion.div>
    </div>
    </MotionConfig>
  );
}
