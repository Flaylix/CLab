(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let vantaEffect;
  const initVanta = () => {
    if (typeof VANTA === 'undefined' || typeof THREE === 'undefined') return;
    if (vantaEffect) vantaEffect.destroy();
    vantaEffect = VANTA.CELLS({
      el: '#vanta-bg',
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      color1: 0xffffff,
      color2: 0x0,
      size: 1,
      speed: 1.3,
    });
  };
  window.addEventListener('load', initVanta);
  window.addEventListener('resize', () => {
    clearTimeout(window._vantaT);
    window._vantaT = setTimeout(initVanta, 200);
  });
})();
