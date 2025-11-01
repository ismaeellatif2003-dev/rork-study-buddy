# Personalized AI Learning System

## Overview

Study Buddy now includes a sophisticated **RAG (Retrieval-Augmented Generation)** system that enables the AI to learn from each user's notes and questions, providing personalized, context-aware answers.

## How It Works

### 1. **Embedding Generation**
- When notes are created or updated, embeddings (vector representations) are automatically generated
- Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- Embeddings are stored in PostgreSQL using the `pgvector` extension

### 2. **Semantic Search**
- When a user asks a question, an embedding is generated for the question
- Vector similarity search finds the most relevant notes from the user's collection
- Returns top 5 most similar notes based on cosine similarity

### 3. **Personalized Context**
- The AI receives the user's relevant notes as context
- System prompts are personalized based on the user's knowledge profile
- Answers reference the user's own study materials

### 4. **Learning & Memory**
- All questions and answers are stored for pattern learning
- Topics are extracted and tracked in the user's knowledge profile
- Weak areas and strong areas are identified over time

## Database Schema

### New Tables

1. **note_embeddings**
   - Stores vector embeddings for notes
   - Supports both note content and summaries
   - Indexed with HNSW for fast similarity search

2. **user_questions**
   - Tracks all user questions and AI responses
   - Stores context note IDs and topic tags
   - Used for learning patterns

3. **user_knowledge_profiles**
   - Stores personalized learning profiles
   - Tracks topics studied, weak/strong areas
   - Stores study preferences and question patterns

## API Endpoints

### `POST /ai/personalized-chat`
Personalized chat endpoint that uses user's notes as context.

**Request:**
```json
{
  "question": "What is photosynthesis?",
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on your notes about...",
  "contextNotes": [
    {
      "id": 123,
      "title": "Biology Notes",
      "similarity": 0.85
    }
  ],
  "topics": ["photosynthesis", "biology"],
  "timestamp": "..."
}
```

### `POST /ai/embed`
Generate embedding for any text.

### `POST /notes/:noteId/embed`
Manually trigger embedding generation for a specific note.

## Automatic Features

- **Auto-embedding**: Embeddings are automatically generated when notes are created/updated
- **Auto-learning**: Questions and answers are automatically stored for pattern learning
- **Profile updates**: Knowledge profiles are updated as users interact with the AI

## Setup Requirements

### 1. Database Migration
Run the migration to create new tables:
```sql
-- Run: railway-backend/database/migrations/001_add_ai_learning_tables.sql
```

### 2. PostgreSQL Extension
Ensure `pgvector` extension is installed:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Environment Variables
No additional environment variables needed - uses existing `OPENAI_API_KEY` or `OPENROUTER_API_KEY`.

## Benefits

✅ **Personalized Answers**: AI answers based on user's own notes  
✅ **Context-Aware**: Understands what the user has studied  
✅ **Progressive Learning**: Gets smarter as users interact more  
✅ **Topic Tracking**: Identifies what users know and struggle with  
✅ **Study Insights**: Provides feedback on learning patterns  

## Performance Considerations

- Embedding generation is done asynchronously (non-blocking)
- Vector search is optimized with HNSW index
- Responses cached when possible
- Fallback to general AI if no relevant notes found

## Future Enhancements

- Fine-tune models per user (advanced)
- Multi-modal embeddings (images, diagrams)
- Collaborative learning (learn from similar users)
- Predictive question generation
- Automated study plan creation

