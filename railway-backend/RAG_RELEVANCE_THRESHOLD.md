# RAG Relevance Threshold Implementation

## Overview

The `/ai/personalized-chat` endpoint now uses a **relevance threshold** to determine when to use RAG (Retrieval-Augmented Generation) vs. general AI.

## How It Works

### Before
- Always used saved notes as context if any notes existed (regardless of relevance)
- Could provide answers based on unrelated notes

### After
- **Only uses saved notes if they're actually relevant** (similarity ≥ 70%)
- Falls back to general AI if notes aren't relevant enough
- Still uses selected text (from Chrome extension) as it's always considered relevant

## Relevance Threshold

**Current Threshold: `0.7` (70% similarity)**

- Similarity scores range from `0` (no similarity) to `1` (identical)
- If the top note's similarity is **≥ 0.7**, the system uses RAG with notes
- If the top note's similarity is **< 0.7**, the system uses general AI (no notes)

### Adjusting the Threshold

The threshold is defined in `railway-backend/hono.ts` at line 1121:

```typescript
const RELEVANCE_THRESHOLD = 0.7; // Adjust this value (0.0 to 1.0)
```

**Recommended values:**
- **0.6-0.65**: More lenient - uses notes more often (may include less relevant notes)
- **0.7**: Balanced (current) - good balance between relevance and coverage
- **0.75-0.8**: Stricter - only uses notes when they're very relevant (may miss some relevant notes)

## Behavior Examples

### Example 1: Relevant Question
- **User asks:** "What is photosynthesis?"
- **User has notes about:** Biology, plants, cellular processes
- **Top note similarity:** 0.85
- **Result:** ✅ Uses RAG with notes (similarity ≥ 0.7)

### Example 2: Unrelated Question
- **User asks:** "How do I cook pasta?"
- **User has notes about:** Biology, chemistry, math
- **Top note similarity:** 0.45
- **Result:** ⚠️ Uses general AI (similarity < 0.7, notes not relevant)

### Example 3: Selected Text
- **User asks:** "Explain this concept"
- **User selected text:** (relevant text from webpage)
- **User has notes:** (may or may not be relevant)
- **Result:** ✅ Always uses selected text as context (user explicitly selected it)

## Logging

The system logs which mode it's using:

```
✅ Top note similarity (0.852) meets threshold. Using RAG with 3 relevant notes.
```

or

```
⚠️ Top note similarity (0.452) below threshold (0.7). Using general AI instead of RAG.
```

## Benefits

1. **Better accuracy**: Only uses notes when they're actually relevant
2. **Prevents confusion**: Avoids answering questions based on unrelated notes
3. **Flexible**: Still works for general questions using AI knowledge
4. **Smart fallback**: Automatically switches between RAG and general AI

## Testing

To test the threshold:

1. Create notes about a specific topic (e.g., "Biology")
2. Ask a question related to that topic → Should use RAG
3. Ask a question about something completely different → Should use general AI
4. Check backend logs to see which mode was used

## Deployment

This is a **backend-only change** - no store updates needed!

- ✅ Web app: Automatically uses new behavior
- ✅ Chrome extension: Automatically uses new behavior  
- ✅ Mobile app: Not affected (uses different endpoint)

Just deploy the backend to Railway and the changes take effect immediately.

