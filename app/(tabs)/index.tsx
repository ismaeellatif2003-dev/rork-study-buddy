import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, Sparkles, Trash2, Zap, Brain, Camera, X, RotateCcw } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useStudy } from '@/hooks/study-store';
import { useUserProfile } from '@/hooks/user-profile-store';
import { AIService } from '@/utils/ai-service';
import colors from '@/constants/colors';
import type { Note } from '@/types/study';
import { router } from 'expo-router';

export default function NotesScreen() {
  const { notes, saveNote, updateNote, deleteNote, addFlashcards } = useStudy();
  const { isOnboardingComplete, getEducationContext, isLoading: profileLoading } = useUserProfile();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      await saveNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
      });
      
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleGenerateSummary = async (note: Note) => {
    if (note.summary) {
      Alert.alert('Summary exists', 'This note already has a summary');
      return;
    }

    setIsGenerating(note.id);
    try {
      const summary = await AIService.summarizeNotes(note.content);
      await updateNote(note.id, { summary });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateFlashcards = async (note: Note, useAIEnhancement: boolean = false) => {
    const generatingKey = useAIEnhancement ? `enhanced_flashcards_${note.id}` : `flashcards_${note.id}`;
    setIsGenerating(generatingKey);
    try {
      const userContext = getEducationContext();
      const flashcardsData = await AIService.generateFlashcards(note.content, useAIEnhancement, userContext);
      const flashcards = flashcardsData.map(card => ({
        noteId: note.id,
        question: card.question,
        answer: card.answer,
      }));
      
      await addFlashcards(note.id, flashcards);
      const enhancementText = useAIEnhancement ? ' AI-enhanced' : '';
      Alert.alert('Success', `Generated ${flashcards.length}${enhancementText} flashcards!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate flashcards');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateFlashcardsFromImage = async (imageBase64: string, useAIEnhancement: boolean = false) => {
    const generatingKey = useAIEnhancement ? 'enhanced_image_flashcards' : 'image_flashcards';
    setIsGenerating(generatingKey);
    try {
      const userContext = getEducationContext();
      const flashcardsData = await AIService.generateFlashcardsFromImage(imageBase64, useAIEnhancement, userContext);
      const extractedText = await AIService.extractTextFromImage(imageBase64);
      
      // Create a new note from the extracted text
      const note = await saveNote({
        title: `Camera Notes - ${new Date().toLocaleDateString()}`,
        content: extractedText,
      });
      
      const flashcards = flashcardsData.map(card => ({
        noteId: note.id,
        question: card.question,
        answer: card.answer,
      }));
      
      await addFlashcards(note.id, flashcards);
      const enhancementText = useAIEnhancement ? ' AI-enhanced' : '';
      Alert.alert('Success', `Created note and generated ${flashcards.length}${enhancementText} flashcards from your photo!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to process image and generate flashcards');
    } finally {
      setIsGenerating(null);
      setShowCamera(false);
    }
  };

  const showCameraFlashcardOptions = (imageBase64: string) => {
    Alert.alert(
      'Generate Flashcards from Photo',
      'Choose the type of flashcards you want to generate:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Basic Cards',
          onPress: () => handleGenerateFlashcardsFromImage(imageBase64, false),
        },
        {
          text: 'AI Enhanced',
          onPress: () => handleGenerateFlashcardsFromImage(imageBase64, true),
        },
      ]
    );
  };

  const showFlashcardOptions = (note: Note) => {
    Alert.alert(
      'Generate Flashcards',
      'Choose the type of flashcards you want to generate:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Basic Cards',
          onPress: () => handleGenerateFlashcards(note, false),
        },
        {
          text: 'AI Enhanced',
          onPress: () => handleGenerateFlashcards(note, true),
        },
      ]
    );
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This will also delete all associated flashcards and chat history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
      ]
    );
  };

  // Camera Screen Component
  const CameraScreen = ({ onClose, onPhotoTaken, isProcessing }: {
    onClose: () => void;
    onPhotoTaken: (imageBase64: string) => void;
    isProcessing: boolean;
  }) => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
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
            <Text style={styles.permissionText}>
              We need camera access to scan your notes and create flashcards
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const takePicture = async () => {
      if (!cameraRef.current) return;

      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });

        if (photo?.base64) {
          onPhotoTaken(photo.base64);
        } else {
          Alert.alert('Error', 'Failed to capture photo');
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    };

    const toggleCameraFacing = () => {
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (Platform.OS === 'web') {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.webCameraContainer}>
            <Camera color={colors.textSecondary} size={64} />
            <Text style={styles.webCameraTitle}>Camera Not Available</Text>
            <Text style={styles.webCameraText}>
              Camera functionality is not available on web. Please use the mobile app to scan your notes.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
              <Text style={styles.permissionButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity style={styles.cameraHeaderButton} onPress={onClose}>
                <X color={colors.cardBackground} size={24} />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scan Your Notes</Text>
              <TouchableOpacity style={styles.cameraHeaderButton} onPress={toggleCameraFacing}>
                <RotateCcw color={colors.cardBackground} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraFooter}>
              <View style={styles.cameraInstructions}>
                <Text style={styles.instructionText}>
                  Position your notes in the frame and tap the capture button
                </Text>
              </View>
              
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
                  onPress={takePicture}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={colors.cardBackground} />
                  ) : (
                    <View style={styles.captureButtonInner} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  };

  // Redirect to onboarding after initial render to avoid state updates during render
  useEffect(() => {
    if (!profileLoading && !isOnboardingComplete) {
      console.log('[NotesScreen] Redirecting to onboarding');
      router.replace('/onboarding');
    }
  }, [profileLoading, isOnboardingComplete]);

  if (!profileLoading && !isOnboardingComplete) {
    return null;
  }

  if (showCamera) {
    return (
      <CameraScreen 
        onClose={() => setShowCamera(false)}
        onPhotoTaken={showCameraFlashcardOptions}
        isProcessing={isGenerating === 'image_flashcards' || isGenerating === 'enhanced_image_flashcards'}
      />
    );
  }

  if (showAddNote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAddNote(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Note</Text>
          <TouchableOpacity onPress={handleSaveNote}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.addNoteContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note title..."
            value={newNoteTitle}
            onChangeText={setNewNoteTitle}
            placeholderTextColor={colors.textSecondary}
          />
          
          <TextInput
            style={styles.contentInput}
            placeholder="Start typing your notes here..."
            value={newNoteContent}
            onChangeText={setNewNoteContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Notes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => setShowCamera(true)}
          >
            <Camera color={colors.cardBackground} size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddNote(true)}
          >
            <Plus color={colors.cardBackground} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color={colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first note to get started with AI-powered studying
            </Text>
          </View>
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <TouchableOpacity onPress={() => handleDeleteNote(note)}>
                  <Trash2 color={colors.error} size={20} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.noteContent} numberOfLines={3}>
                {note.content}
              </Text>
              
              {note.summary && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryLabel}>AI Summary:</Text>
                  <Text style={styles.summaryText}>{note.summary}</Text>
                </View>
              )}
              
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { opacity: note.summary ? 0.5 : 1 }]}
                  onPress={() => handleGenerateSummary(note)}
                  disabled={!!note.summary || isGenerating === note.id}
                >
                  {isGenerating === note.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Sparkles color={colors.primary} size={16} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {note.summary ? 'Summary Ready' : 'Generate Summary'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => showFlashcardOptions(note)}
                  disabled={isGenerating === `flashcards_${note.id}` || isGenerating === `enhanced_flashcards_${note.id}`}
                >
                  {(isGenerating === `flashcards_${note.id}` || isGenerating === `enhanced_flashcards_${note.id}`) ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <Zap color={colors.secondary} size={16} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isGenerating === `enhanced_flashcards_${note.id}` ? 'AI Enhancing...' : 'Generate Cards'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: colors.secondary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  saveButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addNoteContainer: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    paddingVertical: 12,
  },
  contentInput: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    minHeight: 400,
  },
  noteCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Camera styles
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
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  webCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webCameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 16,
  },
  webCameraText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cardBackground,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: 40,
  },
  cameraInstructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  instructionText: {
    color: colors.cardBackground,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
});