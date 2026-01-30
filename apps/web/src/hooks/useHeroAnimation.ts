'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useHeroAnimation() {
  const rootRef = useRef<HTMLElement>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Set final state immediately without animation
      const finalStateSelectors = [
        "[data-hero='eyebrow']",
        "[data-hero='headline']",
        "[data-hero='subtext']",
        "[data-hero='search-card']",
        "[data-hero='secondary-cta']",
        "[data-hero='trust-strip']",
        "[data-hero='trust-item']",
        "[data-hero='bg-accent']",
      ];
      
      finalStateSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.transform = 'none';
        });
      });
      return;
    }

    // Wait for fonts to load
    document.fonts.ready.then(() => {
      const root = rootRef.current;
      if (!root) return;

      // Create GSAP context for proper cleanup
      contextRef.current = gsap.context(() => {
        // Set initial states
        gsap.set("[data-hero='bg-accent']", { opacity: 0, scale: 0.98 });
        gsap.set("[data-hero='eyebrow']", { opacity: 0, y: 10 });
        gsap.set("[data-hero='headline']", { opacity: 0, y: 14 });
        gsap.set("[data-hero='headline-line']", { opacity: 0, y: 10 });
        gsap.set("[data-hero='subtext']", { opacity: 0, y: 12 });
        gsap.set("[data-hero='search-card']", { opacity: 0, y: 14, scale: 0.985 });
        gsap.set("[data-hero='secondary-cta']", { opacity: 0, y: 10 });
        gsap.set("[data-hero='trust-strip']", { opacity: 0, y: 10 });
        gsap.set("[data-hero='trust-item']", { opacity: 0, y: 8 });

        // Create entrance timeline with performance optimizations
        const tl = gsap.timeline({
          defaults: {
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
            force3D: true,
          },
          onComplete: () => {
            // Clear transforms after entrance animation completes (per spec)
            gsap.set("[data-hero='eyebrow'], [data-hero='headline'], [data-hero='subtext'], [data-hero='search-card'], [data-hero='secondary-cta'], [data-hero='trust-strip'], [data-hero='trust-item']", {
              clearProps: 'transform,opacity',
            });
          },
        });

        tl.to("[data-hero='bg-accent']", {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power1.out',
        }, 0)
        .to("[data-hero='eyebrow']", {
          opacity: 1,
          y: 0,
          duration: 0.45,
        }, 0.05)
        .to("[data-hero='headline']", {
          opacity: 1,
          y: 0,
          duration: 0.55,
        }, 0.12)
        .to("[data-hero='headline-line']", {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
        }, 0.14)
        .to("[data-hero='subtext']", {
          opacity: 1,
          y: 0,
          duration: 0.5,
        }, 0.22)
        .to("[data-hero='search-card']", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
        }, 0.32)
        .to("[data-hero='secondary-cta']", {
          opacity: 1,
          y: 0,
          duration: 0.45,
        }, 0.42)
        .to("[data-hero='trust-strip']", {
          opacity: 1,
          y: 0,
          duration: 0.45,
        }, 0.48)
        .to("[data-hero='trust-item']", {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
        }, 0.5);

        // Search card hover animation (only for fine pointer devices)
        const searchCard = document.querySelector("[data-hero='search-card']");
        const bgAccent = document.querySelector("[data-hero='bg-accent']");
        
        if (searchCard && window.matchMedia('(pointer: fine)').matches) {
          searchCard.addEventListener('mouseenter', () => {
            gsap.to(searchCard, { y: -2, duration: 0.25, ease: 'power1.out' });
            if (bgAccent) {
              gsap.to(bgAccent, { scale: 1.005, duration: 0.35, ease: 'power1.out' });
            }
          });
          
          searchCard.addEventListener('mouseleave', () => {
            gsap.to(searchCard, { y: 0, duration: 0.25, ease: 'power1.out' });
            if (bgAccent) {
              gsap.to(bgAccent, { scale: 1, duration: 0.35, ease: 'power1.out' });
            }
          });
        }

        // Search button press animation
        const searchButton = document.querySelector("[data-hero='search-button']");
        if (searchButton) {
          searchButton.addEventListener('pointerdown', () => {
            gsap.to(searchButton, { scale: 0.98, duration: 0.08, ease: 'power1.out' });
          });
          searchButton.addEventListener('pointerup', () => {
            gsap.to(searchButton, { scale: 1, duration: 0.08, ease: 'power1.out' });
          });
          searchButton.addEventListener('pointerleave', () => {
            gsap.to(searchButton, { scale: 1, duration: 0.08, ease: 'power1.out' });
          });
        }

        // Search card focus-within animation
        if (searchCard) {
          const handleFocusIn = () => {
            if (!prefersReducedMotion) {
              gsap.to(searchCard, { scale: 1.01, duration: 0.18, ease: 'power1.out' });
            }
          };
          const handleFocusOut = (e: FocusEvent) => {
            if (!searchCard.contains(e.relatedTarget as Node) && !prefersReducedMotion) {
              gsap.to(searchCard, { scale: 1, duration: 0.18, ease: 'power1.out' });
            }
          };
          searchCard.addEventListener('focusin', handleFocusIn);
          searchCard.addEventListener('focusout', handleFocusOut as EventListener);
        }

        // Secondary CTA hover animation
        const secondaryCta = document.querySelector("[data-hero='secondary-cta']");
        if (secondaryCta && window.matchMedia('(pointer: fine)').matches) {
          secondaryCta.addEventListener('mouseenter', () => {
            gsap.to(secondaryCta, { x: 2, duration: 0.18, ease: 'power1.out' });
          });
          secondaryCta.addEventListener('mouseleave', () => {
            gsap.to(secondaryCta, { x: 0, duration: 0.18, ease: 'power1.out' });
          });
        }

        // Verified toggle click animation (if present)
        const verifiedToggle = document.querySelector("[data-hero='verified-toggle']");
        if (verifiedToggle) {
          verifiedToggle.addEventListener('click', () => {
            if (!prefersReducedMotion) {
              gsap.fromTo(verifiedToggle, 
                { scale: 1 }, 
                { scale: 1.04, duration: 0.12, ease: 'power1.out', yoyo: true, repeat: 1 }
              );
            }
          });
        }

        // Scroll parallax for background accent
        if (bgAccent) {
          ScrollTrigger.create({
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            onUpdate: (self) => {
              gsap.to(bgAccent, {
                y: -18 * self.progress,
                ease: 'none',
                overwrite: 'auto',
              });
            },
          });
        }

        // Scroll parallax for background image
        const bgImage = document.querySelector("[data-hero='bg-image']");
        if (bgImage) {
          ScrollTrigger.create({
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            onUpdate: (self) => {
              gsap.to(bgImage, {
                y: -24 * self.progress,
                ease: 'none',
                overwrite: 'auto',
              });
            },
          });
        }
      }, root);
    });

    // Cleanup on unmount
    return () => {
      if (contextRef.current) {
        contextRef.current.revert();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return rootRef;
}
