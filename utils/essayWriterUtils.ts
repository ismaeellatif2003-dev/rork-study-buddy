/**
 * Utility Functions for Grounded Essay Writer
 * 
 * This module provides utility functions for file handling, export functionality,
 * and other common operations used by the essay writer component.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

// Types
export interface FileItem {
  id: string;
  group: 'notes' | 'references';
  name: string;
  excerpt: string;
  priority: boolean;
  order: number;
  pages?: number;
  type: 'file' | 'text' | 'url';
}

export interface Paragraph {
  title: string;
  expandedText?: string;
  usedChunks?: Array<{ label: string; page?: number }>;
  citations?: Array<{ text: string; source: string }>;
  unsupportedFlags?: Array<{ sentence: string; reason: string }>;
}

export interface EssayData {
  title: string;
  thesis: string;
  paragraphs: Paragraph[];
  metadata: {
    totalWords: number;
    citationsCount: number;
    chunksUsed: number;
  };
}

/**
 * File handling utilities
 */
export const fileUtils = {
  /**
   * Validate file type and size
   */
  validateFile: (file: { name: string; size?: number; type?: string }): { valid: boolean; error?: string } => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size && file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    if (file.type && !allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please use TXT, PDF, DOCX, PNG, or JPG files.' };
    }
    
    return { valid: true };
  },

  /**
   * Extract text from different file types
   */
  extractText: async (fileUri: string, fileType: string): Promise<string> => {
    try {
      if (fileType === 'text/plain') {
        return await FileSystem.readAsStringAsync(fileUri);
      } else if (fileType === 'application/pdf') {
        // TODO: Implement PDF text extraction
        // For now, return placeholder text
        return 'PDF content extraction not implemented. Please use text files for now.';
      } else if (fileType.includes('wordprocessingml.document')) {
        // TODO: Implement DOCX text extraction
        return 'DOCX content extraction not implemented. Please use text files for now.';
      } else if (fileType.startsWith('image/')) {
        // TODO: Implement OCR for images
        return 'Image OCR not implemented. Please use text files for now.';
      }
      
      return 'Unsupported file type';
    } catch (error) {
      console.error('Error extracting text:', error);
      return 'Error reading file content';
    }
  },

  /**
   * Generate unique file ID
   */
  generateFileId: (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get file extension from filename
   */
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

/**
 * Text processing utilities
 */
export const textUtils = {
  /**
   * Extract excerpt from text
   */
  extractExcerpt: (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    
    const excerpt = text.substring(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(' ');
    
    return lastSpace > 0 ? excerpt.substring(0, lastSpace) + '...' : excerpt + '...';
  },

  /**
   * Count words in text
   */
  countWords: (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  /**
   * Estimate reading time
   */
  estimateReadingTime: (wordCount: number, wordsPerMinute: number = 200): number => {
    return Math.ceil(wordCount / wordsPerMinute);
  },

  /**
   * Clean and normalize text
   */
  cleanText: (text: string): string => {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim();
  },

  /**
   * Extract sentences for analysis
   */
  extractSentences: (text: string): string[] => {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }
};

/**
 * Export utilities
 */
export const exportUtils = {
  /**
   * Generate plain text essay
   */
  generatePlainText: (essayData: EssayData): string => {
    const { title, thesis, paragraphs } = essayData;
    
    let content = `${title}\n\n`;
    content += `Thesis: ${thesis}\n\n`;
    
    paragraphs.forEach((paragraph, index) => {
      content += `${index + 1}. ${paragraph.title}\n\n`;
      if (paragraph.expandedText) {
        content += `${paragraph.expandedText}\n\n`;
      }
    });
    
    return content;
  },

  /**
   * Generate essay with citations
   */
  generateWithCitations: (essayData: EssayData): string => {
    const { title, thesis, paragraphs } = essayData;
    
    let content = `${title}\n\n`;
    content += `Thesis: ${thesis}\n\n`;
    
    paragraphs.forEach((paragraph, index) => {
      content += `${index + 1}. ${paragraph.title}\n\n`;
      if (paragraph.expandedText) {
        let paragraphText = paragraph.expandedText;
        
        // Add inline citations
        if (paragraph.citations) {
          paragraph.citations.forEach(citation => {
            paragraphText = paragraphText.replace(
              citation.text,
              `${citation.text} (${citation.source})`
            );
          });
        }
        
        content += `${paragraphText}\n\n`;
      }
    });
    
    return content;
  },

  /**
   * Generate HTML format
   */
  generateHTML: (essayData: EssayData): string => {
    const { title, thesis, paragraphs } = essayData;
    
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        h2 { color: #666; margin-top: 30px; }
        .thesis { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007acc; }
        .unsupported { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .citation { color: #007acc; font-weight: bold; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="thesis">
        <strong>Thesis:</strong> ${thesis}
    </div>`;

    paragraphs.forEach((paragraph, index) => {
      html += `\n    <h2>${index + 1}. ${paragraph.title}</h2>`;
      
      if (paragraph.expandedText) {
        let paragraphText = paragraph.expandedText;
        
        // Handle unsupported flags
        if (paragraph.unsupportedFlags) {
          paragraph.unsupportedFlags.forEach(flag => {
            paragraphText = paragraphText.replace(
              flag.sentence,
              `<span class="unsupported">${flag.sentence} [UNSUPPORTED: ${flag.reason}]</span>`
            );
          });
        }
        
        // Add citations
        if (paragraph.citations) {
          paragraph.citations.forEach(citation => {
            paragraphText = paragraphText.replace(
              citation.text,
              `<span class="citation">${citation.text}</span>`
            );
          });
        }
        
        html += `\n    <p>${paragraphText}</p>`;
      }
    });
    
    html += `\n</body>\n</html>`;
    return html;
  },

  /**
   * Save text to file and share
   */
  saveAndShare: async (content: string, filename: string, mimeType: string = 'text/plain'): Promise<void> => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, content);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Save Essay'
        });
      } else {
        Alert.alert('Success', 'File saved successfully');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Error', 'Failed to save file');
    }
  },

  /**
   * Copy text to clipboard (React Native implementation)
   */
  copyToClipboard: async (text: string): Promise<void> => {
    try {
      // In React Native, you would use Clipboard from @react-native-clipboard/clipboard
      // For now, we'll use the Share API as a fallback
      const { Share } = await import('react-native');
      await Share.share({
        message: text,
        title: 'Essay Content'
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }
};

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Validate essay prompt
   */
  validatePrompt: (prompt: string): { valid: boolean; error?: string } => {
    if (!prompt.trim()) {
      return { valid: false, error: 'Essay prompt is required' };
    }
    
    if (prompt.length < 10) {
      return { valid: false, error: 'Essay prompt must be at least 10 characters long' };
    }
    
    if (prompt.length > 1000) {
      return { valid: false, error: 'Essay prompt must be less than 1000 characters' };
    }
    
    return { valid: true };
  },

  /**
   * Validate word count
   */
  validateWordCount: (wordCount: number): { valid: boolean; error?: string } => {
    if (wordCount < 100) {
      return { valid: false, error: 'Word count must be at least 100 words' };
    }
    
    if (wordCount > 5000) {
      return { valid: false, error: 'Word count must be less than 5000 words' };
    }
    
    return { valid: true };
  },

  /**
   * Validate file upload
   */
  validateFileUpload: (files: FileItem[]): { valid: boolean; error?: string } => {
    if (files.length === 0) {
      return { valid: false, error: 'At least one file or text input is required' };
    }
    
    const notesCount = files.filter(f => f.group === 'notes').length;
    const referencesCount = files.filter(f => f.group === 'references').length;
    
    if (notesCount === 0 && referencesCount === 0) {
      return { valid: false, error: 'At least one file in Notes or References is required' };
    }
    
    return { valid: true };
  }
};

/**
 * UI utilities
 */
export const uiUtils = {
  /**
   * Get color for file group
   */
  getGroupColor: (group: 'notes' | 'references'): string => {
    return group === 'notes' ? '#3b82f6' : '#059669';
  },

  /**
   * Get background color for file group
   */
  getGroupBackgroundColor: (group: 'notes' | 'references'): string => {
    return group === 'notes' ? '#dbeafe' : '#d1fae5';
  },

  /**
   * Get border color for file group
   */
  getGroupBorderColor: (group: 'notes' | 'references'): string => {
    return group === 'notes' ? '#93c5fd' : '#6ee7b7';
  },

  /**
   * Format academic level for display
   */
  formatAcademicLevel: (level: string): string => {
    return level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ');
  },

  /**
   * Format citation style for display
   */
  formatCitationStyle: (style: string): string => {
    return style.toUpperCase();
  },

  /**
   * Get estimated paragraph count
   */
  getEstimatedParagraphCount: (wordCount: number): { min: number; max: number } => {
    const min = Math.ceil(wordCount / 200);
    const max = Math.ceil(wordCount / 150);
    return { min, max };
  }
};

export default {
  fileUtils,
  textUtils,
  exportUtils,
  validationUtils,
  uiUtils
};
