import { authFetch } from './dataService';

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
      const result = await authFetch('/video/analyze-url', {
        method: 'POST',
        body: JSON.stringify({ url, userEmail }),
      });
      console.log('✅ Video analysis started successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      
      // If authentication fails, provide a helpful message
      if (error instanceof Error && error.message.includes('authentication')) {
        throw new Error('Video analysis requires authentication. Please sign out and sign back in to refresh your authentication.');
      }
      
      throw error;
    }
  }

  // Analyze uploaded video file
  static async analyzeVideoFile(file: File, userEmail: string): Promise<VideoAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userEmail', userEmail);

    return authFetch('/video/analyze-file', {
      method: 'POST',
      body: formData,
    });
  }

  // Get analysis status
  static async getAnalysisStatus(analysisId: string): Promise<VideoAnalysisResult> {
    return authFetch(`/video/analysis/${analysisId}`);
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
