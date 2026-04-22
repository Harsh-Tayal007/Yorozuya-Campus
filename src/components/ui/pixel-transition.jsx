import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

/**
 * PixelTransition - A pixelated grid transition component powered by GSAP.
 * 
 * @param {React.ReactNode} firstContent - The initial content to display.
 * @param {React.ReactNode} secondContent - The content revealed after the transition.
 * @param {number} gridSize - Number of pixels per row/column (default 7).
 * @param {string} pixelColor - Color of the transition pixels (default 'currentColor').
 * @param {number} animationStepDuration - Duration of the pixelation phase in seconds (default 0.3).
 * @param {boolean} once - If true, the transition only happens once and stays active.
 * @param {string} aspectRatio - Padding-top value to maintain aspect ratio (default '100%').
 * @param {string} className - Additional CSS classes for the container.
 * @param {object} style - Inline styles for the container.
 */
const PixelTransition = ({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelColor = 'currentColor',
  animationStepDuration = 0.3,
  once = false,
  aspectRatio = '100%',
  className = '',
  style = {},
  enableAutoplay = false,
  autoplayInterval = 4000
}) => {
  const containerRef = useRef(null);
  const pixelGridRef = useRef(null);
  const activeRef = useRef(null);
  const primaryRef = useRef(null);
  const delayedCallRef = useRef(null);

  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    pixelGridEl.innerHTML = '';

    const totalGrid = gridSize * gridSize;
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixelated-transition__pixel');
        pixel.classList.add('absolute', 'hidden');
        pixel.style.backgroundColor = pixelColor;

        const size = 100 / gridSize;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;

        fragment.appendChild(pixel);
      }
    }
    pixelGridEl.appendChild(fragment);
  }, [gridSize, pixelColor]);

  const animatePixels = (activate) => {
    setIsActive(activate);

    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    if (!pixelGridEl || !activeEl) return;

    const pixels = pixelGridEl.querySelectorAll('.pixelated-transition__pixel');
    if (!pixels.length) return;

    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) {
      delayedCallRef.current.kill();
    }

    gsap.set(pixels, { display: 'none' });

    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    // Phase 1: Randomly show all pixels
    gsap.to(pixels, {
      display: 'block',
      duration: 0,
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });

    // Phase 2: Switch the content visibility at the mid-point of the animation
    delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
      activeEl.style.display = activate ? 'block' : 'none';
      activeEl.style.pointerEvents = activate ? 'none' : 'auto';
      if (primaryRef.current) {
        primaryRef.current.style.display = activate ? 'none' : 'block';
      }
    });

    // Phase 3: Hide pixels back to reveal the new content
    gsap.to(pixels, {
      display: 'none',
      duration: 0,
      delay: animationStepDuration,
      stagger: {
        each: staggerDuration,
        from: 'random'
      }
    });
  };

  // Autoplay logic
  useEffect(() => {
    if (!enableAutoplay) return;

    const interval = setInterval(() => {
      animatePixels(!isActive);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [enableAutoplay, isActive, autoplayInterval]);

  return (
    <div
      ref={containerRef}
      className={`
        ${className}
        relative
        overflow-hidden
        focus:outline-none
      `}
      style={style}
    >
      <div style={{ paddingTop: aspectRatio }} />

      {/* Primary Content (Visible initially) */}
      <div ref={primaryRef} className="absolute inset-0 w-full h-full" aria-hidden={isActive}>
        {firstContent}
      </div>

      {/* Secondary Content (Revealed on activation) */}
      <div
        ref={activeRef}
        className="absolute inset-0 w-full h-full z-[2]"
        style={{ display: 'none' }}
        aria-hidden={!isActive}
      >
        {secondContent}
      </div>

      {/* Transition Layer */}
      <div ref={pixelGridRef} className="absolute inset-0 w-full h-full pointer-events-none z-[3]" />
    </div>
  );
};

export default PixelTransition;
