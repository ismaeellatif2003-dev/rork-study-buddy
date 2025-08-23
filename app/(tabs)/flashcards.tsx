import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react-native';
import { useStudy } from '@/hooks/study-store';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export default function FlashcardsScreen() {
  const { notes, getFlashcardsForNote } = useStudy();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const selectedNote = notes.find(note => note.id === selectedNoteId);
  const flashcards = selectedNoteId ? getFlashcardsForNote(selectedNoteId) : [];

  const flipCard = () => {
    if (isFlipped) {
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const resetCards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    flipAnimation.setValue(0);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (!selectedNoteId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flashcards</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptyDescription}>
                Create some notes first, then generate flashcards from them
              </Text>
            </View>
          ) : (
            notes.map((note) => {
              const noteFlashcards = getFlashcardsForNote(note.id);
              return (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteCard}
                  onPress={() => {
                    if (noteFlashcards.length === 0) {
                      Alert.alert(
                        'No flashcards',
                        'Generate flashcards for this note first from the Notes tab'
                      );
                      return;
                    }
                    setSelectedNoteId(note.id);
                  }}
                >
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <Text style={styles.flashcardCount}>
                    {noteFlashcards.length} flashcard{noteFlashcards.length !== 1 ? 's' : ''}
                  </Text>
                  {noteFlashcards.length === 0 && (
                    <Text style={styles.noCardsText}>
                      Generate flashcards from the Notes tab
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (flashcards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedNoteId(null)}>
            <ChevronLeft color={colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Flashcards</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyDescription}>
            Generate flashcards for this note from the Notes tab
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedNoteId(null)}>
          <ChevronLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedNote?.title}</Text>
        <TouchableOpacity onPress={resetCards}>
          <RotateCcw color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardCounter}>
          {currentCardIndex + 1} of {flashcards.length}
        </Text>

        <TouchableOpacity style={styles.cardWrapper} onPress={flipCard} activeOpacity={0.9}>
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] },
              isFlipped && styles.cardHidden,
            ]}
          >
            <Text style={styles.cardLabel}>Question</Text>
            <Text style={styles.cardText}>{currentCard.question}</Text>
            <Text style={styles.tapHint}>Tap to reveal answer</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
              !isFlipped && styles.cardHidden,
            ]}
          >
            <Text style={styles.cardLabel}>Answer</Text>
            <Text style={styles.cardText}>{currentCard.answer}</Text>
            <Text style={styles.tapHint}>Tap to see question</Text>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]}
            onPress={prevCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft color={currentCardIndex === 0 ? colors.textSecondary : colors.primary} size={24} />
            <Text style={[styles.navButtonText, currentCardIndex === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentCardIndex === flashcards.length - 1 && styles.navButtonDisabled]}
            onPress={nextCard}
            disabled={currentCardIndex === flashcards.length - 1}
          >
            <Text style={[styles.navButtonText, currentCardIndex === flashcards.length - 1 && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <ChevronRight color={currentCardIndex === flashcards.length - 1 ? colors.textSecondary : colors.primary} size={24} />
          </TouchableOpacity>
        </View>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  flashcardCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  noCardsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardCounter: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  card: {
    width: CARD_WIDTH,
    height: 300,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    position: 'absolute',
  },
  cardBack: {
    position: 'absolute',
    backgroundColor: colors.primary,
  },
  cardHidden: {
    opacity: 0,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    flex: 1,
  },
  tapHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
});