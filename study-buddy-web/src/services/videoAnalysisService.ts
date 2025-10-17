import { authFetch } from './dataService';

// Non-authenticated fetch for video analysis endpoints
const videoFetch = async (endpoint: string, options: RequestInit = {}) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';
  
  console.log('🎥 Making video analysis request:', {
    endpoint,
    url: `${API_BASE}${endpoint}`,
    method: options.method || 'GET'
  });

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('📡 Video analysis response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
        console.log('📄 Video analysis error response:', error);
      } catch (parseError) {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          console.log('📄 Video analysis text error response:', errorText);
        } catch (textError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.log('📄 Could not parse video analysis error response:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Video analysis request successful:', result);
    return result;
  } catch (error) {
    console.error('🚨 Video analysis network error:', error);
    throw error;
  }
};

export interface VideoAnalysisResult {
  id: string;
  title: string;
  source: 'youtube' | 'upload';
  sourceUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
  transcript?: string;
  duration?: number;
  topics?: VideoTopic[];
  overallSummary?: string;
  flashcards?: Array<{ id: string; front: string; back: string }>;
  error?: string;
}

export interface VideoTopic {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  content: string;
  summary?: string;
}

export class VideoAnalysisService {
  // Analyze YouTube video
  static async analyzeYouTubeUrl(url: string, userEmail: string): Promise<VideoAnalysisResult> {
    console.log('🎥 Starting YouTube video analysis:', { url, userEmail });
    try {
      const result = await videoFetch('/video/analyze-url', {
        method: 'POST',
        body: JSON.stringify({ url, userEmail }),
      });
      console.log('✅ Video analysis started successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      throw error;
    }
  }

  // Analyze uploaded video file
  static async analyzeVideoFile(file: File, userEmail: string): Promise<VideoAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userEmail', userEmail);

    return videoFetch('/video/analyze-file', {
      method: 'POST',
      body: formData,
    });
  }

  // Get analysis status
  static async getAnalysisStatus(analysisId: string): Promise<VideoAnalysisResult> {
    return videoFetch(`/video/analysis/${analysisId}`);
  }

  // Generate summary for topic or overall
  static async generateSummary(
    analysisId: string, 
    type: 'topic' | 'overall', 
    topicId?: string
  ): Promise<{ summary: string }> {
    return authFetch('/video/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ analysisId, type, topicId }),
    });
  }

  // Generate flashcards for topic
  static async generateFlashcards(
    analysisId: string, 
    topicId: string
  ): Promise<{ flashcards: Array<{ id: string; front: string; back: string }> }> {
    return authFetch('/video/generate-flashcards', {
      method: 'POST',
      body: JSON.stringify({ analysisId, topicId }),
    });
  }

  // Save analysis to notes
  static async saveNotes(analysisId: string): Promise<{ success: boolean; notesCreated: number }> {
    return authFetch('/video/save-notes', {
      method: 'POST',
      body: JSON.stringify({ analysisId }),
    });
  }

  // Save analysis to flashcards
  static async saveFlashcards(analysisId: string): Promise<{ success: boolean; flashcardsCreated: number }> {
    return authFetch('/video/save-flashcards', {
      method: 'POST',
      body: JSON.stringify({ analysisId }),
    });
  }

  // Poll for analysis completion
  static async pollAnalysisStatus(
    analysisId: string, 
    onProgress?: (result: VideoAnalysisResult) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<VideoAnalysisResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.getAnalysisStatus(analysisId);
        
        if (onProgress) {
          onProgress(result);
        }
        
        if (result.status === 'completed' || result.status === 'failed') {
          return result;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
      } catch (error) {
        console.error('Error polling analysis status:', error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('Failed to get analysis status after maximum attempts');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    throw new Error('Analysis polling timeout');
  }
}

export default VideoAnalysisService;
