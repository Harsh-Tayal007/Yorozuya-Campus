import React, { useRef, useEffect } from 'react';

/**
 * GlareHover - A pure overlay component that adds a light sweep/glare effect.
 * It NO LONGER wraps children to avoid breaking parent layouts (like flex/grid).
 * Use it as a sibling inside a relative + overflow-hidden container.
 */
const GlareHover = ({
  glareColor = '#ffffff',
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  className = '',
  enabled = true,
  active = false // Controlled trigger from parent hover state
}) => {
  // Hex to RGBA conversion for the glare
  const hex = glareColor.replace('#', '');
  let rgba = glareColor;
  if (/^[\dA-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[\dA-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const overlayRef = useRef(null);

  const animateIn = () => {
    if (!enabled) return;
    const el = overlayRef.current;
    if (!el) return;

    el.style.transition = 'none';
    el.style.backgroundPosition = '-100% -100%, 0 0';
    
    requestAnimationFrame(() => {
      if (!el) return;
      el.style.transition = `${transitionDuration}ms ease`;
      el.style.backgroundPosition = '100% 100%, 0 0';
    });
  };

  const animateOut = () => {
    if (!enabled) return;
    const el = overlayRef.current;
    if (!el) return;

    if (playOnce) {
      el.style.transition = 'none';
      el.style.backgroundPosition = '-100% -100%, 0 0';
    } else {
      el.style.transition = `${transitionDuration}ms ease`;
      el.style.backgroundPosition = '-100% -100%, 0 0';
    }
  };

  // Watch the active prop to trigger animations
  useEffect(() => {
    if (active) animateIn();
    else animateOut();
  }, [active]);

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(${glareAngle}deg,
        hsla(0,0%,0%,0) 60%,
        ${rgba} 70%,
        hsla(0,0%,0%,0) 100%)`,
    backgroundSize: `${glareSize}% ${glareSize}%, 100% 100%`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '-100% -100%, 0 0',
    pointerEvents: 'none',
    zIndex: 10
  };

  if (!enabled) return null;

  return (
    <div 
      ref={overlayRef} 
      style={overlayStyle} 
      className={`glare-hover-overlay ${className}`} 
    />
  );
};

export default GlareHover;
