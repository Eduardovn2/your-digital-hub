export const flyToCart = (e: React.MouseEvent, imageSrc: string) => {
  const cart = document.getElementById('cart-trigger');
  if (!cart) return;

  // 1. Criação Otimizada
  const flyer = document.createElement('img');
  flyer.src = imageSrc;
  flyer.className = 'fly-item'; // Classe CSS para will-change (adicione no global.css se puder)

  const startX = e.clientX;
  const startY = e.clientY;

  // 2. ESTILO INICIAL (Sem sombras pesadas para não travar o mobile)
  Object.assign(flyer.style, {
    position: 'fixed',
    zIndex: '99999',
    left: '0',
    top: '0',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    pointerEvents: 'none',
    // Usamos translate3d para iniciar na posição do clique sem mexer no layout
    transform: `translate3d(${startX - 40}px, ${startY - 40}px, 0) scale(0.5)`,
    // Sombra simples (sem spread radius grande) para performance
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)', 
    border: '2px solid white',
    opacity: '1',
    transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s ease-in'
  });

  document.body.appendChild(flyer);

  // 3. O VOO (Usando requestAnimationFrame para sincronia com a tela)
  requestAnimationFrame(() => {
    // Força o navegador a reconhecer o elemento antes de animar
    flyer.getBoundingClientRect();

    // Calcula o destino
    const cartRect = cart.getBoundingClientRect();
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;

    // Define o destino final com translate3d (GPU pura)
    flyer.style.transform = `translate3d(${targetX - 40}px, ${targetY - 40}px, 0) scale(0.1)`;
    flyer.style.opacity = '0.5'; // Desaparece suavemente no final
  });

  // 4. LIMPEZA
  setTimeout(() => {
    flyer.remove();
    
    // Animação leve no carrinho (sem layout trashing)
    cart.style.transform = 'scale(1.1)';
    setTimeout(() => { cart.style.transform = 'scale(1)'; }, 150);
    
  }, 600); // Sincronizado com a transição de 0.6s
};