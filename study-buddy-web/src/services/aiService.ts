const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';

export interface AIRequest {
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  }>;
  content?: string;
  count?: number;
  model?: string;
  type?: 'text' | 'flashcards';
  imageBase64?: string;
  prompt?: string;
  wordCount?: number;
  level?: string;
  citationStyle?: string;
  mode?: string;
  fileIds?: string[];
  rubric?: string;
  essayTopic?: string;
  sampleEssayId?: string;
  outlineId?: string;
  paragraphIndex?: number;
  paragraphTitle?: string;
  intendedChunks?: Array<{ excerpt: string }>;
  suggestedWordCount?: number;
  academicLevel?: string;
  references?: Array<{ name: string; excerpt: string }>;
  assignmentTitle?: string;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  flashcards?: Array<{ front: string; back: string }>;
  outlineId?: string;
  thesis?: string;
  paragraphs?: Array<{
    title: string;
    intendedChunks: Array<{ excerpt: string }>;
    suggestedWordCount: number;
  }>;
  paragraphText?: string;
  usedChunks?: Array<{ label: string; page: number }>;
  citations?: Array<{ text: string; source: string }>;
  unsupportedFlags?: Array<{ sentence: string; reason: string }>;
  analysis?: Record<string, {
    relevanceScore: number;
    keyTopics: string[];
    summary: string;
    confidence: number;
    sourceCredibility: string;
    sourceType: string;
    domain: string;
  }>;
  smartSelection?: {
    selectedReferences: string[];
    excludedReferences: string[];
    reasoning: string;
    totalReferences: number;
    selectedCount: number;
    credibilityFilter: string;
  };
  error?: string;
  timestamp?: string;
  source?: string;
}

class AIService {
  private async makeRequest(endpoint: string, data: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // General AI generation
  async generateText(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/generate', request);
  }

  // Flashcard generation
  async generateFlashcards(request: AIRequest): Promise<AIResponse> {
    // Transform the request to match backend expectations
    let transformedRequest: AIRequest;
    
    if (request.messages && request.messages.length > 0) {
      // Extract content from messages array
      const userMessage = request.messages.find(msg => msg.role === 'user');
      const content = userMessage?.content as string || '';
      transformedRequest = {
        content,
        count: request.count || 5,
        model: request.model || 'openai/gpt-3.5-turbo'
      };
    } else {
      // Use the request as-is if it already has content
      transformedRequest = request;
    }
    
    return this.makeRequest('/ai/flashcards', transformedRequest);
  }

  // OCR text extraction
  async extractTextFromImage(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/ocr', request);
  }

  // Essay outline generation
  async generateEssayOutline(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/generate-outline', request);
  }

  // Essay paragraph expansion
  async expandParagraph(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/expand-paragraph', request);
  }

  // Reference analysis
  async analyzeReferences(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/analyze-references', request);
  }
}

export const aiService = new AIService();
