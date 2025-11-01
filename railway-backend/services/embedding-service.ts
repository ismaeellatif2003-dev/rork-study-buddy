import OpenAI from 'openai';

/**
 * Embedding Service
 * Generates vector embeddings for text using OpenAI's embedding models
 * Used for semantic search and RAG (Retrieval-Augmented Generation)
 */
export class EmbeddingService {
  private openai: OpenAI | null = null;
  private readonly model = 'text-embedding-3-small'; // 1536 dimensions, cost-effective
  private readonly dimension = 1536;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: process.env.OPENROUTER_API_KEY 
          ? 'https://openrouter.ai/api/v1' 
          : undefined
      });
      console.log('✅ Embedding service initialized');
    } else {
      console.log('⚠️ Embedding service not available - no API key found');
    }
  }

  /**
   * Generate embedding for a text string
   * @param text The text to embed
   * @returns Array of numbers representing the embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      console.warn('⚠️ OpenAI client not initialized, returning mock embedding');
      // Return a mock embedding of correct dimensions
      return new Array(this.dimension).fill(0).map(() => Math.random() * 0.01);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.trim(),
        dimensions: this.dimension
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned');
      }

      const embedding = response.data[0].embedding;
      console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
      return embedding;
    } catch (error: any) {
      console.error('❌ Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      console.warn('⚠️ OpenAI client not initialized, returning mock embeddings');
      return texts.map(() => new Array(this.dimension).fill(0).map(() => Math.random() * 0.01));
    }

    if (texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts to embed');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: validTexts.map(t => t.trim()),
        dimensions: this.dimension
      });

      if (!response.data || response.data.length !== validTexts.length) {
        throw new Error('Unexpected number of embeddings returned');
      }

      const embeddings = response.data.map(item => item.embedding);
      console.log(`✅ Generated ${embeddings.length} embeddings in batch`);
      return embeddings;
    } catch (error: any) {
      console.error('❌ Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param embedding1 First embedding vector
   * @param embedding2 Second embedding vector
   * @returns Cosine similarity score (0-1, where 1 is most similar)
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Extract topics/keywords from text (simple keyword extraction)
   * This is a placeholder - can be enhanced with NLP models
   */
  extractTopics(text: string, limit: number = 5): string[] {
    // Simple keyword extraction - can be enhanced with actual NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4); // Filter out short words
    
    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top N keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();

