import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, Sparkles, Trash2, Zap, Camera } from 'lucide-react-native';
import { useStudy } from '@/hooks/study-store';
import { useUserProfile } from '@/hooks/user-profile-store';
import { useSubscription } from '@/hooks/subscription-store';
import { AIService } from '@/utils/ai-service';
import colors from '@/constants/colors';
import type { Note } from '@/types/study';
import { router } from 'expo-router';

export default function NotesScreen() {
  const { notes, saveNote, updateNote, deleteNote, addFlashcards, isLoading: studyLoading } = useStudy();
  const { isOnboardingComplete, getEducationContext, isLoading: profileLoading } = useUserProfile();
  const { canCreateNote, trackNoteCreation, canGenerateFlashcards, trackFlashcardGeneration } = useSubscription();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  console.log('NotesScreen render - profileLoading:', profileLoading, 'studyLoading:', studyLoading, 'isOnboardingComplete:', isOnboardingComplete);

  useEffect(() => {
    console.log('NotesScreen mounted');
    
    // Navigate to onboarding if profile is not complete
    if (!profileLoading && !isOnboardingComplete) {
      console.log('Navigating to onboarding - profile not complete');
      router.push('/onboarding');
    }
  }, [profileLoading, isOnboardingComplete]);

  // Show loading screen while data is loading
  if (profileLoading || studyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your study notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    if (!canCreateNote()) {
      Alert.alert('Note limit reached', 'Upgrade to Pro for unlimited notes.');
      return;
    }

    try {
      await saveNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
      });
      
      await trackNoteCreation();
      
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save note');
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
      console.error('Error generating summary:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate summary');
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
      
      if (!canGenerateFlashcards(flashcards.length)) {
        Alert.alert('Flashcard limit reached', `You can generate ${flashcards.length} more flashcards. Upgrade to Pro for unlimited flashcards.`);
        return;
      }
      
      await addFlashcards(note.id, flashcards);
      await trackFlashcardGeneration(flashcards.length);
      
      const enhancementText = useAIEnhancement ? ' AI-enhanced' : '';
      Alert.alert('Success', `Generated ${flashcards.length}${enhancementText} flashcards!`);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate flashcards');
    } finally {
      setIsGenerating(null);
    }
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
            style={styles.scanButton}
            onPress={() => router.push('/scan-notes')}
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
              Create your first note or scan handwritten notes to get started with AI-powered studying
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                style={styles.emptyScanButton}
                onPress={() => router.push('/scan-notes')}
              >
                <Camera color={colors.cardBackground} size={20} />
                <Text style={styles.emptyScanButtonText}>Scan Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={() => setShowAddNote(true)}
              >
                <Plus color={colors.cardBackground} size={20} />
                <Text style={styles.emptyAddButtonText}>Type Notes</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    backgroundColor: colors.secondary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
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
    borderRadius: 20,
    padding: 24,
    marginVertical: 10,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 26,
    marginRight: 12,
  },
  noteContent: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.background,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
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
  emptyActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  emptyScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  emptyScanButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  emptyAddButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
});