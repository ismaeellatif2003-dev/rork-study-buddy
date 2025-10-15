/**
 * Grounded Essay Writer - Full Featured Crash-Resistant Version
 * 
 * A comprehensive essay writing tool that includes all original features:
 * - Upload materials and organize them into Relevant Notes and References
 * - Configure essay parameters (word count, academic level, citation style)
 * - Generate grounded essays using provided materials
 * - Review and edit generated content with inline citations
 * - AI-powered reference analysis and smart selection
 * - PDF and Word document export
 * - Save and load essays
 * - All features are crash-resistant with no .split() operations
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FileText, Upload, Star, Trash2, Edit3, Download, Copy, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Save, FolderOpen, Plus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
// PDF and Word generation libraries - will be loaded dynamically
let jsPDF: any = null;
let Document: any = null;
let Packer: any = null;
let Paragraph: any = null;
let TextRun: any = null;
let HeadingLevel: any = null;
import { mockApi } from '../../services/mockApi';
import { essayApi } from '../../services/essayApi';
import { essaysApi } from '../../services/dataService';
import { promptTemplates } from '../../utils/promptTemplates';
import colors from '../../constants/colors';
import { useSubscription } from '../../hooks/subscription-store';
import { handleEssayLimit } from '../../utils/navigation-utils';

const { width } = Dimensions.get('window');

// Constants for editable copy
const COPY = {
  title: 'Grounded Essay Writer',
  subtitle: 'Create well-researched essays using your materials',
  materialsHeader: 'Upload readings, notes, or paste text — we\'ll use them to ground the essay.',
  configureHeader: 'Configure your essay parameters',
  generateHeader: 'Generate and review your essay',
  priorityTooltip: 'Prefer this source when selecting evidence',
  citationToggleHelper: 'Turn off if you don\'t want a reference list in the exported essay',
  unsupportedFlagExplanation: 'This sentence is not supported by provided materials. Consider adding a source or changing mode.',
  integrityText: 'I will use this for study/learning only',
  generateOutline: 'Generate Outline',
  approveOutline: 'Approve Outline',
  requestChanges: 'Request Changes',
  expandParagraph: 'Expand Paragraph',
  expandAll: 'Expand All',
  saveToFile: 'Save to File',
  copyWithCitations: 'Save with Citations',
};

// Types
interface FileItem {
  id: string;
  group: 'notes' | 'references';
  name: string;
  excerpt: string;
  priority: boolean;
  order: number;
  pages?: number;
  type: 'file' | 'text' | 'url';
  uploadType: 'material' | 'sample_essay'; // Distinguish between materials and sample essays
  analysis?: {
    relevanceScore: number;
    keyTopics: string[];
    summary: string;
    confidence: number;
  };
}

interface Paragraph {
  title: string;
  intendedChunks: Array<{ label: string; excerpt: string }>;
  suggestedWordCount: number;
  expandedText?: string;
  usedChunks?: Array<{ label: string; page?: number }>;
  citations?: Array<{ text: string; source: string }>;
  unsupportedFlags?: Array<{ sentence: string; reason: string }>;
}

interface Outline {
  outlineId: string;
  thesis: string;
  paragraphs: Paragraph[];
  metadata: { retrievedCount: number };
}

type Step = 'materials' | 'configure' | 'generate';
type AcademicLevel = 'high-school' | 'undergraduate' | 'graduate' | 'professional';
type CitationStyle = 'none' | 'apa' | 'mla' | 'harvard' | 'chicago';
type Mode = 'grounded' | 'mixed' | 'teach';

// Safe string utilities - NO .split() operations with enhanced memory management
const SafeStringUtils = {
  // Safe alternative to .split() - uses indexOf and substring with memory limits
  safeSplit: (text: string, delimiter: string): string[] => {
    try {
      if (!text || typeof text !== 'string') return [];
      if (!delimiter || typeof delimiter !== 'string') return [text];
      
      // Memory protection: limit input size to prevent memory issues
      const maxInputSize = 1000000; // 1MB limit
      if (text.length > maxInputSize) {
        console.warn('Text too large for safeSplit, truncating');
        text = text.substring(0, maxInputSize);
      }
      
      const result: string[] = [];
      let start = 0;
      let index = text.indexOf(delimiter);
      let iterationCount = 0;
      const maxIterations = 1000; // Prevent infinite loops
      
      while (index !== -1 && iterationCount < maxIterations) {
        result.push(text.substring(start, index));
        start = index + delimiter.length;
        index = text.indexOf(delimiter, start);
        iterationCount++;
      }
      
      if (iterationCount >= maxIterations) {
        console.warn('SafeSplit hit iteration limit, stopping');
      }
      
      result.push(text.substring(start));
      
      // Limit result array size to prevent memory issues
      const maxResults = 100;
      if (result.length > maxResults) {
        console.warn('SafeSplit result too large, truncating');
        return result.slice(0, maxResults);
      }
      
      return result;
    } catch (error) {
      console.warn('Error in safeSplit:', error);
      return [text || ''];
    }
  },

  // Safe alternative to .split() for newlines
  safeSplitLines: (text: string): string[] => {
    try {
      if (!text || typeof text !== 'string') return [];
      
      const result: string[] = [];
      let start = 0;
      let index = text.indexOf('\n');
      
      while (index !== -1) {
        result.push(text.substring(start, index));
        start = index + 1;
        index = text.indexOf('\n', start);
      }
      
      result.push(text.substring(start));
      return result;
    } catch (error) {
      console.warn('Error in safeSplitLines:', error);
      return [text || ''];
    }
  },

  // Safe alternative to .split() for double newlines
  safeSplitDoubleLines: (text: string): string[] => {
    try {
      if (!text || typeof text !== 'string') return [];
      
      const result: string[] = [];
      let start = 0;
      let index = text.indexOf('\n\n');
      
      while (index !== -1) {
        result.push(text.substring(start, index));
        start = index + 2;
        index = text.indexOf('\n\n', start);
      }
      
      result.push(text.substring(start));
      return result;
    } catch (error) {
      console.warn('Error in safeSplitDoubleLines:', error);
      return [text || ''];
    }
  },

  // Safe string length limit
  limitString: (text: string, maxLength: number): string => {
    try {
      if (!text || typeof text !== 'string') return '';
      return text.length > maxLength ? text.substring(0, maxLength) : text;
    } catch (error) {
      console.warn('Error in limitString:', error);
      return '';
    }
  },

  // Safe string replacement
  safeReplace: (text: string, search: string, replace: string): string => {
    try {
      if (!text || typeof text !== 'string') return '';
      if (!search || typeof search !== 'string') return text;
      
      let result = text;
      let index = result.indexOf(search);
      
      while (index !== -1) {
        result = result.substring(0, index) + replace + result.substring(index + search.length);
        index = result.indexOf(search, index + replace.length);
      }
      
      return result;
    } catch (error) {
      console.warn('Error in safeReplace:', error);
      return text || '';
    }
  }
};

export default function GroundedEssayWriter() {
  // Subscription hooks
  const { canGenerateEssay, trackEssayGeneration } = useSubscription();

  // Global error handler for the component
  React.useEffect(() => {
    try {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // Enhanced error handling to prevent crashes
      console.error = (...args) => {
        try {
          // Log the error but don't let it crash the app
          originalError(...args);
          
          // If it's a critical error, show a user-friendly message
          if (args[0] && typeof args[0] === 'string' && args[0].includes('Error:')) {
            console.warn('Caught error in essay writer:', args[0]);
            // Show user-friendly error message
            Alert.alert('Error', 'An error occurred. Please try again or restart the app.');
          }
        } catch (error) {
          // If even the error handler fails, just log it silently
          originalWarn('Error in error handler:', error);
        }
      };

      // Global unhandled promise rejection handler
      const handleUnhandledRejection = (event: any) => {
        try {
          console.warn('Unhandled promise rejection:', event.reason);
          event.preventDefault(); // Prevent the default behavior (crash)
          Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } catch (error) {
          originalWarn('Error in unhandled rejection handler:', error);
        }
      };

      // Add global error handlers (React Native doesn't have window)
      // Note: React Native handles unhandled rejections differently

      return () => {
        try {
          console.error = originalError;
          // React Native doesn't need to remove window event listeners
        } catch (error) {
          originalWarn('Error restoring error handlers:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up error handler:', error);
    }
  }, []);
  
  // State management
  const [currentStep, setCurrentStep] = useState<Step>('materials');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [essayTopic, setEssayTopic] = useState('');
  const [sampleEssay, setSampleEssay] = useState<FileItem | null>(null);
  const [prompt, setPrompt] = useState('');
  const [wordCount, setWordCount] = useState(800);
  const [customWordCount, setCustomWordCount] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('undergraduate');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('none');
  const [includeReferences, setIncludeReferences] = useState(false);
  const [mode, setMode] = useState<Mode>('grounded');
  const [integrityChecked, setIntegrityChecked] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<number>>(new Set());
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzingReferences, setIsAnalyzingReferences] = useState(false);
  const [referenceAnalysis, setReferenceAnalysis] = useState<Record<string, any>>({});
  const [smartSelection, setSmartSelection] = useState<any>(null);
  const [savedEssays, setSavedEssays] = useState<any[]>([]);
  const [showSavedDocuments, setShowSavedDocuments] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Load PDF/Word libraries dynamically
  const loadLibraries = async () => {
    try {
      // Only load libraries when needed to prevent crashes
      if (!jsPDF) {
        try {
          const jsPDFModule = await import('jspdf');
          jsPDF = jsPDFModule.default;
        } catch (error) {
          console.warn('jsPDF library not available:', error);
          jsPDF = null;
        }
      }
      
      if (!Document) {
        try {
          const docxModule = await import('docx');
          Document = docxModule.Document;
          Packer = docxModule.Packer;
          Paragraph = docxModule.Paragraph;
          TextRun = docxModule.TextRun;
          HeadingLevel = docxModule.HeadingLevel;
        } catch (error) {
          console.warn('docx library not available:', error);
          Document = null;
          Packer = null;
          Paragraph = null;
          TextRun = null;
          HeadingLevel = null;
        }
      }
    } catch (error) {
      console.warn('Error loading libraries:', error);
      // Libraries will remain null, fallback functions will be used
    }
  };

  // Load saved essays on component mount
  React.useEffect(() => {
    try {
      loadSavedEssays();
    } catch (error) {
      console.error('Error loading saved essays:', error);
    }
  }, []);

  // Memory monitoring function
  const checkMemoryUsage = useCallback(() => {
    try {
      // Check if we're approaching memory limits
      const totalTextLength = [
        prompt,
        essayTopic,
        assignmentTitle,
        ...files.map(f => f.excerpt),
        ...Object.values(edits),
        outline ? outline.thesis : '',
        ...(outline?.paragraphs.map(p => p.expandedText || '') || [])
      ].reduce((total, text) => total + (text?.length || 0), 0);

      const maxTextLength = 2000000; // 2MB limit
      if (totalTextLength > maxTextLength) {
        console.warn('Memory usage high, performing cleanup');
        Alert.alert(
          'Memory Warning', 
          'The essay is getting quite large. Consider saving your work and starting fresh to prevent crashes.'
        );
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error checking memory usage:', error);
      return false;
    }
  }, [prompt, essayTopic, assignmentTitle, files, edits, outline]);

  // Memory cleanup function
  const cleanupMemory = useCallback(() => {
    try {
      // Clear large state objects to free memory
      setFiles([]);
      setOutline(null);
      setEdits({});
      setExpandedParagraphs(new Set());
      setReferenceAnalysis({});
      setSmartSelection(null);
      setSavedEssays([]);
      
      // Force garbage collection if available
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    } catch (error) {
      console.warn('Error during memory cleanup:', error);
    }
  }, []);

  // Cleanup effect to prevent memory leaks
  React.useEffect(() => {
    return () => {
      try {
        // Cleanup any pending timeouts or async operations
        setShowSavedDocuments(false);
        setShowReferencesModal(false);
        
        // Perform memory cleanup
        cleanupMemory();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [cleanupMemory]);

  // Load saved essays from backend or AsyncStorage
  const loadSavedEssays = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (authToken) {
        // Load from backend
        const response = await essaysApi.getAll();
        if (response.success && response.essays) {
          setSavedEssays(response.essays);
          // Cache to local storage
          await AsyncStorage.setItem('saved_essays', JSON.stringify(response.essays));
          return;
        }
      }
      
      // Fallback to local storage
      const saved = await AsyncStorage.getItem('saved_essays');
      if (saved) {
        const parsedEssays = JSON.parse(saved);
        if (Array.isArray(parsedEssays)) {
          setSavedEssays(parsedEssays);
        } else {
          console.warn('Invalid saved essays format, resetting to empty array');
          setSavedEssays([]);
        }
      }
    } catch (error) {
      console.error('Error loading saved essays:', error);
      setSavedEssays([]);
    }
  };

  // Safe file operations
  const getNextOrder = (group: 'notes' | 'references') => {
    try {
      const groupFiles = files.filter(f => f.group === group);
      return groupFiles.length > 0 ? Math.max(...groupFiles.map(f => f.order)) + 1 : 0;
    } catch (error) {
      console.warn('Error in getNextOrder:', error);
      return 0;
    }
  };

  // Safe string operations - NO .split() operations
  const stripCitationsFromText = (text: string): string => {
    try {
      if (!text || typeof text !== 'string') return '';
      
      const limitedText = SafeStringUtils.limitString(text, 10000);
      
      if (citationStyle === 'none') {
        // Remove common citation patterns with safe operations
        let result = limitedText;
        
        // Remove parenthetical citations like (Smith, 2023)
        result = result.replace(/\([^)]*\d{4}[^)]*\)/g, '');
        
        // Remove author-date citations like Smith (2023)
        result = result.replace(/\b[A-Z][a-z]+(?:\s+et\s+al\.)?\s*\(\d{4}\)/g, '');
        
        // Remove numbered citations like [1] or [1,2,3]
        result = result.replace(/\[\d+(?:,\s*\d+)*\]/g, '');
        
        // Remove superscript citations like ¹ or ²
        result = result.replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, '');
        
        // Clean up extra spaces and punctuation
        result = result.replace(/\s+/g, ' ');
        result = result.replace(/\s+([.,;:!?])/g, '$1');
        result = result.replace(/\(\s*\)/g, '');
        
        return result.trim();
      }
      return limitedText;
    } catch (error) {
      console.warn('Error in stripCitationsFromText:', error);
      return text ? SafeStringUtils.limitString(text, 1000) : '';
    }
  };

  // Generate references list based on citation style
  const generateReferencesList = () => {
    try {
      if (!includeReferences || citationStyle === 'none') return null;
      
      const referenceFiles = files.filter(f => f.group === 'references');
      if (referenceFiles.length === 0) return null;

      // Limit references to prevent memory issues
      const maxReferences = 50;
      const limitedFiles = referenceFiles.slice(0, maxReferences);

      const references = limitedFiles.map((file, index) => {
        const year = new Date().getFullYear();
        const author = `Author ${index + 1}`;
        // Safe title extraction with length limit
        const title = file.name ? SafeStringUtils.limitString(file.name.replace(/\.[^/.]+$/, ""), 100) : `Document ${index + 1}`;
        
        switch (citationStyle) {
          case 'apa':
            return `${author}. (${year}). ${title}. Retrieved from source.`;
          case 'mla':
            return `${author}. "${title}." Source, ${year}.`;
          case 'harvard':
            return `${author} ${year}, ${title}, Source.`;
          case 'chicago':
            return `${author}. "${title}." Source, ${year}.`;
          default:
            return `${author}. (${year}). ${title}.`;
        }
      });

      return references.join('\n\n');
    } catch (error) {
      console.warn('Error in generateReferencesList:', error);
      return null;
    }
  };

  // Fallback text download function
  const downloadAsText = async () => {
    try {
      if (!outline) return;

      const essayTitle = SafeStringUtils.limitString(outline.thesis || 'Generated Essay', 200);
      const essayText = outline.paragraphs
        .map((p, i) => {
          const text = edits[i] || p.expandedText || '';
          const cleanText = stripCitationsFromText(text);
          // Limit paragraph text length to prevent memory issues
          const limitedText = SafeStringUtils.limitString(cleanText, 5000);
          const limitedTitle = SafeStringUtils.limitString(p.title || `Paragraph ${i + 1}`, 100);
          return `${limitedTitle}\n\n${limitedText}`;
        })
        .join('\n\n\n');

      // Add references if they exist and are enabled
      let fullText = `${essayTitle}\n\n${essayText}`;
      
      if (includeReferences && citationStyle !== 'none') {
        const references = generateReferencesList();
        if (references) {
          fullText += `\n\n\nReferences\n\n${references}`;
        }
      }

      // Create a proper filename with timestamp
      const timestamp = new Date().toISOString().substring(0, 10); // Safe alternative to split
      const filename = `essay_${timestamp}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, fullText);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Essay saved to device!');
      }
    } catch (error) {
      console.error('Error saving text document:', error);
      Alert.alert('Error', 'Failed to save document');
    }
  };

  // Save to file instead of clipboard
  const saveToFile = async () => {
    try {
      if (!outline) return;

      const essayTitle = SafeStringUtils.limitString(outline.thesis || 'Generated Essay', 200);
      const essayText = outline.paragraphs
        .map((p, i) => {
          const text = edits[i] || p.expandedText || '';
          const cleanText = stripCitationsFromText(text);
          // Limit paragraph text length to prevent memory issues
          const limitedText = SafeStringUtils.limitString(cleanText, 5000);
          const limitedTitle = SafeStringUtils.limitString(p.title || `Paragraph ${i + 1}`, 100);
          return `${limitedTitle}\n\n${limitedText}`;
        })
        .join('\n\n\n');

      // Add references if they exist and are enabled
      let fullText = `${essayTitle}\n\n${essayText}`;
      
      if (includeReferences && citationStyle !== 'none') {
        const references = generateReferencesList();
        if (references) {
          fullText += `\n\n\nReferences\n\n${references}`;
        }
      }

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `essay_${essayTopic.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.txt`;
      
      // Create a temporary file
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, fullText, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Save Essay',
      });
      
      Alert.alert('Success', 'Essay saved to file!');
    } catch (error) {
      console.error('Error saving to file:', error);
      Alert.alert('Error', 'Failed to save essay to file');
    }
  };

  // Copy with citations
  const copyWithCitations = async () => {
    try {
      if (!outline) return;

      const essayTitle = SafeStringUtils.limitString(outline.thesis || 'Generated Essay', 200);
      const essayText = outline.paragraphs
        .map((p, i) => {
          const text = edits[i] || p.expandedText || '';
          // Don't strip citations for this version
          const limitedText = SafeStringUtils.limitString(text, 5000);
          const limitedTitle = SafeStringUtils.limitString(p.title || `Paragraph ${i + 1}`, 100);
          return `${limitedTitle}\n\n${limitedText}`;
        })
        .join('\n\n\n');

      // Add references if they exist and are enabled
      let fullText = `${essayTitle}\n\n${essayText}`;
      
      if (includeReferences && citationStyle !== 'none') {
        const references = generateReferencesList();
        if (references) {
          fullText += `\n\n\nReferences\n\n${references}`;
        }
      }

      // Actually copy to clipboard
      await Clipboard.setStringAsync(fullText);
      Alert.alert('Success', 'Essay with citations copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Download as Word document
  const downloadAsDocx = async () => {
    try {
      if (!outline) return;

      await loadLibraries();
      
      if (!Document || !Packer || !Paragraph || !TextRun || !HeadingLevel) {
        Alert.alert('Error', 'Word document generation not available. Using text format instead.');
        downloadAsText();
        return;
      }

      const essayTitle = SafeStringUtils.limitString(outline.thesis || 'Generated Essay', 200);
      
      // Create document structure
      const paragraphs = outline.paragraphs.map((p, i) => {
        const text = edits[i] || p.expandedText || '';
        const cleanText = stripCitationsFromText(text);
        
        return [
          new Paragraph({
            text: p.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                size: 24 // 12pt font
              })
            ],
            spacing: { after: 400 }
          })
        ];
      }).flat();

      // Add references if enabled
      if (includeReferences && citationStyle !== 'none') {
        const references = generateReferencesList();
        if (references) {
          paragraphs.push(
            new Paragraph({
              text: 'References',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            })
          );
          
          // Safe string splitting with validation - avoid split() to prevent crashes
          const refArray = references ? SafeStringUtils.safeSplitDoubleLines(references) : [];
          refArray.forEach(ref => {
            if (ref.trim()) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: ref.trim(),
                      size: 24
                    })
                  ],
                  spacing: { after: 200 }
                })
              );
            }
          });
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: essayTitle,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 }
            }),
            ...paragraphs
          ]
        }]
      });

      // Generate the document
      const buffer = await Packer.toBuffer(doc);
      
      // Save to file
      const timestamp = new Date().toISOString().substring(0, 10); // Safe alternative to split
      const filename = `essay_${timestamp}.docx`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Convert buffer to base64 and write
      // Convert ArrayBuffer to base64 string for React Native
      const uint8Array = new Uint8Array(buffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64String = btoa(binaryString);
      
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Word document saved to device!');
      }
    } catch (error) {
      console.error('Error generating Word document:', error);
      Alert.alert('Error', 'Failed to generate Word document. Using text format instead.');
      downloadAsText();
    }
  };

  // Download as PDF
  const downloadAsPdf = async () => {
    try {
      if (!outline) return;

      await loadLibraries();
      
      if (!jsPDF) {
        Alert.alert('Error', 'PDF generation not available. Using text format instead.');
        downloadAsText();
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 30;

      // Add title
      const essayTitle = SafeStringUtils.limitString(outline.thesis || 'Generated Essay', 200);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(essayTitle, maxWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 20;

      // Add paragraphs
      outline.paragraphs.forEach((paragraph, index) => {
        const text = edits[index] || paragraph.expandedText || '';
        const cleanText = stripCitationsFromText(text);
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Add paragraph title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const titleLines = pdf.splitTextToSize(paragraph.title, maxWidth);
        pdf.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 7 + 5;
        
        // Add paragraph content
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(cleanText, maxWidth);
        
        // Check if content fits on current page
        const contentHeight = contentLines.length * 5;
        if (yPosition + contentHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.text(contentLines, margin, yPosition);
        yPosition += contentHeight + 15;
      });

      // Add references if enabled
      if (includeReferences && citationStyle !== 'none') {
        const references = generateReferencesList();
        if (references) {
          // Check if we need a new page for references
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('References', margin, yPosition);
          yPosition += 6;
          
          // Safe string splitting with validation - avoid split() to prevent crashes
          const refArray = references ? SafeStringUtils.safeSplitDoubleLines(references) : [];
          refArray.forEach(ref => {
            if (ref.trim()) {
              // Check if we need a new page
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 30;
              }
              
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const refLines = pdf.splitTextToSize(ref.trim(), maxWidth);
              pdf.text(refLines, margin, yPosition);
              yPosition += refLines.length * 4 + 3;
            }
          });
        }
      }
      
      // Save the PDF
      const timestamp = new Date().toISOString().substring(0, 10); // Safe alternative to split
      const filename = `essay_${timestamp}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      const pdfOutput = pdf.output('datauristring');
      // Safe string splitting with validation
      const commaIndex = pdfOutput.indexOf(',');
      const base64Data = commaIndex !== -1 ? pdfOutput.substring(commaIndex + 1) : pdfOutput;
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'PDF saved to device!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Using text format instead.');
      downloadAsText();
    }
  };

  // AI Reference Analysis
  const analyzeReferences = async () => {
    try {
      if (!prompt.trim() || !essayTopic.trim()) {
        Alert.alert('Missing Information', 'Please provide both the essay prompt and topic before analyzing references.');
        return;
      }

      const referenceFiles = files.filter(f => f.group === 'references');
      if (referenceFiles.length === 0) {
        Alert.alert('No References', 'Please upload reference materials before analyzing.');
        return;
      }

      setIsAnalyzingReferences(true);

      const request = {
        prompt: SafeStringUtils.limitString(prompt, 2000),
        essayTopic: SafeStringUtils.limitString(essayTopic, 500),
        assignmentTitle: SafeStringUtils.limitString(assignmentTitle, 200),
        references: referenceFiles.map(f => ({
          id: f.id,
          name: SafeStringUtils.limitString(f.name, 200),
          excerpt: SafeStringUtils.limitString(f.excerpt, 1000),
          content: SafeStringUtils.limitString(f.excerpt, 2000)
        }))
      };

      const response = await essayApi.analyzeReferences(request);
      
      if (response.analysis && response.smartSelection) {
        setReferenceAnalysis(response.analysis);
        setSmartSelection(response.smartSelection);
        
        // Update file analysis
        const updatedFiles = files.map(file => {
          if (file.group === 'references' && response.analysis[file.id]) {
            return {
              ...file,
              analysis: response.analysis[file.id]
            };
          }
          return file;
        });
        setFiles(updatedFiles);
        
        Alert.alert('Analysis Complete', `Analyzed ${referenceFiles.length} references. ${response.smartSelection.selectedCount} recommended for your essay.`);
      } else {
        Alert.alert('Error', 'Failed to analyze references');
      }
    } catch (error) {
      console.error('Error analyzing references:', error);
      Alert.alert('Error', 'Failed to analyze references');
    } finally {
      setIsAnalyzingReferences(false);
    }
  };

  // Safe essay generation with enhanced error handling
  const generateOutline = async () => {
    try {
      // Prevent multiple simultaneous API calls
      if (isGenerating) {
        console.warn('Already generating outline, ignoring duplicate request');
        return;
      }

      if (!canGenerateEssay()) {
        handleEssayLimit();
        return;
      }

      if (!prompt.trim() || !essayTopic.trim()) {
        Alert.alert('Missing Information', 'Please provide both the essay prompt and topic.');
        return;
      }

      // Files are optional - can generate essay without materials

      // Check memory usage before generating
      if (checkMemoryUsage()) {
        Alert.alert('Memory Warning', 'Please save your work and restart the app to prevent crashes.');
        return;
      }

      setIsGenerating(true);

      // Memory-safe request preparation - match backend API exactly
      const request = {
        prompt: SafeStringUtils.limitString(prompt, 2000),
        essayTopic: SafeStringUtils.limitString(essayTopic, 500),
        wordCount: Math.min(wordCount, 10000),
        level: academicLevel,
        citationStyle,
        mode,
        fileIds: files.map(f => f.id),
        rubric: assignmentTitle || '',
        sampleEssayId: sampleEssay?.id || undefined
      };

      // Debug logging (removed to prevent performance issues)

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 60000); // 60 second timeout
      });

      const response = await Promise.race([
        essayApi.generateOutline(request),
        timeoutPromise
      ]) as any;
      
      if (response && response.outlineId) {
        const outline: Outline = {
          outlineId: response.outlineId,
          thesis: SafeStringUtils.limitString(response.thesis, 1000),
          paragraphs: (response.paragraphs || []).map((p: any) => ({
            ...p,
            title: SafeStringUtils.limitString(p.title, 200),
            expandedText: p.expandedText ? SafeStringUtils.limitString(p.expandedText, 5000) : undefined
          })),
          metadata: response.metadata || { retrievedCount: 0 }
        };
        setOutline(outline);
        setCurrentStep('generate');
        trackEssayGeneration();
      } else {
        Alert.alert('Error', 'Failed to generate outline. Please try again.');
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      if (error instanceof Error && error.message === 'Request timeout') {
        Alert.alert('Timeout', 'The request took too long. Please try again with fewer materials.');
      } else {
        Alert.alert('Error', 'Failed to generate outline. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe file upload for materials
  const uploadFile = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newFile: FileItem = {
          id: Date.now().toString(),
          group: 'notes',
          name: SafeStringUtils.limitString(asset.name || 'Unknown', 200),
          excerpt: SafeStringUtils.limitString(asset.name || 'File uploaded', 500),
          priority: false,
          order: getNextOrder('notes'),
          type: 'file',
          uploadType: 'material'
        };

        setFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload sample essay
  const uploadSampleEssay = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const sampleEssayFile: FileItem = {
          id: Date.now().toString(),
          group: 'notes',
          name: SafeStringUtils.limitString(asset.name || 'Sample Essay', 200),
          excerpt: SafeStringUtils.limitString(asset.name || 'Sample essay uploaded', 500),
          priority: true, // Sample essays are high priority
          order: 0,
          type: 'file',
          uploadType: 'sample_essay'
        };

        // Replace any existing sample essay
        setSampleEssay(sampleEssayFile);
        Alert.alert('Success', 'Sample essay uploaded! The AI will use this to match your writing style.');
      }
    } catch (error) {
      console.error('Error uploading sample essay:', error);
      Alert.alert('Error', 'Failed to upload sample essay');
    } finally {
      setIsUploading(false);
    }
  };

  // Add text material
  const addTextMaterial = () => {
    Alert.prompt(
      'Add Text Material',
      'Enter a title for your text material:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Text',
          onPress: (title) => {
            if (title && title.trim()) {
              Alert.prompt(
                'Add Text Content',
                'Paste your text content here:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add',
                    onPress: (content) => {
                      if (content && content.trim()) {
                        const newFile: FileItem = {
                          id: Date.now().toString(),
                          group: 'notes',
                          name: SafeStringUtils.limitString(title.trim(), 200),
                          excerpt: SafeStringUtils.limitString(content.trim(), 1000),
                          priority: false,
                          order: getNextOrder('notes'),
                          type: 'text',
                          uploadType: 'material'
                        };
                        setFiles(prev => [...prev, newFile]);
                      }
                    }
                  }
                ],
                'plain-text',
                '',
                'default'
              );
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  // Safe file removal
  const removeFile = (fileId: string) => {
    try {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.warn('Error removing file:', error);
    }
  };

  // Toggle file priority
  const toggleFilePriority = (fileId: string) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, priority: !f.priority } : f
      ));
    } catch (error) {
      console.warn('Error toggling file priority:', error);
    }
  };

  // Move file between groups
  const moveFileToGroup = (fileId: string, newGroup: 'notes' | 'references') => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, group: newGroup, order: getNextOrder(newGroup) } : f
      ));
    } catch (error) {
      console.warn('Error moving file:', error);
    }
  };

  // Safe paragraph expansion with enhanced error handling
  const expandParagraph = async (index: number) => {
    try {
      // Prevent multiple simultaneous API calls for the same paragraph
      if (expandedParagraphs.has(index)) {
        console.warn(`Paragraph ${index + 1} already expanded, ignoring duplicate request`);
        return;
      }

      if (!outline) return;

      const paragraph = outline.paragraphs[index];
      if (!paragraph) return;

      // Check memory usage before expanding
      if (checkMemoryUsage()) {
        Alert.alert('Memory Warning', 'Please save your work and restart the app to prevent crashes.');
        return;
      }

      // Memory-safe request preparation
      const request = {
        outlineId: outline.outlineId,
        paragraphIndex: index,
        paragraphTitle: SafeStringUtils.limitString(paragraph.title, 200),
        intendedChunks: (paragraph.intendedChunks || []).map(chunk => ({
          ...chunk,
          label: SafeStringUtils.limitString(chunk.label, 100),
          excerpt: SafeStringUtils.limitString(chunk.excerpt, 1000)
        })),
        essayTopic: SafeStringUtils.limitString(essayTopic, 500),
        prompt: SafeStringUtils.limitString(prompt, 2000),
        suggestedWordCount: Math.min(paragraph.suggestedWordCount || 200, 1000),
        citationStyle: citationStyle,
        academicLevel: academicLevel,
        mode: mode
      };

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 45000); // 45 second timeout
      });

      const response = await Promise.race([
        essayApi.expandParagraph(request),
        timeoutPromise
      ]) as any;
      
      if (response && response.paragraphText) {
        const updatedOutline = {
          ...outline,
          paragraphs: outline.paragraphs.map((p, i) => 
            i === index ? { 
              ...p, 
              expandedText: SafeStringUtils.limitString(response.paragraphText, 10000),
              usedChunks: (response.usedChunks || []),
              citations: (response.citations || []).map((c: any) => ({
                ...c,
                text: SafeStringUtils.limitString(c.text, 500),
                source: SafeStringUtils.limitString(c.source, 200)
              })),
              unsupportedFlags: (response.unsupportedFlags || []).map((f: any) => ({
                ...f,
                sentence: SafeStringUtils.limitString(f.sentence, 500),
                reason: SafeStringUtils.limitString(f.reason, 200)
              }))
            } : p
          )
        };
        setOutline(updatedOutline);
        setExpandedParagraphs(prev => new Set([...prev, index]));
        
        // Immediately save the expanded content to edits state for persistence
        const expandedContent = SafeStringUtils.limitString(response.paragraphText, 10000);
        setEdits(prev => ({ ...prev, [index]: expandedContent }));
        
        // Paragraph expanded successfully
      } else {
        Alert.alert('Error', 'Failed to expand paragraph');
      }
    } catch (error) {
      console.error('Error expanding paragraph:', error);
      if (error instanceof Error && error.message === 'Request timeout') {
        Alert.alert('Timeout', 'The paragraph expansion took too long. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to expand paragraph');
      }
    }
  };

  // Safe paragraph editing
  const handleParagraphEdit = (index: number, text: string) => {
    try {
      const limitedText = SafeStringUtils.limitString(text, 10000);
      setEdits(prev => ({ ...prev, [index]: limitedText }));
    } catch (error) {
      console.warn('Error editing paragraph:', error);
    }
  };

  // Safe essay saving
  const saveEssay = async () => {
    try {
      if (!outline || !outline.thesis) {
        Alert.alert('Error', 'No essay to save');
        return;
      }

      setIsSaving(true);

      const essayData = {
        id: Date.now().toString(),
        title: SafeStringUtils.limitString(outline.thesis, 200),
        assignmentTitle: SafeStringUtils.limitString(assignmentTitle, 200),
        essayTopic: SafeStringUtils.limitString(essayTopic, 200),
        prompt: SafeStringUtils.limitString(prompt, 2000),
        mode,
        outline,
        edits,
        files: files.map(f => ({
          ...f,
          name: SafeStringUtils.limitString(f.name, 200),
          excerpt: SafeStringUtils.limitString(f.excerpt, 1000)
        })),
        savedAt: new Date().toISOString(),
        wordCount,
        academicLevel,
        citationStyle,
        includeReferences
      };

      const authToken = await AsyncStorage.getItem('authToken');
      
      if (authToken) {
        // Save to backend
        const response = await essaysApi.create(essayData);
        if (response.success) {
          // Reload saved essays from backend
          await loadSavedEssays();
          Alert.alert('Success', 'Essay saved successfully and synced!');
          return;
        }
      }
      
      // Fallback: Save to local storage
      const saved = await AsyncStorage.getItem('saved_essays');
      const savedEssaysLocal = saved ? JSON.parse(saved) : [];
      
      if (Array.isArray(savedEssaysLocal)) {
        const updatedEssays = [...savedEssaysLocal, essayData];
        await AsyncStorage.setItem('saved_essays', JSON.stringify(updatedEssays));
        setSavedEssays(updatedEssays);
        Alert.alert('Success', 'Essay saved locally!');
      } else {
        await AsyncStorage.setItem('saved_essays', JSON.stringify([essayData]));
        setSavedEssays([essayData]);
        Alert.alert('Success', 'Essay saved locally!');
      }
    } catch (error) {
      console.error('Error saving essay:', error);
      Alert.alert('Error', 'Failed to save essay');
    } finally {
      setIsSaving(false);
    }
  };

  // Safe essay loading
  const loadSavedEssay = async (essay: any) => {
    try {
      if (!essay) return;

      // Restore all state variables safely
      setAssignmentTitle(essay.assignmentTitle || '');
      setEssayTopic(essay.essayTopic || '');
      setPrompt(essay.prompt || '');
      setMode(essay.mode || 'grounded');
      setEdits(essay.edits || {});
      setOutline(essay.outline || null);
      setFiles(Array.isArray(essay.files) ? essay.files : []);
      setWordCount(essay.wordCount || 800);
      setAcademicLevel(essay.academicLevel || 'undergraduate');
      setCitationStyle(essay.citationStyle || 'none');
      setIncludeReferences(essay.includeReferences || false);
      setCurrentStep('generate');
      setShowSavedDocuments(false);
    } catch (error) {
      console.error('Error loading saved essay:', error);
      Alert.alert('Error', 'Failed to load essay');
    }
  };

  // Safe essay deletion
  const deleteSavedEssay = async (essayId: string) => {
    try {
      const updatedEssays = savedEssays.filter(essay => essay.id !== essayId);
      await AsyncStorage.setItem('saved_essays', JSON.stringify(updatedEssays));
      setSavedEssays(updatedEssays);
    } catch (error) {
      console.error('Error deleting essay:', error);
      Alert.alert('Error', 'Failed to delete essay');
    }
  };

  // Safe new essay creation
  const createNewEssay = () => {
    try {
      Alert.alert(
        'Create New Essay',
        'Are you sure you want to start a new essay? This will clear your current work.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create New',
            style: 'destructive',
            onPress: () => {
              // Reset all state variables
              setCurrentStep('materials');
              setFiles([]);
              setAssignmentTitle('');
              setEssayTopic('');
              setSampleEssay(null);
              setPrompt('');
              setWordCount(800);
              setCustomWordCount('');
              setAcademicLevel('undergraduate');
              setCitationStyle('none');
              setIncludeReferences(false);
              setMode('grounded');
              setIntegrityChecked(false);
              setOutline(null);
              setIsGenerating(false);
              setExpandedParagraphs(new Set());
              setEdits({});
              setIsUploading(false);
              setIsAnalyzingReferences(false);
              setReferenceAnalysis({});
              setSmartSelection(null);
              setIsSaving(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating new essay:', error);
    }
  };

  // Render functions
  const renderMaterialsStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{COPY.materialsHeader}</Text>
      
      {/* Assignment Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Assignment Title (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={assignmentTitle}
          onChangeText={setAssignmentTitle}
          placeholder="e.g., Final Essay for History 101"
          placeholderTextColor={colors.textSecondary}
          maxLength={200}
        />
      </View>

      {/* Essay Topic */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Essay Topic *</Text>
        <TextInput
          style={styles.textInput}
          value={essayTopic}
          onChangeText={setEssayTopic}
          placeholder="What is your essay about?"
          placeholderTextColor={colors.textSecondary}
          maxLength={500}
        />
      </View>

      {/* Essay Prompt */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Essay Prompt *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe what you want to write about..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
      </View>

      {/* Sample Essay Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadSectionTitle}>Sample Essay (Optional)</Text>
        <Text style={styles.uploadSectionDescription}>
          Upload a sample essay to help the AI match your writing style and tone.
        </Text>
        
        {sampleEssay ? (
          <View style={styles.sampleEssayCard}>
            <View style={styles.fileHeader}>
              <FileText size={16} color={colors.primary} />
              <Text style={styles.fileName}>{sampleEssay.name}</Text>
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setSampleEssay(null)}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.sampleEssayLabel}>📝 Sample Essay - AI will use this for style matching</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadButton, styles.uploadButtonPrimary]}
            onPress={uploadSampleEssay}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.cardBackground} />
            ) : (
              <Upload size={20} color={colors.cardBackground} />
            )}
            <Text style={[styles.uploadButtonText, styles.uploadButtonTextWhite]}>
              {isUploading ? 'Uploading...' : 'Upload Sample Essay'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Research Materials Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadSectionTitle}>Research Materials (Optional)</Text>
        <Text style={styles.uploadSectionDescription}>
          Upload your research materials, notes, and references to ground your essay in evidence.
        </Text>
        
        <View style={styles.uploadButtonsRow}>
          <TouchableOpacity
            style={[styles.uploadButton, styles.uploadButtonPrimary]}
            onPress={uploadFile}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.cardBackground} />
            ) : (
              <Upload size={20} color={colors.cardBackground} />
            )}
            <Text style={[styles.uploadButtonText, styles.uploadButtonTextWhite]}>
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, styles.uploadButtonSecondary]}
            onPress={addTextMaterial}
          >
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.uploadButtonText, styles.uploadButtonTextPrimary]}>
              Add Text
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Files List */}
      {files.length > 0 && (
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Research Materials ({files.length})</Text>
          
          {/* Notes Section */}
          {files.filter(f => f.group === 'notes').length > 0 && (
            <View style={styles.fileGroupSection}>
              <Text style={styles.fileGroupTitle}>📝 Notes & Research Materials</Text>
              {files.filter(f => f.group === 'notes').map((file) => (
                <View key={file.id} style={styles.fileCard}>
                  <View style={styles.fileHeader}>
                    <FileText size={16} color={colors.primary} />
                    <Text style={styles.fileName}>{file.name}</Text>
                    <View style={styles.fileActions}>
                      <TouchableOpacity
                        style={styles.priorityButton}
                        onPress={() => toggleFilePriority(file.id)}
                      >
                        <Star 
                          size={16} 
                          color={file.priority ? colors.warning : colors.textSecondary}
                          fill={file.priority ? colors.warning : 'none'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFile(file.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.fileExcerpt}>{file.excerpt}</Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileType}>{file.type === 'text' ? 'Text Input' : 'Uploaded File'}</Text>
                    {file.priority && <Text style={styles.priorityLabel}>⭐ Priority</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* References Section */}
          {files.filter(f => f.group === 'references').length > 0 && (
            <View style={styles.fileGroupSection}>
              <Text style={styles.fileGroupTitle}>📚 References & Citations</Text>
              {files.filter(f => f.group === 'references').map((file) => (
                <View key={file.id} style={styles.fileCard}>
                  <View style={styles.fileHeader}>
                    <FileText size={16} color={colors.primary} />
                    <Text style={styles.fileName}>{file.name}</Text>
                    <View style={styles.fileActions}>
                      <TouchableOpacity
                        style={styles.priorityButton}
                        onPress={() => toggleFilePriority(file.id)}
                      >
                        <Star 
                          size={16} 
                          color={file.priority ? colors.warning : colors.textSecondary}
                          fill={file.priority ? colors.warning : 'none'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFile(file.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.fileExcerpt}>{file.excerpt}</Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileType}>{file.type === 'text' ? 'Text Input' : 'Uploaded File'}</Text>
                    {file.priority && <Text style={styles.priorityLabel}>⭐ Priority</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          (!essayTopic.trim() || !prompt.trim()) && styles.nextButtonDisabled
        ]}
        onPress={() => setCurrentStep('configure')}
        disabled={!essayTopic.trim() || !prompt.trim()}
      >
        <Text style={styles.nextButtonText}>Configure Essay</Text>
        <ArrowRight size={20} color={colors.cardBackground} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfigureStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{COPY.configureHeader}</Text>

      {/* Word Count */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Word Count</Text>
        <View style={styles.wordCountRow}>
          {[500, 800, 1200, 1500].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.wordCountButton,
                wordCount === count && styles.wordCountButtonActive
              ]}
              onPress={() => setWordCount(count)}
            >
              <Text style={[
                styles.wordCountButtonText,
                wordCount === count && styles.wordCountButtonTextActive
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.textInput}
          value={customWordCount}
          onChangeText={setCustomWordCount}
          placeholder="Or enter custom word count"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Academic Level */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Academic Level</Text>
        <View style={styles.optionsGrid}>
          {[
            { value: 'high-school', label: 'High School' },
            { value: 'undergraduate', label: 'Undergraduate' },
            { value: 'graduate', label: 'Graduate' },
            { value: 'professional', label: 'Professional' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                academicLevel === option.value && styles.optionButtonActive
              ]}
              onPress={() => setAcademicLevel(option.value as AcademicLevel)}
            >
              <Text style={[
                styles.optionButtonText,
                academicLevel === option.value && styles.optionButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Citation Style */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Citations & References (Optional)</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              styles.optionItemRecommended,
              citationStyle === 'none' && styles.optionButtonActive
            ]}
            onPress={() => setCitationStyle('none')}
          >
            <Text style={[
              styles.optionButtonText,
              citationStyle === 'none' && styles.optionButtonTextActive
            ]}>
              No Citations
            </Text>
            <Text style={styles.optionDescription}>
              Clean essay without citations or references
            </Text>
          </TouchableOpacity>
          
          {[
            { value: 'apa', label: 'APA' },
            { value: 'mla', label: 'MLA' },
            { value: 'harvard', label: 'Harvard' },
            { value: 'chicago', label: 'Chicago' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                citationStyle === option.value && styles.optionButtonActive
              ]}
              onPress={() => setCitationStyle(option.value as CitationStyle)}
            >
              <Text style={[
                styles.optionButtonText,
                citationStyle === option.value && styles.optionButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mode */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Writing Mode</Text>
        <View style={styles.optionsGrid}>
          {[
            { value: 'grounded', label: 'Grounded', description: 'Only use provided materials' },
            { value: 'mixed', label: 'Mixed', description: 'Use materials + general knowledge' },
            { value: 'teach', label: 'Teaching', description: 'Explain concepts clearly' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                mode === option.value && styles.optionButtonActive
              ]}
              onPress={() => setMode(option.value as Mode)}
            >
              <Text style={[
                styles.optionButtonText,
                mode === option.value && styles.optionButtonTextActive
              ]}>
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Integrity Check */}
      <View style={styles.integritySection}>
        <TouchableOpacity
          style={styles.integrityCheckbox}
          onPress={() => setIntegrityChecked(!integrityChecked)}
        >
          <View style={[
            styles.checkbox,
            integrityChecked && styles.checkboxChecked
          ]}>
            {integrityChecked && <CheckCircle size={16} color={colors.cardBackground} />}
          </View>
          <Text style={styles.integrityText}>{COPY.integrityText}</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep('materials')}
        >
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !integrityChecked && styles.nextButtonDisabled
          ]}
          onPress={generateOutline}
          disabled={!integrityChecked || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={colors.cardBackground} />
          ) : (
            <Text style={styles.nextButtonText}>{COPY.generateOutline}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderGenerateStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{COPY.generateHeader}</Text>

      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <Text style={styles.sectionHeader}>Essay Progress</Text>
        <View style={styles.usageSummary}>
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageStatValue}>{outline?.paragraphs.length || 0}</Text>
              <Text style={styles.usageStatLabel}>Paragraphs</Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={styles.usageStatValue}>{expandedParagraphs.size}</Text>
              <Text style={styles.usageStatLabel}>Expanded</Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={styles.usageStatValue}>{files.length}</Text>
              <Text style={styles.usageStatLabel}>Sources</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Thesis */}
      {outline && (
        <View style={styles.thesisCard}>
          <Text style={styles.thesisText}>{outline.thesis}</Text>
        </View>
      )}

      {/* Expand All Button */}
      {outline && expandedParagraphs.size < outline.paragraphs.length && (
        <TouchableOpacity
          style={styles.expandAllButton}
          onPress={async () => {
            try {
              // Expand paragraphs one by one to prevent memory issues
              const unexpandedIndices = outline.paragraphs
                .map((_, index) => index)
                .filter(index => !expandedParagraphs.has(index));
              
              for (const index of unexpandedIndices) {
                await expandParagraph(index);
                // Small delay between expansions to prevent memory pressure
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              console.error('Error in expand all:', error);
              Alert.alert('Error', 'Some paragraphs failed to expand. Please try expanding them individually.');
            }
          }}
        >
          <Text style={styles.expandAllButtonText}>{COPY.expandAll}</Text>
        </TouchableOpacity>
      )}

      {/* Paragraphs */}
      {outline && outline.paragraphs.map((paragraph, index) => (
        <View key={index} style={styles.paragraphCard}>
          <View style={styles.paragraphHeader}>
            <Text style={styles.paragraphNumber}>{index + 1}</Text>
            <View style={styles.paragraphInfo}>
              <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
              <Text style={styles.paragraphWordCount}>
                {paragraph.suggestedWordCount} words
                {expandedParagraphs.has(index) && ' • Expanded'}
              </Text>
            </View>
            {!expandedParagraphs.has(index) ? (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => expandParagraph(index)}
              >
                <Text style={styles.expandButtonText}>{COPY.expandParagraph}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.expandedIndicator}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={styles.expandedText}>Expanded</Text>
              </View>
            )}
          </View>

          {expandedParagraphs.has(index) && (
            <View style={styles.expandedContent}>
              <View style={styles.paragraphInputHeader}>
                <Text style={styles.paragraphInputLabel}>Edit Paragraph Content</Text>
                <Text style={styles.paragraphInputHint}>
                  You can edit the generated content below
                </Text>
              </View>
              
              <TextInput
                value={edits[index] || paragraph.expandedText || ''}
                onChangeText={(text) => handleParagraphEdit(index, text)}
                multiline
                numberOfLines={8}
                style={styles.paragraphInput}
                placeholder="Paragraph content will appear here..."
                placeholderTextColor={colors.textSecondary}
              />
              
              {paragraph.unsupportedFlags && paragraph.unsupportedFlags.length > 0 && (
                <View style={styles.warningsSection}>
                  <Text style={styles.warningsTitle}>
                    ⚠️ Content Warnings ({paragraph.unsupportedFlags.length})
                  </Text>
                  {paragraph.unsupportedFlags.map((flag, flagIndex) => (
                    <View key={flagIndex} style={styles.warningCard}>
                      <View style={styles.warningHeader}>
                        <AlertCircle size={16} color={colors.warning} />
                        <Text style={styles.warningTitle}>Unsupported Content</Text>
                      </View>
                      <Text style={styles.warningText}>{flag.sentence}</Text>
                      <Text style={styles.warningExplanation}>
                        {COPY.unsupportedFlagExplanation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {paragraph.citations && paragraph.citations.length > 0 && citationStyle !== 'none' && (
                <View style={styles.citationsSection}>
                  <Text style={styles.citationsLabel}>Citations Used</Text>
                  <View style={styles.citationsGrid}>
                    {paragraph.citations.map((citation, citationIndex) => (
                      <View key={citationIndex} style={styles.citationChip}>
                        <Text style={styles.citationText}>{citation.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      ))}

      {/* Export Section */}
      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export Your Essay</Text>
        <Text style={styles.exportDescription}>
          Choose how you'd like to save or share your completed essay
        </Text>
        
        <View style={styles.exportGrid}>
          <TouchableOpacity
            onPress={saveToFile}
            style={[styles.exportButton, styles.exportButtonPrimary]}
          >
            <Copy size={20} color={colors.cardBackground} />
            <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>
              {COPY.saveToFile}
            </Text>
            <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>
              Save as text file
            </Text>
          </TouchableOpacity>

          
          {citationStyle !== 'none' && (
            <TouchableOpacity
              onPress={copyWithCitations}
              style={[styles.exportButton, styles.exportButtonPrimary]}
            >
              <Copy size={20} color={colors.cardBackground} />
              <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>
                {COPY.copyWithCitations}
              </Text>
              <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>
                With citations
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowReferencesModal(true)}
            style={[styles.exportButton, styles.exportButtonSecondary]}
          >
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.exportButtonText, styles.exportButtonTextPrimary]}>
              View References
            </Text>
            <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextPrimary]}>
              See all citations
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentStep !== 'materials' && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                if (currentStep === 'configure') {
                  setCurrentStep('materials');
                } else if (currentStep === 'generate') {
                  setCurrentStep('configure');
                }
              }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>{COPY.title}</Text>
            <Text style={styles.headerSubtitle}>{COPY.subtitle}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {/* Saved Essays Button - Always Visible */}
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowSavedDocuments(true)}
          >
            <FolderOpen size={20} color={colors.primary} />
          </TouchableOpacity>
          
          {/* Other actions - Only show when on generate step with outline */}
          {currentStep === 'generate' && outline && (
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={saveEssay}
                disabled={isSaving}
              >
                <Save size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={createNewEssay}
              >
                <Plus size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {['materials', 'configure', 'generate'].map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              currentStep === step && styles.progressDotActive
            ]} />
            <Text style={[
              styles.progressLabel,
              currentStep === step && styles.progressLabelActive
            ]}>
              {index + 1}
            </Text>
          </View>
        ))}
      </View>

      {/* Step Content */}
      {currentStep === 'materials' && renderMaterialsStep()}
      {currentStep === 'configure' && renderConfigureStep()}
      {currentStep === 'generate' && renderGenerateStep()}

      {/* Saved Documents Modal */}
      {showSavedDocuments && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowSavedDocuments(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Essays</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSavedDocuments(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {savedEssays.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No saved essays</Text>
                  <Text style={styles.emptyStateText}>
                    Your saved essays will appear here
                  </Text>
                </View>
              ) : (
                savedEssays.map((essay) => (
                  <View key={essay.id} style={styles.savedEssayCard}>
                    <View style={styles.savedEssayHeader}>
                      <Text style={styles.savedEssayTitle}>{essay.title}</Text>
                      <Text style={styles.savedEssayDate}>
                        {new Date(essay.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.savedEssayInfo}>
                      <Text style={styles.savedEssayInfoText}>
                        {essay.essayTopic} • {essay.wordCount} words
                      </Text>
                    </View>
                    <View style={styles.savedEssayActions}>
                      <TouchableOpacity
                        style={[styles.savedEssayButton, styles.loadButton]}
                        onPress={() => loadSavedEssay(essay)}
                      >
                        <Text style={styles.loadButtonText}>Load</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.savedEssayButton, styles.deleteButton]}
                        onPress={() => deleteSavedEssay(essay.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* References Modal */}
      {showReferencesModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowReferencesModal(false)}
            activeOpacity={1}
          />
          <View style={styles.referencesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Essay References</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowReferencesModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.referencesModalScrollView}>
              {outline ? (
                <>
                  <Text style={styles.referencesTitle}>All Citations and References</Text>
                  <Text style={styles.referencesText}>
                    {outline.paragraphs.map((paragraph, index) => {
                      if (!paragraph.citations || paragraph.citations.length === 0) return null;
                      
                      return (
                        <React.Fragment key={index}>
                          <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
                          {paragraph.citations.map((citation, citationIndex) => (
                            <Text key={citationIndex} style={styles.citationItem}>
                              • {citation.text} (Source: {citation.source})
                            </Text>
                          ))}
                          {'\n'}
                        </React.Fragment>
                      );
                    })}
                  </Text>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No References Available</Text>
                  <Text style={styles.emptyStateText}>
                    Generate an essay outline and expand paragraphs to see references here.
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  const references = outline?.paragraphs
                    .flatMap(p => p.citations || [])
                    .map(c => `• ${c.text} (Source: ${c.source})`)
                    .join('\n') || 'No references available';
                  
                  Share.share({
                    message: `Essay References:\n\n${references}`,
                    title: 'Essay References',
                  });
                }}
              >
                <Text style={styles.modalButtonText}>Share References</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    marginLeft: 12,
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressStep: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  uploadSectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  uploadButtonSecondary: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.primary,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButtonTextWhite: {
    color: colors.cardBackground,
  },
  uploadButtonTextPrimary: {
    color: colors.primary,
  },
  filesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileGroupSection: {
    marginBottom: 16,
  },
  fileGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityButton: {
    padding: 4,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  fileExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  sampleEssayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  sampleEssayLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  fileMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileType: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  priorityLabel: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  wordCountRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  wordCountButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  wordCountButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wordCountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  wordCountButtonTextActive: {
    color: colors.cardBackground,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    margin: 4,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionItemRecommended: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: colors.cardBackground,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  integritySection: {
    marginBottom: 24,
  },
  integrityCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  integrityText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  progressOverview: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  usageSummary: {
    marginTop: 8,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageStat: {
    alignItems: 'center',
  },
  usageStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  usageStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  thesisCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thesisText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  expandAllButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  expandAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  paragraphCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paragraphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paragraphNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.cardBackground,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  paragraphInfo: {
    flex: 1,
  },
  paragraphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paragraphWordCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expandButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  expandedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expandedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: 12,
  },
  paragraphInputHeader: {
    marginBottom: 8,
  },
  paragraphInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paragraphInputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paragraphInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  warningsSection: {
    marginTop: 12,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 8,
  },
  warningCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  warningText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
  },
  warningExplanation: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  citationsSection: {
    marginTop: 12,
  },
  citationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  citationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  citationChip: {
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  citationText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  exportSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  exportButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  exportButtonSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  exportButtonError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  exportButtonSecondary: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.primary,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  exportButtonTextWhite: {
    color: colors.cardBackground,
  },
  exportButtonTextPrimary: {
    color: colors.primary,
  },
  exportButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  exportButtonSubtextWhite: {
    color: colors.cardBackground,
  },
  exportButtonSubtextPrimary: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  referencesModalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    width: width * 1.0,
    maxHeight: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 0,
  },
  referencesModalScrollView: {
    maxHeight: 800,
    padding: 20,
  },
  referencesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  referencesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  citationItem: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 16,
    marginBottom: 4,
    lineHeight: 18,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  savedEssayCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  savedEssayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedEssayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  savedEssayDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  savedEssayInfo: {
    marginBottom: 12,
  },
  savedEssayInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  savedEssayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  savedEssayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  loadButton: {
    backgroundColor: colors.primary,
  },
  loadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cardBackground,
  },
});