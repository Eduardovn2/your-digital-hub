# TODO Pickup - Status

## ✅ Backend
- [x] pickup_order BOOLEAN in orders
- [x] payload pickup_order=true + delivery_fee=0

## ✅ Frontend Context
- [x] CartContext pickupMode/setPickupMode
- [x] useCart OK

## ❌ Frontend Render (CRÍTICO)
- [ ] CartDrawer SheetContent → procura "Retirar" F12 = NADA
- [ ] Toggle JSX não renderiza
- [ ] Header setIsCartOpen(true) → abre?

## 🔧 Debug
```
1. Ctrl+Shift+R hard reload
2. Console: pickupMode value?
3. Adicionar item carrinho
4. F12 Elements: "Retirar na Loja"
```

## Next
1. Fix CartDrawer Sheet real structure
2. Toggle dentro SheetContent value="cart"
3. Deploy vercel --prod
