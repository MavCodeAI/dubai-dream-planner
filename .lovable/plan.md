
# دو مسائل کی اصلاح کا منصوبہ

## مسئلہ 1: Trip Type کے مطابق Travelers کی خودکار تبدیلی

### موجودہ صورتحال
ابھی جب صارف Solo/Couple/Family/Group سلیکٹ کرتا ہے تو Adults اور Children کی تعداد میں کوئی تبدیلی نہیں ہوتی۔

### حل
جب Trip Type تبدیل ہو تو Adults اور Children خود بخود سیٹ ہوں:

| Trip Type | Adults | Children |
|-----------|--------|----------|
| Solo | 1 | 0 |
| Couple | 2 | 0 |
| Family | 2 | 1 |
| Group | 4 | 0 |

### تبدیلیاں

**فائل: `src/pages/Onboarding.tsx`**
- `onTripTypeChange` کے ساتھ Adults اور Children بھی اپڈیٹ کریں
- نیا فنکشن بنائیں جو Trip Type کے مطابق تعداد سیٹ کرے:

```text
handleTripTypeChange(tripType) {
  switch(tripType) {
    case 'solo':
      adults = 1, children = 0
    case 'couple':
      adults = 2, children = 0
    case 'family':
      adults = 2, children = 1
    case 'group':
      adults = 4, children = 0
  }
}
```

---

## مسئلہ 2: Budget میں Plus/Minus بٹنز

### موجودہ صورتحال
Budget سیکشن میں صرف Input اور Slider ہے۔

### حل
Adults/Children جیسے Plus/Minus (+/-) بٹنز شامل کریں۔

### تبدیلیاں

**فائل: `src/components/onboarding/BudgetStep.tsx`**

Input کے ساتھ Plus/Minus بٹنز شامل کریں:

```text
┌─────────────────────────────────────────────────────┐
│  [-]  $  │  2,000  │ USD  [+]                       │
└─────────────────────────────────────────────────────┘
```

- Minus بٹن: بجٹ $100 کم کرے (minimum $100)
- Plus بٹن: بجٹ $100 زیادہ کرے (maximum $50,000)
- Lucide icons استعمال ہوں گے (Minus, Plus)

---

## تکنیکی تفصیلات

### فائل 1: `src/pages/Onboarding.tsx`
- نیا `handleTripTypeChange` فنکشن بنائیں
- یہ فنکشن `tripType`, `adults`, اور `children` تینوں اپڈیٹ کرے

### فائل 2: `src/components/onboarding/BudgetStep.tsx`
- `Button` اور `Minus`, `Plus` icons import کریں
- Input کے دائیں اور بائیں طرف Plus/Minus بٹنز لگائیں
- ہر کلک پر $100 کم/زیادہ ہو
- بٹنز disabled ہوں جب min/max تک پہنچ جائیں
