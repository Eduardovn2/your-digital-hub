export const flyToCart = (e: React.MouseEvent, imageSrc: string) => {
  const cart = document.getElementById('cart-trigger');
  
  if (!cart) return;

  // 1. Cria o clone
  const flyer = document.createElement('img');
  flyer.src = imageSrc;
  
  const startX = e.clientX;
  const startY = e.clientY;

  // 2. ESTILO INICIAL (MAIOR E MAIS IMPONENTE)
  Object.assign(flyer.style, {
    position: 'fixed',
    zIndex: '99999',
    left: `${startX}px`,
    top: `${startY}px`,
    width: '80px',  // <--- AUMENTEI AQUI (Era 50px)
    height: '80px', // <--- AUMENTEI AQUI
    borderRadius: '50%',
    objectFit: 'cover',
    pointerEvents: 'none',
    
    // Sombra Glass Theme forte
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
    border: '3px solid rgba(255, 255, 255, 0.9)',
    
    // Configuração da animação (0.7s é rápido e suave)
    transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease-in',
    
    transform: 'translate(-50%, -50%) scale(0.5)', // Começa pequeno (efeito pop)
    opacity: '1'
  });

  document.body.appendChild(flyer);

  // 3. MOVIMENTO
  requestAnimationFrame(() => {
    // Efeito "Pop" inicial (cresce rápido antes de voar)
    flyer.style.transform = 'translate(-50%, -50%) scale(1)';

    setTimeout(() => {
        const cartRect = cart.getBoundingClientRect();
        
        const targetX = cartRect.left + cartRect.width / 2;
        const targetY = cartRect.top + cartRect.height / 2;

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        // O VOO FINAL
        // translate: move
        // scale(0.2): diminui para caber na sacola
        // rotate: gira
        flyer.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2) rotate(360deg)`;
        
        // <--- CORREÇÃO DO "DELAY": Opacidade vai para 0 (some totalmente)
        flyer.style.opacity = '0'; 
    }, 50);
  });

  // 4. LIMPEZA E IMPACTO (Sincronizado perfeitamente com 0.7s + 50ms)
  setTimeout(() => {
    flyer.remove(); // Remove do DOM assim que a transição acaba
    
    // Efeito "Geleia" na Sacola (Absorvendo o item)
    cart.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.9)' },  // Encolhe (recebeu impacto)
        { transform: 'scale(1.15)' }, // Estica (energia)
        { transform: 'scale(1)' }     // Normal
    ], {
        duration: 300,
        easing: 'ease-out'
    });
    
  }, 750); // 700ms (transição) + 50ms (delay inicial) = 750ms exatos
};