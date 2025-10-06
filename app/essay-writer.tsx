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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { mockApi } from '../services/mockApi';
import { promptTemplates } from '../utils/promptTemplates';

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
  downloadDocx: 'Download as DOCX',
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
type CitationStyle = 'apa' | 'mla' | 'harvard' | 'chicago';
type Mode = 'grounded' | 'mixed' | 'teach';

export default function GroundedEssayWriter() {
  // State management
  const [currentStep, setCurrentStep] = useState<Step>('materials');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [wordCount, setWordCount] = useState(800);
  const [customWordCount, setCustomWordCount] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('undergraduate');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('apa');
  const [includeReferences, setIncludeReferences] = useState(true);
  const [mode, setMode] = useState<Mode>('grounded');
  const [integrityChecked, setIntegrityChecked] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<number>>(new Set());
  const [edits, setEdits] = useState<Record<number, string>>({});

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper functions
  const getNextOrder = (group: 'notes' | 'references') => {
    const groupFiles = files.filter(f => f.group === group);
    return groupFiles.length > 0 ? Math.max(...groupFiles.map(f => f.order)) + 1 : 0;
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

  // Generation functions
  const generateOutline = async () => {
    if (!prompt.trim() || !integrityChecked) return;

    setIsGenerating(true);
    try {
      const fileIds = files.map(f => f.id);
      
      // TODO: Replace with real API call
      const response = await mockApi.generateOutline({
        prompt,
        wordCount,
        level: academicLevel,
        citationStyle,
        mode,
        fileIds,
        rubric: assignmentTitle,
      });

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

    const essayText = outline.paragraphs
      .map((p, i) => {
        const text = edits[i] || p.expandedText || '';
        return `**${p.title}**\n\n${text}`;
      })
      .join('\n\n');

    await Share.share({
      message: essayText,
      title: 'Essay',
    });
  };

  const downloadAsDocx = async () => {
    // TODO: Implement client-side DOCX generation
    Alert.alert('Info', 'DOCX download would be implemented here');
  };

  const downloadAsPdf = async () => {
    // TODO: Implement client-side PDF generation
    Alert.alert('Info', 'PDF download would be implemented here');
  };

  const copyWithCitations = async () => {
    if (!outline) return;

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

        return `**${p.title}**\n\n${text}`;
      })
      .join('\n\n');

    await Share.share({
      message: essayWithCitations,
      title: 'Essay with Citations',
    });
  };

  // Render functions
  const renderFileCard = (file: FileItem, index: number) => (
    <View key={file.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
              {file.name}
            </Text>
            {file.priority && (
              <View className="bg-yellow-100 px-2 py-1 rounded-full ml-2">
                <Text className="text-yellow-800 text-xs font-medium">Priority</Text>
              </View>
            )}
          </View>
          
          {file.pages && (
            <Text className="text-gray-500 text-sm mb-2">{file.pages} pages</Text>
          )}
          
          <Text className="text-gray-700 text-sm" numberOfLines={3}>
            {file.excerpt}
          </Text>
        </View>
        
        <View className="flex-row items-center ml-3">
          <TouchableOpacity
            onPress={() => togglePriority(file.id)}
            className="p-2"
          >
            <Ionicons
              name={file.priority ? 'star' : 'star-outline'}
              size={20}
              color={file.priority ? '#f59e0b' : '#6b7280'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => deleteFile(file.id)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMaterialsStep = () => (
    <View className="flex-1">
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        {COPY.materialsHeader}
      </Text>
      
      <View className="flex-row mb-6">
        <View className="flex-1 mr-2">
          <Text className="font-medium text-blue-600 mb-3">Relevant Notes</Text>
          <TouchableOpacity
            onPress={() => handleFileUpload('notes')}
            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 items-center mb-3"
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
            <Text className="text-blue-600 font-medium mt-2">Upload File</Text>
          </TouchableOpacity>
          
          {files.filter(f => f.group === 'notes').map((file, index) => renderFileCard(file, index))}
        </View>
        
        <View className="flex-1 ml-2">
          <Text className="font-medium text-green-600 mb-3">References</Text>
          <TouchableOpacity
            onPress={() => handleFileUpload('references')}
            className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 items-center mb-3"
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#059669" />
            <Text className="text-green-600 font-medium mt-2">Upload File</Text>
          </TouchableOpacity>
          
          {files.filter(f => f.group === 'references').map((file, index) => renderFileCard(file, index))}
        </View>
      </View>
      
      <TouchableOpacity
        onPress={() => setCurrentStep('configure')}
        className="bg-blue-600 rounded-lg p-4 items-center"
        disabled={files.length === 0}
      >
        <Text className="text-white font-semibold text-lg">
          Continue to Configuration
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfigureStep = () => (
    <View className="flex-1">
      <Text className="text-lg font-semibold text-gray-900 mb-6">
        {COPY.configureHeader}
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-2">Assignment Title (Optional)</Text>
          <TextInput
            value={assignmentTitle}
            onChangeText={setAssignmentTitle}
            placeholder="Enter assignment title..."
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
        
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-2">Required Question / Prompt *</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Enter your essay prompt or question..."
            multiline
            numberOfLines={4}
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
        
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-3">Word Count</Text>
          <View className="flex-row flex-wrap mb-3">
            {[250, 500, 800, 1200].map(count => (
              <TouchableOpacity
                key={count}
                onPress={() => setWordCount(count)}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  wordCount === count
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`font-medium ${
                  wordCount === count ? 'text-white' : 'text-gray-700'
                }`}>
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
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
          
          <Text className="text-gray-500 text-sm mt-2">
            {wordCount} words ≈ {Math.ceil(wordCount / 200)}–{Math.ceil(wordCount / 150)} paragraphs
          </Text>
        </View>
        
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-2">Academic Level</Text>
          <View className="border border-gray-300 rounded-lg">
            {(['high-school', 'undergraduate', 'graduate', 'professional'] as AcademicLevel[]).map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setAcademicLevel(level)}
                className={`p-3 border-b border-gray-200 last:border-b-0 ${
                  academicLevel === level ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <Text className={`font-medium ${
                  academicLevel === level ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-2">Citation Style</Text>
          <View className="border border-gray-300 rounded-lg">
            {(['apa', 'mla', 'harvard', 'chicago'] as CitationStyle[]).map(style => (
              <TouchableOpacity
                key={style}
                onPress={() => setCitationStyle(style)}
                className={`p-3 border-b border-gray-200 last:border-b-0 ${
                  citationStyle === style ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <Text className={`font-medium ${
                  citationStyle === style ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {style.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View className="mb-6">
          <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Include References</Text>
              <Text className="text-gray-500 text-sm">{COPY.citationToggleHelper}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIncludeReferences(!includeReferences)}
              className={`w-12 h-6 rounded-full ${
                includeReferences ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <View className={`w-5 h-5 bg-white rounded-full mt-0.5 ${
                includeReferences ? 'ml-6' : 'ml-0.5'
              }`} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View className="mb-6">
          <Text className="font-medium text-gray-900 mb-2">Generation Mode</Text>
          <View className="border border-gray-300 rounded-lg">
            {(['grounded', 'mixed', 'teach'] as Mode[]).map(modeOption => (
              <TouchableOpacity
                key={modeOption}
                onPress={() => setMode(modeOption)}
                className={`p-3 border-b border-gray-200 last:border-b-0 ${
                  mode === modeOption ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <Text className={`font-medium ${
                  mode === modeOption ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setIntegrityChecked(!integrityChecked)}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 ${
              integrityChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            }`}>
              {integrityChecked && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text className="text-gray-900 flex-1">{COPY.integrityText}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          onPress={generateOutline}
          className={`rounded-lg p-4 items-center mb-6 ${
            prompt.trim() && integrityChecked && !isGenerating
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }`}
          disabled={!prompt.trim() || !integrityChecked || isGenerating}
        >
          <Text className={`font-semibold text-lg ${
            prompt.trim() && integrityChecked && !isGenerating
              ? 'text-white'
              : 'text-gray-500'
          }`}>
            {isGenerating ? 'Generating...' : COPY.generateOutline}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderGenerateStep = () => {
    if (!outline) return null;

    return (
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 mb-6">
          {COPY.generateHeader}
        </Text>
        
        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Thesis Statement</Text>
            <Text className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {outline.thesis}
            </Text>
          </View>
          
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-semibold text-gray-900">Essay Outline</Text>
              <TouchableOpacity
                onPress={expandAllParagraphs}
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">{COPY.expandAll}</Text>
              </TouchableOpacity>
            </View>
            
            {outline.paragraphs.map((paragraph, index) => (
              <View key={index} className="mb-4 bg-white rounded-lg p-4 border border-gray-200">
                <Text className="font-semibold text-gray-900 mb-2">
                  {index + 1}. {paragraph.title}
                </Text>
                
                <Text className="text-gray-500 text-sm mb-3">
                  Suggested: {paragraph.suggestedWordCount} words
                </Text>
                
                {paragraph.intendedChunks.length > 0 && (
                  <View className="mb-3">
                    <Text className="font-medium text-gray-700 mb-2">Sources to use:</Text>
                    {paragraph.intendedChunks.map((chunk, chunkIndex) => (
                      <View key={chunkIndex} className="bg-blue-50 p-2 rounded mb-1">
                        <Text className="text-blue-800 font-medium text-sm">{chunk.label}</Text>
                        <Text className="text-blue-700 text-xs">{chunk.excerpt}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {expandedParagraphs.has(index) ? (
                  <View>
                    <TextInput
                      value={edits[index] || paragraph.expandedText || ''}
                      onChangeText={(text) => setEdits(prev => ({ ...prev, [index]: text }))}
                      multiline
                      numberOfLines={6}
                      className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-3"
                      placeholder="Paragraph content will appear here..."
                    />
                    
                    {paragraph.unsupportedFlags && paragraph.unsupportedFlags.length > 0 && (
                      <View className="mb-3">
                        {paragraph.unsupportedFlags.map((flag, flagIndex) => (
                          <View key={flagIndex} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="warning" size={16} color="#f59e0b" />
                              <Text className="text-yellow-800 font-medium ml-2">Unsupported Content</Text>
                            </View>
                            <Text className="text-yellow-700 text-sm">{flag.sentence}</Text>
                            <Text className="text-yellow-600 text-xs mt-1">{COPY.unsupportedFlagExplanation}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {paragraph.citations && paragraph.citations.length > 0 && (
                      <View className="mb-3">
                        <Text className="font-medium text-gray-700 mb-2">Citations used:</Text>
                        {paragraph.citations.map((citation, citationIndex) => (
                          <View key={citationIndex} className="bg-gray-50 p-2 rounded mb-1">
                            <Text className="text-gray-800 text-sm">
                              {citation.text} → {citation.source}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => expandParagraph(index)}
                    className="bg-blue-600 px-4 py-2 rounded-lg self-start"
                  >
                    <Text className="text-white font-medium">{COPY.expandParagraph}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-4">Export Options</Text>
            <View className="flex-row flex-wrap">
              <TouchableOpacity
                onPress={copyToClipboard}
                className="bg-gray-600 px-4 py-2 rounded-lg mr-2 mb-2"
              >
                <Text className="text-white font-medium">{COPY.copyToClipboard}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={downloadAsDocx}
                className="bg-green-600 px-4 py-2 rounded-lg mr-2 mb-2"
              >
                <Text className="text-white font-medium">{COPY.downloadDocx}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={downloadAsPdf}
                className="bg-red-600 px-4 py-2 rounded-lg mr-2 mb-2"
              >
                <Text className="text-white font-medium">{COPY.downloadPdf}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={copyWithCitations}
                className="bg-purple-600 px-4 py-2 rounded-lg mr-2 mb-2"
              >
                <Text className="text-white font-medium">{COPY.copyWithCitations}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Usage Summary</Text>
            <Text className="text-gray-700 text-sm mb-1">
              Estimated tokens: {Math.ceil(wordCount * 1.3)}
            </Text>
            <Text className="text-gray-700 text-sm mb-1">
              Chunks used: {outline.metadata.retrievedCount}
            </Text>
            <Text className="text-gray-700 text-sm">
              Sources: {files.length} files
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center mb-6">
      {(['materials', 'configure', 'generate'] as Step[]).map((step, index) => (
        <React.Fragment key={step}>
          <View className={`w-8 h-8 rounded-full items-center justify-center ${
            currentStep === step ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <Text className={`font-semibold ${
              currentStep === step ? 'text-white' : 'text-gray-600'
            }`}>
              {index + 1}
            </Text>
          </View>
          {index < 2 && (
            <View className={`w-12 h-1 mx-2 ${
              ['materials', 'configure'].indexOf(currentStep) > index ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
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
            className="p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-gray-900">{COPY.title}</Text>
          
          <View className="w-8" />
        </View>
        
        <Text className="text-gray-600 text-center mb-6">{COPY.subtitle}</Text>
        
        {renderStepIndicator()}
        
        {currentStep === 'materials' && renderMaterialsStep()}
        {currentStep === 'configure' && renderConfigureStep()}
        {currentStep === 'generate' && renderGenerateStep()}
      </View>
    </SafeAreaView>
  );
}
