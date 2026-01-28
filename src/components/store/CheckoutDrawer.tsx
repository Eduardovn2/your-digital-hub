// src/components/store/CheckoutDrawer.tsx
// ... (imports permanecem iguais)

// ... Dentro do componente CheckoutDrawer, função handleSubmit:

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NÃO enviamos mais 'total', 'subtotal' ou 'delivery_fee' calculados aqui.
    // Enviamos apenas os dados crus para o servidor calcular.
    
    await createOrder.mutateAsync({
      order: {
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress || null,
        status: 'pending',
        notes: notes || null,
        // Os campos abaixo são obrigatórios pelo tipo TypeScript atual, 
        // mas serão ignorados ou recalculados pela RPC. 
        // Podemos passar 0 ou valores de display, pois a RPC é quem manda.
        subtotal: 0, 
        delivery_fee: 0,
        total: 0, 
      },
      items: items.map(item => ({
        id: item.id,        // A RPC espera 'product_id' mas mapeamos no hook
        quantity: item.quantity,
        notes: null, // ou item.notes se houver campo para isso
      })),
      deliveryZoneId: selectedZoneId // Passamos o ID da zona para cálculo no server
    });

    setStep('success');
    clearCart();
  };

// ... (resto do arquivo)