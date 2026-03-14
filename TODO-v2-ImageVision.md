# 🔄 DONUM Image Vision Autofill v2

## Plan (User Approved)

**Goal:** Exact item detection from **UPLOADED IMAGES** (rice→"Rice Bag", books→"Textbooks")

### 1. ✅ Initial Analysis (done)
### 2. ✅ Create this TODO (done)

### 3. 🔄 Edit geminiService.ts (Vision Priority)
```
- Prompt: "VISUAL ANALYSIS FIRST: Describe EXACT items in images"
- Schema: image_weight: high  
- Fallback: "Image unclear → [text/keyword mock]"
```

### 4. 🔄 Edit DonationForm.tsx (Image UX)
```
- Button: "🔍 Analyzing [N] Images + Text..."
- Success: "✅ Photo detected: [title] ([category])"
- Error: "Image needs better lighting/try text"
```

### 5. ✅ Test Flow
```
Upload photo of rice → Analyze 
→ Expect: "White Rice Bag (Food)" or similar
→ Console: Vision logs
→ F12 Network: Gemini API call
```

### 6. 🔄 PR on blackboxai/image-vision-fix

**Status:** Ready for service + UI edits.
