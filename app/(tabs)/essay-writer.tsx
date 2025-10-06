/**
 * Grounded Essay Writer - Production Ready Frontend Component
 * 
 * A comprehensive essay writing tool that allows students to:
 * - Upload materials and organize them into Relevant Notes and References
 * - Configure essay parameters (word count, academic level, citation style)
 * - Generate grounded essays using provided materials
 * - Review and edit generated content with inline citations
 * 
 * To integrate with real backend:
 * 1. Replace mockApi calls with actual API endpoints
 * 2. Update promptTemplates with your LLM service
 * 3. Implement real file upload handling
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
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

  // Load saved essays on component mount
  React.useEffect(() => {
    loadSavedEssays();
  }, []);

  // Cleanup effect to prevent memory leaks
  React.useEffect(() => {
    return () => {
      // Cleanup any pending timeouts or async operations
      setShowSavedDocuments(false);
    };
  }, []);

  // Load saved essays from AsyncStorage
  const loadSavedEssays = async () => {
    try {
      const saved = await AsyncStorage.getItem('saved_essays');
      if (saved) {
        setSavedEssays(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved essays:', error);
    }
  };

  // Save current essay
  const saveEssay = async () => {
    if (!outline || !thesis) {
      Alert.alert('Error', 'No essay to save. Please generate an essay first.');
      return;
    }

    setIsSaving(true);
    try {
      const essayData = {
        id: Date.now().toString(),
        title: thesis,
        thesis,
        outline,
        files,
        sampleEssay,
        wordCount,
        academicLevel,
        citationStyle,
        includeReferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedEssays = [...savedEssays, essayData];
      setSavedEssays(updatedEssays);
      await AsyncStorage.setItem('saved_essays', JSON.stringify(updatedEssays));
      
      Alert.alert('Success', 'Essay saved successfully!');
    } catch (error) {
      console.error('Error saving essay:', error);
      Alert.alert('Error', 'Failed to save essay. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved essay
  const loadSavedEssay = (essay: any) => {
    // Use setTimeout to ensure modal is fully dismissed before state changes
    setTimeout(() => {
      setThesis(essay.thesis);
      setOutline(essay.outline);
      setFiles(essay.files || []);
      setSampleEssay(essay.sampleEssay || null);
      setWordCount(essay.wordCount || 1000);
      setAcademicLevel(essay.academicLevel || 'undergraduate');
      setCitationStyle(essay.citationStyle || 'apa');
      setIncludeReferences(essay.includeReferences || false);
      setCurrentStep('generate');
    }, 100);
    setShowSavedDocuments(false);
  };

  // Delete a saved essay
  const deleteSavedEssay = async (essayId: string) => {
    try {
      const updatedEssays = savedEssays.filter(essay => essay.id !== essayId);
      setSavedEssays(updatedEssays);
      await AsyncStorage.setItem('saved_essays', JSON.stringify(updatedEssays));
      Alert.alert('Success', 'Essay deleted successfully!');
    } catch (error) {
      console.error('Error deleting essay:', error);
      Alert.alert('Error', 'Failed to delete essay. Please try again.');
    }
  };

  // Create new essay
  const createNewEssay = () => {
    try {
      Alert.alert(
        'Create New Essay',
        'Are you sure you want to start a new essay? All current progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create New',
            style: 'destructive',
            onPress: () => {
              try {
                // Reset all state in a single batch
                setThesis('');
                setOutline(null);
                setFiles([]);
                setSampleEssay(null);
                setWordCount(1000);
                setAcademicLevel('undergraduate');
                setCitationStyle('apa');
                setIncludeReferences(false);
                setCurrentStep('materials');
                setExpandedParagraphs(new Set());
                setEdits({});
                setReferenceAnalysis({});
                setSmartSelection(null);
              } catch (error) {
                console.error('Error creating new essay:', error);
                Alert.alert('Error', 'Failed to create new essay. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing create new essay alert:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Helper functions
  const getNextOrder = (group: 'notes' | 'references') => {
    const groupFiles = files.filter(f => f.group === group);
    return groupFiles.length > 0 ? Math.max(...groupFiles.map(f => f.order)) + 1 : 0;
  };

  // Generate references list based on citation style
  const generateReferencesList = () => {
    if (!includeReferences || citationStyle === 'none') return null;
    
    const referenceFiles = files.filter(f => f.group === 'references');
    if (referenceFiles.length === 0) return null;

    const references = referenceFiles.map((file, index) => {
      const year = new Date().getFullYear();
      const author = `Author ${index + 1}`;
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
      
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
  };

  const stripCitationsFromText = (text: string): string => {
    if (citationStyle === 'none') {
      // Remove common citation patterns
      return text
        // Remove parenthetical citations like (Smith, 2023) or (Smith et al., 2023)
        .replace(/\([^)]*\d{4}[^)]*\)/g, '')
        // Remove author-date citations like Smith (2023)
        .replace(/\b[A-Z][a-z]+(?:\s+et\s+al\.)?\s*\(\d{4}\)/g, '')
        // Remove numbered citations like [1] or [1,2,3]
        .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
        // Remove superscript citations like ¹ or ²
        .replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, '')
        // Clean up extra spaces and punctuation
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,;:!?])/g, '$1')
        .replace(/\(\s*\)/g, '')
        .trim();
    }
    return text;
  };

  // AI Reference Analysis
  const analyzeReferences = async () => {
    if (!prompt.trim() || !essayTopic.trim()) {
      Alert.alert('Missing Information', 'Please provide both the essay prompt and topic before analyzing references.');
      return;
    }

    const referenceFiles = files.filter(f => f.group === 'references');
    if (referenceFiles.length === 0) {
      Alert.alert('No References', 'Please upload some references first.');
      return;
    }

    setIsAnalyzingReferences(true);
    try {
      // TODO: Replace with real API call
      const response = await mockApi.analyzeReferences({
        prompt,
        essayTopic,
        assignmentTitle,
        references: referenceFiles.map(f => ({
          id: f.id,
          name: f.name,
          excerpt: f.excerpt,
          content: f.excerpt, // In real implementation, this would be full content
        })),
      });

      // Update files with analysis data
      setFiles(prev => prev.map(file => {
        if (file.group === 'references' && response.analysis[file.id]) {
          return {
            ...file,
            analysis: response.analysis[file.id]
          };
        }
        return file;
      }));

      setReferenceAnalysis(response.analysis);
      setSmartSelection(response.smartSelection);
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to analyze references. Please try again.');
    } finally {
      setIsAnalyzingReferences(false);
    }
  };

  const reorderFiles = (group: 'notes' | 'references', fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const groupFiles = prev.filter(f => f.group === group).sort((a, b) => a.order - b.order);
      const otherFiles = prev.filter(f => f.group !== group);
      
      const [movedItem] = groupFiles.splice(fromIndex, 1);
      groupFiles.splice(toIndex, 0, movedItem);
      
      const reorderedGroupFiles = groupFiles.map((file, index) => ({
        ...file,
        order: index
      }));
      
      return [...otherFiles, ...reorderedGroupFiles];
    });
  };

  const togglePriority = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, priority: !file.priority } : file
    ));
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const updateExcerpt = (fileId: string, excerpt: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, excerpt } : file
    ));
  };

  // File handling
  const handleFileUpload = async (group: 'notes' | 'references') => {
    setIsUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        
        // TODO: Replace with real API call
        const response = await mockApi.uploadFile(group, {
          name: file.name,
          type: file.mimeType || 'text/plain',
          content: fileContent,
        });

        const newFile: FileItem = {
          id: response.fileId,
          group,
          name: response.fileName,
          excerpt: response.excerpt,
          priority: false,
          order: getNextOrder(group),
          pages: response.pages,
          type: 'file',
        };

        setFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteText = async (group: 'notes' | 'references', text: string) => {
    if (!text.trim()) return;

    try {
      // TODO: Replace with real API call
      const response = await mockApi.pasteText(group, text);

      const newFile: FileItem = {
        id: response.fileId,
        group,
        name: response.title,
        excerpt: response.excerpt,
        priority: false,
        order: getNextOrder(group),
        type: 'text',
      };

      setFiles(prev => [...prev, newFile]);
    } catch (error) {
      Alert.alert('Error', 'Failed to process text');
    }
  };

  const handleSampleEssayUpload = async () => {
    setIsUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        
        // TODO: Replace with real API call
        const response = await mockApi.uploadFile('notes', {
          name: file.name,
          type: file.mimeType || 'text/plain',
          content: fileContent,
        });

        const sampleFile: FileItem = {
          id: response.fileId,
          group: 'notes',
          name: response.fileName,
          excerpt: response.excerpt,
          priority: true, // Mark as priority for style matching
          order: 0,
          pages: response.pages,
          type: 'file',
        };

        setSampleEssay(sampleFile);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload sample essay');
    } finally {
      setIsUploading(false);
    }
  };

  // Generation functions
  const generateOutline = async () => {
    if (!prompt.trim() || !integrityChecked) return;

    // Check if user can generate essays
    if (!canGenerateEssay()) {
      handleEssayLimit();
      return;
    }

    setIsGenerating(true);
    try {
      // Use smart reference selection if available, otherwise use all files
      let fileIds = files.map(f => f.id);
      
      if (smartSelection && smartSelection.selectedReferences.length > 0) {
        // Use AI-selected references
        fileIds = smartSelection.selectedReferences;
        console.log('Using AI-selected references:', smartSelection.reasoning);
      }
      
      if (sampleEssay) {
        fileIds.unshift(sampleEssay.id); // Add sample essay as first priority
      }
      
      // TODO: Replace with real API call
      const response = await mockApi.generateOutline({
        prompt,
        wordCount,
        level: academicLevel,
        citationStyle,
        mode,
        fileIds,
        rubric: assignmentTitle,
        essayTopic,
        sampleEssayId: sampleEssay?.id,
        smartSelection: smartSelection,
      });

      // Track essay generation
      await trackEssayGeneration();

      setOutline(response);
      setCurrentStep('generate');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate outline');
    } finally {
      setIsGenerating(false);
    }
  };

  const expandParagraph = async (paragraphIndex: number) => {
    if (!outline) return;

    try {
      // TODO: Replace with real API call
      const response = await mockApi.expandParagraph({
        outlineId: outline.outlineId,
        paragraphIndex,
      });

      setOutline(prev => {
        if (!prev) return null;
        const updatedParagraphs = [...prev.paragraphs];
        updatedParagraphs[paragraphIndex] = {
          ...updatedParagraphs[paragraphIndex],
          expandedText: response.paragraphText,
          usedChunks: response.usedChunks,
          citations: response.citations,
          unsupportedFlags: response.unsupportedFlags,
        };
        return { ...prev, paragraphs: updatedParagraphs };
      });

      setExpandedParagraphs(prev => new Set([...prev, paragraphIndex]));
    } catch (error) {
      Alert.alert('Error', 'Failed to expand paragraph');
    }
  };

  const expandAllParagraphs = async () => {
    if (!outline) return;

    for (let i = 0; i < outline.paragraphs.length; i++) {
      if (!expandedParagraphs.has(i)) {
        await expandParagraph(i);
      }
    }
  };

  // Export functions
  const copyToClipboard = async () => {
    if (!outline) return;

    const essayTitle = thesis || 'Generated Essay';
    const essayText = outline.paragraphs
      .map((p, i) => {
        const text = edits[i] || p.expandedText || '';
        const cleanText = stripCitationsFromText(text);
        return `${p.title}\n\n${cleanText}`;
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

    await Share.share({
      message: fullText,
      title: 'Essay',
    });
  };

  const downloadAsDocx = async () => {
    if (!outline) return;

    try {
      const essayTitle = thesis || 'Generated Essay';
      
      // Create Word document structure
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
          
          references.split('\n\n').forEach(ref => {
            if (ref.trim()) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: ref,
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

      // Create the document
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
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `essay_${timestamp}.docx`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, buffer.toString('base64'), {
        encoding: FileSystem.EncodingType.Base64
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Save Essay as Word Document'
        });
      } else {
        Alert.alert('Success', 'Word document saved successfully');
      }
    } catch (error) {
      console.error('Error saving Word document:', error);
      Alert.alert('Error', 'Failed to save Word document');
    }
  };

  const downloadAsPdf = async () => {
    if (!outline) return;

    try {
      const essayTitle = thesis || 'Generated Essay';
      
      // Create PDF document
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(essayTitle, 20, 30);
      
      let yPosition = 50;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = pdf.internal.pageSize.width - (margin * 2);
      
      // Add paragraphs
      outline.paragraphs.forEach((p, i) => {
        const text = edits[i] || p.expandedText || '';
        const cleanText = stripCitationsFromText(text);
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Add paragraph title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const titleLines = pdf.splitTextToSize(p.title, maxWidth);
        pdf.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 7 + 5;
        
        // Add paragraph content
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(cleanText, maxWidth);
        
        // Check if content fits on current page
        if (yPosition + (contentLines.length * 6) > pageHeight - 20) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.text(contentLines, margin, yPosition);
        yPosition += contentLines.length * 6 + 15;
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
          
          // Add references title
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('References', margin, yPosition);
          yPosition += 20;
          
          // Add references content
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const referenceLines = pdf.splitTextToSize(references, maxWidth);
          
          referenceLines.forEach(line => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 30;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          });
        }
      }
      
      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `essay_${timestamp}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      const pdfOutput = pdf.output('datauristring');
      const base64Data = pdfOutput.split(',')[1];
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Essay as PDF'
        });
      } else {
        Alert.alert('Success', 'PDF saved successfully');
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      Alert.alert('Error', 'Failed to save PDF');
    }
  };

  const copyWithCitations = async () => {
    if (!outline) return;

    const essayTitle = thesis || 'Generated Essay';
    const essayWithCitations = outline.paragraphs
      .map((p, i) => {
        let text = edits[i] || p.expandedText || '';
        
        // Add inline citations
        if (p.citations) {
          p.citations.forEach(citation => {
            text = text.replace(
              citation.text,
              `${citation.text} (${citation.source})`
            );
          });
        }

        return `${p.title}\n\n${text}`;
      })
      .join('\n\n\n');

    // Add references if they exist and are enabled
    let fullText = `${essayTitle}\n\n${essayWithCitations}`;
    
    if (includeReferences && citationStyle !== 'none') {
      const references = generateReferencesList();
      if (references) {
        fullText += `\n\n\nReferences\n\n${references}`;
      }
    }

    await Share.share({
      message: fullText,
      title: 'Essay with Citations',
    });
  };

  // Render functions
  const renderFileCard = (file: FileItem, index: number) => (
    <View key={file.id} style={styles.fileCard}>
      <View style={styles.fileCardHeader}>
        <View style={styles.fileInfo}>
          <View style={styles.fileTitleRow}>
            <FileText size={16} color={colors.primary} />
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            {file.priority && (
              <View style={styles.priorityBadge}>
                <Star size={12} color={colors.warning} fill={colors.warning} />
                <Text style={styles.priorityText}>Priority</Text>
              </View>
            )}
            {file.analysis && (
              <View style={[
                styles.relevanceBadge,
                { backgroundColor: file.analysis.relevanceScore >= 80 ? colors.success + '20' : 
                                   file.analysis.relevanceScore >= 60 ? colors.warning + '20' : 
                                   colors.error + '20' }
              ]}>
                <Text style={[
                  styles.relevanceText,
                  { color: file.analysis.relevanceScore >= 80 ? colors.success : 
                           file.analysis.relevanceScore >= 60 ? colors.warning : 
                           colors.error }
                ]}>
                  {file.analysis.relevanceScore}% relevant
                </Text>
              </View>
            )}
          </View>
          
          {file.pages && (
            <Text style={styles.filePages}>{file.pages} pages</Text>
          )}
          
          <Text style={styles.fileExcerpt} numberOfLines={3}>
            {file.excerpt}
          </Text>

          {file.analysis && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>AI Analysis:</Text>
              <Text style={styles.analysisSummary} numberOfLines={2}>
                {file.analysis.summary}
              </Text>
              {file.analysis.keyTopics.length > 0 && (
                <View style={styles.topicsContainer}>
                  {file.analysis.keyTopics.slice(0, 3).map((topic, idx) => (
                    <View key={idx} style={styles.topicChip}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.fileActions}>
          <TouchableOpacity
            onPress={() => togglePriority(file.id)}
            style={styles.actionIcon}
          >
            <Star 
              size={20} 
              color={file.priority ? colors.warning : colors.textSecondary}
              fill={file.priority ? colors.warning : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => deleteFile(file.id)}
            style={styles.actionIcon}
          >
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMaterialsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Set Up Your Essay</Text>
        <Text style={styles.stepDescription}>
          Tell us about your essay topic and optionally upload materials for better results
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Essay Title and Topic */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Essay Title</Text>
          <TextInput
            value={assignmentTitle}
            onChangeText={setAssignmentTitle}
            placeholder="Enter your essay title..."
            style={styles.textInput}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>What is your essay about?</Text>
          <TextInput
            value={essayTopic}
            onChangeText={setEssayTopic}
            placeholder="Describe the main topic, theme, or focus of your essay..."
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        {/* Sample Essay Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sample Essay (Optional)</Text>
          <Text style={styles.helperText}>
            Upload a sample of your writing so the AI can match your style
          </Text>
          
          {sampleEssay ? (
            <View style={styles.sampleEssayCard}>
              <View style={styles.sampleEssayHeader}>
                <View style={styles.sampleEssayInfo}>
                  <FileText size={20} color={colors.secondary} />
                  <Text style={styles.sampleEssayName}>{sampleEssay.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSampleEssay(null)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sampleEssayExcerpt} numberOfLines={2}>
                {sampleEssay.excerpt}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSampleEssayUpload}
              style={[styles.uploadArea, { borderColor: colors.secondary + '40' }]}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={colors.secondary} />
              ) : (
                <>
                  <Upload size={32} color={colors.secondary} />
                  <Text style={[styles.uploadText, { color: colors.secondary }]}>Upload Sample Essay</Text>
                  <Text style={styles.uploadSubtext}>TXT, PDF, DOCX supported</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Research Materials */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Research Materials (Optional)</Text>
          <Text style={styles.helperText}>
            Upload your research materials, notes, and references to ground your essay in evidence
          </Text>
        </View>
        
        <View style={styles.materialsContainer}>
          <View style={styles.materialGroup}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: colors.primaryLight }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <Text style={styles.groupTitle}>Relevant Notes</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => handleFileUpload('notes')}
              style={[styles.uploadArea, { borderColor: colors.primary + '40' }]}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <Upload size={32} color={colors.primary} />
                  <Text style={styles.uploadText}>Upload File</Text>
                  <Text style={styles.uploadSubtext}>TXT, PDF, DOCX supported</Text>
                </>
              )}
            </TouchableOpacity>
            
            {files.filter(f => f.group === 'notes' && f.id !== sampleEssay?.id).map((file, index) => renderFileCard(file, index))}
          </View>
          
          <View style={styles.materialGroup}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle size={20} color={colors.success} />
              </View>
              <Text style={styles.groupTitle}>References</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => handleFileUpload('references')}
              style={[styles.uploadArea, { borderColor: colors.success + '40' }]}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={colors.success} />
              ) : (
                <>
                  <Upload size={32} color={colors.success} />
                  <Text style={[styles.uploadText, { color: colors.success }]}>Upload File</Text>
                  <Text style={styles.uploadSubtext}>TXT, PDF, DOCX supported</Text>
                </>
              )}
            </TouchableOpacity>
            
            {files.filter(f => f.group === 'references').map((file, index) => renderFileCard(file, index))}
          </View>
        </View>

        {/* AI Reference Analysis */}
        {files.filter(f => f.group === 'references').length > 0 && (assignmentTitle.trim() || essayTopic.trim()) && (
          <View style={styles.inputGroup}>
            <TouchableOpacity
              onPress={analyzeReferences}
              style={[styles.analyzeButton, { opacity: isAnalyzingReferences ? 0.5 : 1 }]}
              disabled={isAnalyzingReferences}
            >
              {isAnalyzingReferences ? (
                <ActivityIndicator size="small" color={colors.cardBackground} />
              ) : (
                <>
                  <Text style={styles.analyzeButtonText}>🤖 Analyze References with AI</Text>
                  <ArrowRight size={20} color={colors.cardBackground} />
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.analyzeDescription}>
              AI will analyze your references and select the most relevant ones for your essay topic
            </Text>
          </View>
        )}

        {/* Smart Selection Results */}
        {smartSelection && (
          <View style={styles.smartSelectionCard}>
            <View style={styles.smartSelectionHeader}>
              <Text style={styles.smartSelectionTitle}>🎯 AI Reference Selection</Text>
              <Text style={styles.smartSelectionSubtitle}>
                Selected {smartSelection.selectedCount} of {smartSelection.totalReferences} references
              </Text>
            </View>
            <Text style={styles.smartSelectionReasoning}>
              {smartSelection.reasoning}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          onPress={() => setCurrentStep('configure')}
          style={[styles.continueButton, { opacity: (assignmentTitle.trim() || essayTopic.trim()) ? 1 : 0.5 }]}
          disabled={!assignmentTitle.trim() && !essayTopic.trim()}
        >
          <Text style={styles.continueButtonText}>Continue to Configuration</Text>
          <ArrowRight size={20} color={colors.cardBackground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderConfigureStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Configure Your Essay</Text>
        <Text style={styles.stepDescription}>
          {COPY.configureHeader}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Required Question / Prompt *</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Enter your essay prompt or question..."
            multiline
            numberOfLines={4}
            style={[styles.textInput, styles.textArea]}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Word Count</Text>
          <View style={styles.wordCountButtons}>
            {[250, 500, 800, 1200].map(count => (
              <TouchableOpacity
                key={count}
                onPress={() => setWordCount(count)}
                style={[
                  styles.wordCountButton,
                  wordCount === count && styles.wordCountButtonActive
                ]}
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
            value={customWordCount}
            onChangeText={(text) => {
              setCustomWordCount(text);
              const num = parseInt(text);
              if (!isNaN(num) && num > 0) {
                setWordCount(num);
              }
            }}
            placeholder="Custom word count"
            keyboardType="numeric"
            style={styles.textInput}
            placeholderTextColor={colors.textSecondary}
          />
          
          <Text style={styles.helperText}>
            {wordCount} words ≈ {Math.ceil(wordCount / 200)}–{Math.ceil(wordCount / 150)} paragraphs
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Academic Level</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              onPress={() => setAcademicLevel('high-school')}
              style={[
                styles.optionItem,
                academicLevel === 'high-school' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  academicLevel === 'high-school' && styles.optionTextActive
                ]}>
                  High School
                </Text>
                <Text style={[
                  styles.optionDescription,
                  academicLevel === 'high-school' && styles.optionDescriptionActive
                ]}>
                  Clear, accessible language with basic concepts
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setAcademicLevel('undergraduate')}
              style={[
                styles.optionItem,
                academicLevel === 'undergraduate' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  academicLevel === 'undergraduate' && styles.optionTextActive
                ]}>
                  Undergraduate
                </Text>
                <Text style={[
                  styles.optionDescription,
                  academicLevel === 'undergraduate' && styles.optionDescriptionActive
                ]}>
                  College-level analysis with academic tone
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setAcademicLevel('graduate')}
              style={[
                styles.optionItem,
                academicLevel === 'graduate' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  academicLevel === 'graduate' && styles.optionTextActive
                ]}>
                  Graduate
                </Text>
                <Text style={[
                  styles.optionDescription,
                  academicLevel === 'graduate' && styles.optionDescriptionActive
                ]}>
                  Advanced analysis with sophisticated arguments
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setAcademicLevel('professional')}
              style={[
                styles.optionItem,
                academicLevel === 'professional' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  academicLevel === 'professional' && styles.optionTextActive
                ]}>
                  Professional
                </Text>
                <Text style={[
                  styles.optionDescription,
                  academicLevel === 'professional' && styles.optionDescriptionActive
                ]}>
                  Expert-level content with industry terminology
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Citations & References (Optional)</Text>
          <Text style={styles.helperText}>
            Citations are completely optional. Choose "No Citations" for a simple essay, or select a citation style if you need references.
          </Text>
          
          <View style={styles.optionList}>
            <TouchableOpacity
              onPress={() => {
                setCitationStyle('none');
                setIncludeReferences(false);
              }}
              style={[
                styles.optionItem,
                citationStyle === 'none' && styles.optionItemActive,
                citationStyle === 'none' && styles.optionItemRecommended
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  citationStyle === 'none' && styles.optionTextActive
                ]}>
                  ✨ No Citations (Recommended)
                </Text>
                <Text style={[
                  styles.optionDescription,
                  citationStyle === 'none' && styles.optionDescriptionActive
                ]}>
                  Generate a clean essay without citations or references - perfect for most assignments
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setCitationStyle('apa');
                setIncludeReferences(true);
              }}
              style={[
                styles.optionItem,
                citationStyle === 'apa' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  citationStyle === 'apa' && styles.optionTextActive
                ]}>
                  APA Style
                </Text>
                <Text style={[
                  styles.optionDescription,
                  citationStyle === 'apa' && styles.optionDescriptionActive
                ]}>
                  Psychology, education, and social sciences
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setCitationStyle('mla');
                setIncludeReferences(true);
              }}
              style={[
                styles.optionItem,
                citationStyle === 'mla' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  citationStyle === 'mla' && styles.optionTextActive
                ]}>
                  MLA Style
                </Text>
                <Text style={[
                  styles.optionDescription,
                  citationStyle === 'mla' && styles.optionDescriptionActive
                ]}>
                  Literature, arts, and humanities
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setCitationStyle('harvard');
                setIncludeReferences(true);
              }}
              style={[
                styles.optionItem,
                citationStyle === 'harvard' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  citationStyle === 'harvard' && styles.optionTextActive
                ]}>
                  Harvard Style
                </Text>
                <Text style={[
                  styles.optionDescription,
                  citationStyle === 'harvard' && styles.optionDescriptionActive
                ]}>
                  Business, economics, and general academic writing
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setCitationStyle('chicago');
                setIncludeReferences(true);
              }}
              style={[
                styles.optionItem,
                citationStyle === 'chicago' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  citationStyle === 'chicago' && styles.optionTextActive
                ]}>
                  Chicago Style
                </Text>
                <Text style={[
                  styles.optionDescription,
                  citationStyle === 'chicago' && styles.optionDescriptionActive
                ]}>
                  History, publishing, and professional writing
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Generation Mode</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              onPress={() => setMode('grounded')}
              style={[
                styles.optionItem,
                mode === 'grounded' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  mode === 'grounded' && styles.optionTextActive
                ]}>
                  Grounded
                </Text>
                <Text style={[
                  styles.optionDescription,
                  mode === 'grounded' && styles.optionDescriptionActive
                ]}>
                  Use only your uploaded materials as evidence
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setMode('mixed')}
              style={[
                styles.optionItem,
                mode === 'mixed' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  mode === 'mixed' && styles.optionTextActive
                ]}>
                  Mixed
                </Text>
                <Text style={[
                  styles.optionDescription,
                  mode === 'mixed' && styles.optionDescriptionActive
                ]}>
                  Combine your materials with general knowledge
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setMode('teach')}
              style={[
                styles.optionItem,
                mode === 'teach' && styles.optionItemActive
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  mode === 'teach' && styles.optionTextActive
                ]}>
                  Teach
                </Text>
                <Text style={[
                  styles.optionDescription,
                  mode === 'teach' && styles.optionDescriptionActive
                ]}>
                  Educational focus with clear explanations
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <TouchableOpacity
            onPress={() => setIntegrityChecked(!integrityChecked)}
            style={styles.checkboxContainer}
          >
            <View style={[
              styles.checkbox,
              integrityChecked && styles.checkboxActive
            ]}>
              {integrityChecked && (
                <CheckCircle size={16} color={colors.cardBackground} />
              )}
            </View>
            <Text style={styles.checkboxText}>{COPY.integrityText}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          onPress={generateOutline}
          style={[
            styles.generateButton,
            { opacity: prompt.trim() && integrityChecked && !isGenerating ? 1 : 0.5 }
          ]}
          disabled={!prompt.trim() || !integrityChecked || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={colors.cardBackground} />
          ) : (
            <>
              <Text style={styles.generateButtonText}>
                {COPY.generateOutline}
              </Text>
              <ArrowRight size={20} color={colors.cardBackground} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderGenerateStep = () => {
    if (!outline) return null;

    const expandedCount = expandedParagraphs.size;
    const totalParagraphs = outline.paragraphs.length;
    const progressPercentage = (expandedCount / totalParagraphs) * 100;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Your Essay is Ready! 🎉</Text>
          <Text style={styles.stepDescription}>
            Review your essay outline and expand paragraphs to generate the full content. You can edit any paragraph after expansion.
          </Text>
        </View>
        
        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Essay Progress</Text>
            <Text style={styles.progressSubtitle}>
              {expandedCount} of {totalParagraphs} paragraphs expanded
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
        
        <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Thesis Statement */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Thesis Statement</Text>
            </View>
            <View style={styles.thesisCard}>
              <Text style={styles.thesisText}>{outline.thesis}</Text>
            </View>
          </View>
          
          {/* Essay Outline */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle size={20} color={colors.success} />
              </View>
              <Text style={styles.sectionTitle}>Essay Outline</Text>
              <TouchableOpacity
                onPress={expandAllParagraphs}
                style={styles.expandAllButton}
                disabled={expandedCount === totalParagraphs}
              >
                <Text style={[
                  styles.expandAllButtonText,
                  expandedCount === totalParagraphs && styles.expandAllButtonTextDisabled
                ]}>
                  {expandedCount === totalParagraphs ? 'All Expanded' : COPY.expandAll}
                </Text>
                <ArrowRight size={16} color={expandedCount === totalParagraphs ? colors.textSecondary : colors.cardBackground} />
              </TouchableOpacity>
            </View>
            
            {outline.paragraphs.map((paragraph, index) => {
              const isExpanded = expandedParagraphs.has(index);
              const isExpanding = false; // You could add state for this
              
              return (
                <View key={index} style={[
                  styles.paragraphCard,
                  isExpanded && styles.paragraphCardExpanded
                ]}>
                  <View style={styles.paragraphHeader}>
                    <View style={[
                      styles.paragraphNumber,
                      isExpanded && styles.paragraphNumberExpanded
                    ]}>
                      {isExpanded ? (
                        <CheckCircle size={16} color={colors.cardBackground} />
                      ) : (
                        <Text style={styles.paragraphNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.paragraphInfo}>
                      <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
                      <View style={styles.paragraphMeta}>
                        <Text style={styles.paragraphWordCount}>
                          {paragraph.suggestedWordCount} words
                        </Text>
                        {isExpanded && (
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>Generated</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {paragraph.intendedChunks.length > 0 && (
                    <View style={styles.sourcesSection}>
                      <Text style={styles.sourcesLabel}>
                        📚 Sources to use ({paragraph.intendedChunks.length})
                      </Text>
                      <View style={styles.sourcesGrid}>
                        {paragraph.intendedChunks.map((chunk, chunkIndex) => (
                          <View key={chunkIndex} style={styles.sourceChip}>
                            <Text style={styles.sourceLabel}>{chunk.label}</Text>
                            <Text style={styles.sourceExcerpt} numberOfLines={2}>
                              {chunk.excerpt}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={styles.paragraphInputHeader}>
                        <Text style={styles.paragraphInputLabel}>Generated Content</Text>
                        <Text style={styles.paragraphInputHint}>
                          You can edit this content directly
                        </Text>
                      </View>
                      <TextInput
                        value={edits[index] || stripCitationsFromText(paragraph.expandedText || '')}
                        onChangeText={(text) => setEdits(prev => ({ ...prev, [index]: text }))}
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
                              <Text style={styles.warningExplanation}>{COPY.unsupportedFlagExplanation}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {citationStyle !== 'none' && paragraph.citations && paragraph.citations.length > 0 && (
                        <View style={styles.citationsSection}>
                          <Text style={styles.citationsLabel}>
                            📖 Citations Used ({paragraph.citations.length})
                          </Text>
                          <View style={styles.citationsGrid}>
                            {paragraph.citations.map((citation, citationIndex) => (
                              <View key={citationIndex} style={styles.citationChip}>
                                <Text style={styles.citationText}>
                                  "{citation.text}" → {citation.source}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => expandParagraph(index)}
                      style={styles.expandButton}
                      disabled={isExpanding}
                    >
                      {isExpanding ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Text style={styles.expandButtonText}>{COPY.expandParagraph}</Text>
                          <ArrowRight size={16} color={colors.primary} />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Export Options */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.secondaryLight }]}>
                <Download size={20} color={colors.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Export Your Essay</Text>
            </View>
            <Text style={styles.exportDescription}>
              Choose how you'd like to save or share your completed essay
            </Text>
            <View style={styles.exportGrid}>
              <TouchableOpacity
                onPress={copyToClipboard}
                style={[styles.exportButton, styles.exportButtonSecondary]}
              >
                <Copy size={20} color={colors.textPrimary} />
                <Text style={styles.exportButtonText}>{COPY.copyToClipboard}</Text>
                <Text style={styles.exportButtonSubtext}>Quick copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={downloadAsDocx}
                style={[styles.exportButton, styles.exportButtonSuccess]}
              >
                <Download size={20} color={colors.cardBackground} />
                <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>{COPY.downloadDocx}</Text>
                <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>Editable format</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={downloadAsPdf}
                style={[styles.exportButton, styles.exportButtonError]}
              >
                <Download size={20} color={colors.cardBackground} />
                <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>{COPY.downloadPdf}</Text>
                <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>Print ready</Text>
              </TouchableOpacity>
              
              {citationStyle !== 'none' && (
                <TouchableOpacity
                  onPress={copyWithCitations}
                  style={[styles.exportButton, styles.exportButtonPrimary]}
                >
                  <FileText size={20} color={colors.cardBackground} />
                  <Text style={[styles.exportButtonText, styles.exportButtonTextWhite]}>{COPY.copyWithCitations}</Text>
                  <Text style={[styles.exportButtonSubtext, styles.exportButtonSubtextWhite]}>With references</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Usage Summary */}
          <View style={styles.usageSummary}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageTitle}>📊 Usage Summary</Text>
              <Text style={styles.usageSubtitle}>Your essay generation stats</Text>
            </View>
            <View style={styles.usageStats}>
              <View style={styles.usageStat}>
                <Text style={styles.usageStatValue}>{Math.ceil(wordCount * 1.3)}</Text>
                <Text style={styles.usageStatLabel}>Estimated tokens</Text>
              </View>
              <View style={styles.usageStat}>
                <Text style={styles.usageStatValue}>{outline.metadata.retrievedCount}</Text>
                <Text style={styles.usageStatLabel}>Chunks used</Text>
              </View>
              <View style={styles.usageStat}>
                <Text style={styles.usageStatValue}>{files.length + (sampleEssay ? 1 : 0)}</Text>
                <Text style={styles.usageStatLabel}>Sources</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {(['materials', 'configure', 'generate'] as Step[]).map((step, index) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepDot,
            currentStep === step ? styles.stepDotActive : styles.stepDotInactive
          ]}>
            <Text style={[
              styles.stepDotText,
              currentStep === step ? styles.stepDotTextActive : styles.stepDotTextInactive
            ]}>
              {index + 1}
            </Text>
          </View>
          {index < 2 && (
            <View style={[
              styles.stepConnector,
              ['materials', 'configure'].indexOf(currentStep) > index 
                ? styles.stepConnectorActive 
                : styles.stepConnectorInactive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep === 'materials') {
              // Navigate back to previous screen
            } else if (currentStep === 'configure') {
              setCurrentStep('materials');
            } else {
              setCurrentStep('configure');
            }
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{COPY.title}</Text>
        
        <View style={styles.headerActions}>
          {currentStep === 'generate' && outline && (
            <TouchableOpacity
              onPress={saveEssay}
              style={styles.headerActionButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Save size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => setShowSavedDocuments(true)}
            style={styles.headerActionButton}
          >
            <FolderOpen size={20} color={colors.primary} />
          </TouchableOpacity>
          
          {currentStep === 'generate' && outline && (
            <TouchableOpacity
              onPress={() => {
                try {
                  createNewEssay();
                } catch (error) {
                  console.error('Error in createNewEssay button press:', error);
                  Alert.alert('Error', 'Something went wrong. Please try again.');
                }
              }}
              style={styles.headerActionButton}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.subtitle}>{COPY.subtitle}</Text>
      
      {renderStepIndicator()}
      
      {currentStep === 'materials' && renderMaterialsStep()}
      {currentStep === 'configure' && renderConfigureStep()}
      {currentStep === 'generate' && renderGenerateStep()}
      
      {/* Saved Documents Modal */}
      {showSavedDocuments && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSavedDocuments(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Saved Essays</Text>
                <TouchableOpacity
                  onPress={() => setShowSavedDocuments(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            
            <ScrollView style={styles.modalScrollView}>
              {savedEssays.length === 0 ? (
                <View style={styles.emptyState}>
                  <FolderOpen size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateTitle}>No Saved Essays</Text>
                  <Text style={styles.emptyStateText}>
                    Save your essays to access them later
                  </Text>
                </View>
              ) : (
                savedEssays.map((essay) => (
                  <View key={essay.id} style={styles.savedEssayCard}>
                    <View style={styles.savedEssayHeader}>
                      <Text style={styles.savedEssayTitle} numberOfLines={2}>
                        {essay.title}
                      </Text>
                      <Text style={styles.savedEssayDate}>
                        {new Date(essay.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.savedEssayInfo}>
                      <Text style={styles.savedEssayInfoText}>
                        {essay.wordCount} words • {essay.academicLevel} • {essay.citationStyle.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.savedEssayActions}>
                      <TouchableOpacity
                        onPress={() => loadSavedEssay(essay)}
                        style={[styles.savedEssayButton, styles.loadButton]}
                      >
                        <Text style={styles.loadButtonText}>Load</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => deleteSavedEssay(essay.id)}
                        style={[styles.savedEssayButton, styles.deleteButton]}
                      >
                        <Trash2 size={16} color={colors.error} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            </View>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotInactive: {
    backgroundColor: colors.border,
  },
  stepDotText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepDotTextActive: {
    color: colors.cardBackground,
  },
  stepDotTextInactive: {
    color: colors.textSecondary,
  },
  stepConnector: {
    width: 48,
    height: 2,
    marginHorizontal: 8,
  },
  stepConnectorActive: {
    backgroundColor: colors.primary,
  },
  stepConnectorInactive: {
    backgroundColor: colors.border,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  materialsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  materialGroup: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  filePages: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fileExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginBottom: 32,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  scrollView: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  wordCountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  wordCountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  wordCountButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wordCountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  wordCountButtonTextActive: {
    color: colors.cardBackground,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  optionList: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionItemActive: {
    backgroundColor: colors.primaryLight,
  },
  optionItemRecommended: {
    borderWidth: 2,
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '10',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionContent: {
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  optionDescriptionActive: {
    color: colors.primary + 'CC',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginBottom: 32,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  sampleEssayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sampleEssayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sampleEssayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sampleEssayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  sampleEssayExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  removeButton: {
    padding: 4,
  },
  // New styles for improved step 3
  progressOverview: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  paragraphCardExpanded: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
  },
  paragraphNumberExpanded: {
    backgroundColor: colors.primary,
  },
  paragraphMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sourceChip: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: '45%',
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sourceExcerpt: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  paragraphInputHeader: {
    marginBottom: 12,
  },
  paragraphInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  paragraphInputHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paragraphInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '30',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  warningExplanation: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  citationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  citationChip: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    minWidth: '45%',
  },
  citationText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  expandAllButtonTextDisabled: {
    color: colors.textSecondary,
  },
  exportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  exportButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  exportButtonSubtextWhite: {
    color: colors.cardBackground + 'CC',
  },
  usageHeader: {
    marginBottom: 16,
  },
  usageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Additional missing styles
  thesisCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thesisText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  outlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  expandAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  expandAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  paragraphCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  paragraphHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  paragraphNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraphNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  paragraphInfo: {
    flex: 1,
  },
  paragraphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  paragraphWordCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sourcesSection: {
    marginBottom: 12,
  },
  sourcesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  expandedContent: {
    marginTop: 12,
  },
  warningsSection: {
    marginTop: 16,
  },
  citationsSection: {
    marginTop: 16,
  },
  citationsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonSuccess: {
    backgroundColor: colors.success,
  },
  exportButtonError: {
    backgroundColor: colors.error,
  },
  exportButtonPrimary: {
    backgroundColor: colors.primary,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  exportButtonTextWhite: {
    color: colors.cardBackground,
  },
  usageSummary: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  usageStat: {
    alignItems: 'center',
  },
  usageStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  usageStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // AI Reference Analysis Styles
  relevanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  analysisSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  analysisSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginBottom: 8,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  analyzeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  smartSelectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success + '30',
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  smartSelectionHeader: {
    marginBottom: 12,
  },
  smartSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  smartSelectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  smartSelectionReasoning: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Header action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
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
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Saved essay card
  savedEssayCard: {
    backgroundColor: colors.background,
    margin: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  savedEssayHeader: {
    marginBottom: 8,
  },
  savedEssayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  savedEssayDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  savedEssayInfo: {
    marginBottom: 12,
  },
  savedEssayInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  savedEssayActions: {
    flexDirection: 'row',
    gap: 12,
  },
  savedEssayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
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
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
});
