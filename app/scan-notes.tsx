import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Camera, Sparkles, FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import { useStudy } from '@/hooks/study-store';
import { useUserProfile } from '@/hooks/user-profile-store';
import { useSubscription } from '@/hooks/subscription-store';
import { AIService } from '@/utils/ai-service';
import colors from '@/constants/colors';

type ScanStep = 'camera' | 'processing' | 'review' | 'enhance';

export default function ScanNotesScreen() {
  const { saveNote, addFlashcards } = useStudy();
  const { getEducationContext } = useUserProfile();
  const { canCreateNote, trackNoteCreation, canGenerateFlashcards, trackFlashcardGeneration } = useSubscription();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState<ScanStep>('camera');
  const [facing, setFacing] = useState<CameraType>('back');
  const [extractedText, setExtractedText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera color={colors.textSecondary} size={64} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDescription}>
            We need camera access to scan your notes and convert them to text
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            router.replace('/(tabs)');
          }}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture image');
      }

      const text = await AIService.extractTextFromImage(photo.base64);
      
      if (!text || text.trim().length === 0) {
        Alert.alert('No Text Found', 'Could not extract any text from the image. Please try again with better lighting or a clearer image.');
        return;
      }

      // Check if the response is a mock response
      if (text.includes('mock OCR response') || text.includes('Mock OCR')) {
        Alert.alert(
          'OCR Service Unavailable', 
          'The OCR service is not currently configured. Please check your backend configuration or try again later.',
          [
            { text: 'OK', onPress: () => setCurrentStep('camera') }
          ]
        );
        return;
      }

      setExtractedText(text);
      setNoteTitle(`Scanned Notes - ${new Date().toLocaleDateString()}`);
      setCurrentStep('review');
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const enhanceWithAI = async () => {
    if (!extractedText.trim()) return;

    setIsEnhancing(true);
    try {
      const userContext = getEducationContext();
      const enhancementPrompt = `Please enhance and improve these scanned notes. Fix any OCR errors, improve formatting, add structure with headers and bullet points, and make the content clearer and more organized. Keep all the original information but present it in a better format.${userContext ? ` Context: ${userContext}` : ''}`;
      
      const enhanced = await AIService.generateText([
        {
          role: 'system',
          content: 'You are a study assistant that helps improve and organize scanned notes. Fix OCR errors, improve formatting, and make content clearer while preserving all original information.',
        },
        {
          role: 'user',
          content: `${enhancementPrompt}\n\nOriginal scanned text:\n${extractedText}`,
        },
      ]);

      setEnhancedText(enhanced);
      setCurrentStep('enhance');
    } catch (error) {
      console.error('Error enhancing text:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to enhance text');
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveScannedNote = async (useEnhanced: boolean = false) => {
    const contentToSave = useEnhanced ? enhancedText : extractedText;
    
    if (!noteTitle.trim() || !contentToSave.trim()) {
      Alert.alert('Error', 'Please provide a title and ensure the content is not empty');
      return;
    }

    if (!canCreateNote()) {
      Alert.alert('Note limit reached', 'Upgrade to Pro for unlimited notes.');
      return;
    }

    try {
      const savedNote = await saveNote({
        title: noteTitle.trim(),
        content: contentToSave.trim(),
      });
      
      await trackNoteCreation();
      
      Alert.alert(
        'Note Saved!',
        'Would you like to generate flashcards from this note?',
        [
          { text: 'Not Now', onPress: () => {
            router.replace('/(tabs)');
          }},
          { 
            text: 'Generate Cards', 
            onPress: () => generateFlashcardsFromNote(savedNote.id, contentToSave)
          },
        ]
      );
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save note');
    }
  };

  const generateFlashcardsFromNote = async (noteId: string, content: string) => {
    try {
      const userContext = getEducationContext();
      const flashcardsData = await AIService.generateFlashcards(content, true, userContext);
      const flashcards = flashcardsData.map(card => ({
        noteId,
        question: card.question,
        answer: card.answer,
      }));
      
      if (!canGenerateFlashcards(flashcards.length)) {
        Alert.alert('Flashcard limit reached', `You can generate ${flashcards.length} more flashcards. Upgrade to Pro for unlimited flashcards.`);
        router.replace('/(tabs)');
        return;
      }
      
      await addFlashcards(noteId, flashcards);
      await trackFlashcardGeneration(flashcards.length);
      
      Alert.alert('Success', `Generated ${flashcards.length} AI-enhanced flashcards!`, [
        { text: 'OK', onPress: () => {
          router.replace('/(tabs)');
        }}
      ]);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate flashcards');
      router.replace('/(tabs)');
    }
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={() => {
          router.replace('/(tabs)');
        }} style={styles.headerButton}>
          <X color={colors.cardBackground} size={24} />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Scan Notes</Text>
        <TouchableOpacity 
          onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          style={styles.headerButton}
        >
          <Camera color={colors.cardBackground} size={24} />
        </TouchableOpacity>
      </View>

      {Platform.OS !== 'web' ? (
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstructions}>
              Position your notes within the frame and tap the capture button
            </Text>
            <Text style={styles.scanTip}>
              💡 Tip: Ensure good lighting and clear handwriting for better text extraction
            </Text>
          </View>
        </CameraView>
      ) : (
        <View style={styles.webCameraPlaceholder}>
          <Camera color={colors.textSecondary} size={64} />
          <Text style={styles.webCameraText}>Camera not available on web</Text>
          <Text style={styles.webCameraSubtext}>Please use the mobile app to scan notes</Text>
        </View>
      )}

      <View style={styles.cameraControls}>
        <TouchableOpacity 
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={takePicture}
          disabled={isProcessing || Platform.OS === 'web'}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.cardBackground} />
          ) : (
            <Camera color={colors.cardBackground} size={32} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('camera')}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Scanned Text</Text>
        <TouchableOpacity onPress={() => saveScannedNote(false)}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.reviewContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholderTextColor={colors.textSecondary}
        />
        
        <View style={styles.textPreview}>
          <Text style={styles.previewLabel}>Extracted Text:</Text>
          <TextInput
            style={styles.extractedTextInput}
            value={extractedText}
            onChangeText={setExtractedText}
            multiline
            textAlignVertical="top"
            placeholder="Extracted text will appear here..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.enhanceSection}>
          <TouchableOpacity 
            style={[styles.enhanceButton, isEnhancing && styles.enhanceButtonDisabled]}
            onPress={enhanceWithAI}
            disabled={isEnhancing}
          >
            {isEnhancing ? (
              <ActivityIndicator size="small" color={colors.cardBackground} />
            ) : (
              <Sparkles color={colors.cardBackground} size={20} />
            )}
            <Text style={styles.enhanceButtonText}>
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.enhanceDescription}>
            AI will fix OCR errors, improve formatting, and organize the content
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderEnhanceView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('review')}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Enhanced</Text>
        <TouchableOpacity onPress={() => saveScannedNote(true)}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.reviewContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholderTextColor={colors.textSecondary}
        />
        
        <View style={styles.textPreview}>
          <Text style={styles.previewLabel}>Enhanced Text:</Text>
          <TextInput
            style={styles.extractedTextInput}
            value={enhancedText}
            onChangeText={setEnhancedText}
            multiline
            textAlignVertical="top"
            placeholder="Enhanced text will appear here..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.comparisonSection}>
          <TouchableOpacity 
            style={styles.useOriginalButton}
            onPress={() => saveScannedNote(false)}
          >
            <FileText color={colors.textPrimary} size={16} />
            <Text style={styles.useOriginalButtonText}>Use Original Text</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (currentStep === 'camera') {
    return renderCameraView();
  } else if (currentStep === 'review') {
    return renderReviewView();
  } else if (currentStep === 'enhance') {
    return renderEnhanceView();
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 24,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
  },
  permissionButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  camera: {
    flex: 1,
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
  },
  webCameraText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  webCameraSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 300,
    height: 400,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: colors.cardBackground,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 40,
    fontWeight: '500',
  },
  scanTip: {
    color: colors.cardBackground,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontWeight: '400',
    opacity: 0.9,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  backButton: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  saveButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  textPreview: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  extractedTextInput: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    minHeight: 300,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  enhanceSection: {
    alignItems: 'center',
  },
  enhanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  enhanceButtonDisabled: {
    opacity: 0.6,
  },
  enhanceButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  enhanceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  comparisonSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  useOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  useOriginalButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});