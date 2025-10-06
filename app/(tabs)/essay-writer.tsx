/**
 * Grounded Essay Writer - Crash-Resistant Version
 * 
 * A completely rebuilt essay writing tool that:
 * - Uses NO .split() operations to prevent Hermes crashes
 * - Has comprehensive error boundaries
 * - Uses memory-safe string operations
 * - Provides a stable, crash-free experience
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import { mockApi } from '../../services/mockApi';
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
  copyToClipboard: 'Copy to Clipboard',
  downloadDocx: 'Download as Word',
  downloadPdf: 'Download as PDF',
  copyWithCitations: 'Copy with Citations',
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

// Safe string utilities - NO .split() operations
const SafeStringUtils = {
  // Safe alternative to .split() - uses indexOf and substring
  safeSplit: (text: string, delimiter: string): string[] => {
    try {
      if (!text || typeof text !== 'string') return [];
      if (!delimiter || typeof delimiter !== 'string') return [text];
      
      const result: string[] = [];
      let start = 0;
      let index = text.indexOf(delimiter);
      
      while (index !== -1) {
        result.push(text.substring(start, index));
        start = index + delimiter.length;
        index = text.indexOf(delimiter, start);
      }
      
      result.push(text.substring(start));
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

// Error Boundary Component
class EssayWriterErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('Essay Writer Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: 20 }}>
              Something went wrong with the Essay Writer.
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Please try again or contact support if the issue persists.
            </Text>
            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonPrimary]}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (this.props as any).children;
  }
}

export default function GroundedEssayWriter() {
  // Subscription hooks
  const { canGenerateEssay, trackEssayGeneration } = useSubscription();

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
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Safe reference generation
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

  // Safe copy to clipboard
  const copyToClipboard = async () => {
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

      // Actually copy to clipboard
      await Clipboard.setStringAsync(fullText);
      Alert.alert('Success', 'Essay copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Safe text download
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

  // Safe essay generation
  const generateOutline = async () => {
    try {
      if (!canGenerateEssay()) {
        handleEssayLimit();
        return;
      }

      if (!prompt.trim() || !essayTopic.trim()) {
        Alert.alert('Missing Information', 'Please provide both the essay prompt and topic.');
        return;
      }

      if (files.length === 0) {
        Alert.alert('No Materials', 'Please upload at least one material before generating an outline.');
        return;
      }

      setIsGenerating(true);

      const request = {
        prompt: SafeStringUtils.limitString(prompt, 2000),
        topic: SafeStringUtils.limitString(essayTopic, 500),
        wordCount: wordCount,
        level: academicLevel,
        academicLevel,
        citationStyle,
        mode,
        fileIds: files.map(f => f.id),
        materials: files.map(f => ({
          id: f.id,
          name: SafeStringUtils.limitString(f.name, 200),
          excerpt: SafeStringUtils.limitString(f.excerpt, 1000),
          group: f.group,
          priority: f.priority
        })),
        smartSelection: smartSelection
      };

      const response = await mockApi.generateOutline(request);
      
      if (response.outlineId) {
        const outline: Outline = {
          outlineId: response.outlineId,
          thesis: response.thesis,
          paragraphs: response.paragraphs,
          metadata: response.metadata
        };
        setOutline(outline);
        setCurrentStep('generate');
        trackEssayGeneration();
      } else {
        Alert.alert('Error', 'Failed to generate outline');
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      Alert.alert('Error', 'Failed to generate outline. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe file upload
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
          type: 'file'
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

  // Safe file removal
  const removeFile = (fileId: string) => {
    try {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.warn('Error removing file:', error);
    }
  };

  // Safe paragraph expansion
  const expandParagraph = async (index: number) => {
    try {
      if (!outline) return;

      const paragraph = outline.paragraphs[index];
      if (!paragraph) return;

      const request = {
        outlineId: outline.outlineId,
        paragraphIndex: index,
        paragraph: paragraph,
        materials: files.map(f => ({
          id: f.id,
          name: SafeStringUtils.limitString(f.name, 200),
          excerpt: SafeStringUtils.limitString(f.excerpt, 1000),
          group: f.group,
          priority: f.priority
        })),
        citationStyle,
        mode
      };

      const response = await mockApi.expandParagraph(request);
      
      if (response.paragraphText) {
        const updatedOutline = {
          ...outline,
          paragraphs: outline.paragraphs.map((p, i) => 
            i === index ? { 
              ...p, 
              expandedText: response.paragraphText,
              usedChunks: response.usedChunks,
              citations: response.citations,
              unsupportedFlags: response.unsupportedFlags
            } : p
          )
        };
        setOutline(updatedOutline);
        setExpandedParagraphs(prev => new Set([...prev, index]));
      } else {
        Alert.alert('Error', 'Failed to expand paragraph');
      }
    } catch (error) {
      console.error('Error expanding paragraph:', error);
      Alert.alert('Error', 'Failed to expand paragraph');
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

      const saved = await AsyncStorage.getItem('saved_essays');
      const savedEssays = saved ? JSON.parse(saved) : [];
      
      if (Array.isArray(savedEssays)) {
        const updatedEssays = [...savedEssays, essayData];
        await AsyncStorage.setItem('saved_essays', JSON.stringify(updatedEssays));
        setSavedEssays(updatedEssays);
        Alert.alert('Success', 'Essay saved successfully!');
      } else {
        await AsyncStorage.setItem('saved_essays', JSON.stringify([essayData]));
        setSavedEssays([essayData]);
        Alert.alert('Success', 'Essay saved successfully!');
      }
    } catch (error) {
      console.error('Error saving essay:', error);
      Alert.alert('Error', 'Failed to save essay');
    } finally {
      setIsSaving(false);
    }
  };

  // Safe essay loading
  const loadSavedEssays = async () => {
    try {
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

  // Load saved essays on mount
  React.useEffect(() => {
    loadSavedEssays();
  }, []);

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

      {/* File Upload */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={uploadFile}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Upload size={20} color={colors.primary} />
          )}
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Materials'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Files List */}
      {files.length > 0 && (
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Uploaded Materials ({files.length})</Text>
          {files.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileHeader}>
                <FileText size={16} color={colors.primary} />
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFile(file.id)}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.fileExcerpt}>{file.excerpt}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          (!essayTopic.trim() || !prompt.trim() || files.length === 0) && styles.nextButtonDisabled
        ]}
        onPress={() => setCurrentStep('configure')}
        disabled={!essayTopic.trim() || !prompt.trim() || files.length === 0}
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

      {/* Thesis */}
      {outline && (
        <View style={styles.thesisCard}>
          <Text style={styles.thesisText}>{outline.thesis}</Text>
        </View>
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
              </Text>
            </View>
            {!expandedParagraphs.has(index) && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => expandParagraph(index)}
              >
                <Text style={styles.expandButtonText}>{COPY.expandParagraph}</Text>
              </TouchableOpacity>
            )}
          </View>

          {expandedParagraphs.has(index) && (
            <View style={styles.expandedContent}>
              <TextInput
                value={edits[index] || stripCitationsFromText(paragraph.expandedText || '')}
                onChangeText={(text) => handleParagraphEdit(index, text)}
                multiline
                numberOfLines={8}
                style={styles.paragraphInput}
                placeholder="Paragraph content will appear here..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
        </View>
      ))}

      {/* Export Section */}
      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export Your Essay</Text>
        
        <View style={styles.exportGrid}>
          <TouchableOpacity
            onPress={copyToClipboard}
            style={[styles.exportButton, styles.exportButtonPrimary]}
          >
            <Copy size={20} color={colors.cardBackground} />
            <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>
              {COPY.copyToClipboard}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={downloadAsText}
            style={[styles.exportButton, styles.exportButtonSuccess]}
          >
            <Download size={20} color={colors.cardBackground} />
            <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>
              Download as Text
            </Text>
            <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>
              Text document
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <EssayWriterErrorBoundary>
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
                  onPress={() => setShowSavedDocuments(true)}
                >
                  <FolderOpen size={20} color={colors.primary} />
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
      </SafeAreaView>
    </EssayWriterErrorBoundary>
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
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
  removeButton: {
    padding: 4,
  },
  fileExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  expandedContent: {
    marginTop: 12,
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
  exportSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  exportButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  exportButtonSubtextWhite: {
    color: colors.cardBackground,
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