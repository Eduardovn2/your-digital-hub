# ✅ TODO - Correção Raio de Entrega (CEP 23032030)

## ✅ 1. Análise completa [CONCLUÍDO]
- [x] delivery_rules vazia → causa raiz  
- [x] Distância Guaratiba → Icaraí/Niterói: ~35km
- [x] Código correto, faltam dados delivery_rules

## ✅ 2. Criar delivery_rules essenciais [EXECUTE AGORA]
```
INSERT INTO delivery_rules (store_id, max_km, price) VALUES
('4667a68e-df49-4fca-a383-e3e90fb5472a', 5, 8.00),
('4667a68e-df49-4fca-a383-e3e90fb5472a', 15, 12.00), 
('4667a68e-df49-4fca-a383-e3e90fb5472a', 30, 18.00),
('4667a68e-df49-4fca-a383-e3e90fb5472a', 50, 25.00);
```
**Cole no Supabase → SQL Editor → Run!**

## ✅ 3. Fallback ShippingCalculator [CONCLUÍDO]
Adicionado rules padrão se banco vazio

## ⏳ 4. Testar [PENDENTE]
- [ ] CEP 23032030 → ~35km + R$25
- [ ] Dashboard → Delivery Settings (ver regras)

## 🔮 5. Opcional - Integrar delivery_zones
Tabela existe mas não usada no checkout
