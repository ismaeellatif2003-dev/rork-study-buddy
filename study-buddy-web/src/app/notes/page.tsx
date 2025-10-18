'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Sparkles, Trash2, Edit3, Zap, Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { mockNotes } from '@/data/mockData';
import { updateUserStats } from '@/utils/userStats';
import { generateUniqueId } from '@/utils/flashcardSets';
import { canUseFeature, updateUsage, getRemainingUsage, getCurrentSubscription } from '@/utils/subscription';
import { aiService } from '@/services/aiService';
import { notesApi, flashcardsApi } from '@/services/dataService';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import type { Note } from '@/types/study';

export default function NotesPage() {
  const { isAuthenticated } = useAuth();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { addFlashcardSet } = useFlashcardSets();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [subscription, setSubscription] = useState(getCurrentSubscription());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load notes from local storage on mount
  useEffect(() => {
    // Notes are automatically loaded by useNotes hook from localStorage
    setIsLoading(false);
  }, []);

  // Listen for subscription updates
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      setSubscription(getCurrentSubscription());
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    return () => window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
  }, []);

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    // Check if user can create a new note (not editing existing)
    if (!editingNote && !canUseFeature('notes')) {
      alert(`You've reached your note limit (${subscription.plan.limits.notes}). Upgrade to Pro for unlimited notes!`);
      return;
    }

    try {
      if (editingNote) {
        // Update existing note using useNotes hook
        updateNote(editingNote.id, {
          title: newNote.title,
          content: newNote.content,
        });
      } else {
        // Create new note using useNotes hook
        addNote({
          title: newNote.title,
          content: newNote.content,
        });
        
        // Update user stats for new note creation
        updateUserStats('notes', 1);
        updateUsage('notes', 1);
      }

      setNewNote({ title: '', content: '' });
      setEditingNote(null);
      setShowAddNote(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({ title: note.title, content: note.content });
    setShowAddNote(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        // Delete note using useNotes hook
        deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleGenerateSummary = async (note: Note) => {
    setIsGenerating(note.id);
    
    try {
      // Generate summary using AI service
      const aiResponse = await aiService.generateSummary({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator. Create a concise, informative summary of the given note content. Focus on the key points, main concepts, and important information. Make it easy to understand and study-friendly.'
          },
          {
            role: 'user',
            content: `Create a summary of this note:\n\nTitle: ${note.title}\n\nContent: ${note.content}`
          }
        ],
        type: 'summary',
        model: 'openai/gpt-4o'
      });

      if (!aiResponse.success || !aiResponse.summary) {
        throw new Error(aiResponse.error || 'Failed to generate summary');
      }

      // Update the note with the generated summary
      updateNote(note.id, {
        summary: aiResponse.summary
      });
      
      // Update user stats for summary generation
      updateUserStats('summaries', 1);
      updateUsage('summaries', 1);
      
      setIsGenerating(null);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary. Please try again.');
      setIsGenerating(null);
    }
  };

  const handleGenerateFlashcards = async (note: Note) => {
    // Check if user can generate flashcards
    if (!canUseFeature('flashcards')) {
      alert(`You've reached your flashcard limit (${subscription.plan.limits.flashcards}). Upgrade to Pro for unlimited flashcards!`);
      return;
    }
    
    setIsGenerating(note.id);
    
    try {
      // Generate flashcards using AI service
      const aiResponse = await aiService.generateFlashcards({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator. Create educational flashcards from the given note content. Each flashcard should have a clear question on the front and a detailed answer on the back. Focus on key concepts, definitions, and important information.'
          },
          {
            role: 'user',
            content: `Create flashcards from this note:\n\nTitle: ${note.title}\n\nContent: ${note.content}`
          }
        ],
        type: 'flashcards',
        model: 'openai/gpt-4o',
        count: 5
      });

      if (!aiResponse.success || !aiResponse.flashcards) {
        throw new Error(aiResponse.error || 'Failed to generate flashcards');
      }

      // Transform flashcards to match expected format (front/back instead of question/answer)
      const transformedFlashcards = aiResponse.flashcards.map((card: Record<string, unknown>, index: number) => ({
        id: `card-${Date.now()}-${index}`,
        front: (card.question as string) || (card.front as string),
        back: (card.answer as string) || (card.back as string),
        category: 'Generated',
        difficulty: 'Medium',
        createdAt: new Date().toISOString()
      }));

      // Create a new flashcard set with unique ID
      const flashcardSet = {
        id: generateUniqueId('flashcard-set'),
        name: `Flashcards from "${note.title}"`,
        description: `AI-generated flashcards from your note: ${note.title}`,
        cardCount: transformedFlashcards.length,
        createdAt: new Date().toISOString(),
        sourceNoteId: note.id,
        sourceNoteTitle: note.title,
        flashcards: transformedFlashcards,
      };
      
      // Add the flashcard set to local storage
      addFlashcardSet(flashcardSet);
      
      // Also save to backend if authenticated
      if (isAuthenticated) {
        try {
          const flashcardsForBackend = transformedFlashcards.map((card: Record<string, unknown>) => ({
            set_id: flashcardSet.id,
            set_name: flashcardSet.name,
            set_description: flashcardSet.description,
            front: card.front as string,
            back: card.back as string,
            difficulty: 'medium',
          }));
          
          await flashcardsApi.sync('web', flashcardsForBackend);
        } catch (backendError) {
          console.error('Failed to sync flashcards to backend:', backendError);
          // Don't fail the whole operation if backend sync fails
        }
      }
      
      // Update user stats for flashcard generation
      updateUserStats('flashcards', aiResponse.flashcards.length);
      updateUsage('flashcards', aiResponse.flashcards.length);
      
      alert(`Successfully generated ${aiResponse.flashcards.length} flashcards from "${note.title}"! Check the Flashcards tab to study them.`);
    } catch (error) {
      console.error('Flashcard generation error:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateFlashcardsFromNote = (note: Note) => {
    // Simulate AI-generated flashcards based on note content
    const content = note.content.toLowerCase();
    const flashcards = [];
    
    // Generate flashcards based on common patterns in the note
    if (content.includes('definition') || content.includes('define')) {
      flashcards.push({
        id: `card-${Date.now()}-1`,
        question: `What is the main topic of "${note.title}"?`,
        answer: `This note covers ${note.title.toLowerCase()}, providing key information and insights on the subject.`,
        category: note.title,
        difficulty: 'Easy',
        createdAt: new Date().toISOString(),
      });
    }
    
    if (content.includes('example') || content.includes('for instance')) {
      flashcards.push({
        id: `card-${Date.now()}-2`,
        question: `Can you provide an example related to "${note.title}"?`,
        answer: `Based on the note content, examples and applications of ${note.title.toLowerCase()} are discussed.`,
        category: note.title,
        difficulty: 'Medium',
        createdAt: new Date().toISOString(),
      });
    }
    
    if (content.includes('important') || content.includes('key') || content.includes('main')) {
      flashcards.push({
        id: `card-${Date.now()}-3`,
        question: `What are the key points about "${note.title}"?`,
        answer: `The key points include the main concepts, important details, and critical information covered in this note.`,
        category: note.title,
        difficulty: 'Medium',
        createdAt: new Date().toISOString(),
      });
    }
    
    if (content.includes('how') || content.includes('process') || content.includes('step')) {
      flashcards.push({
        id: `card-${Date.now()}-4`,
        question: `How does the process work for "${note.title}"?`,
        answer: `The process involves the steps and procedures outlined in the note content for ${note.title.toLowerCase()}.`,
        category: note.title,
        difficulty: 'Hard',
        createdAt: new Date().toISOString(),
      });
    }
    
    if (content.includes('why') || content.includes('because') || content.includes('reason')) {
      flashcards.push({
        id: `card-${Date.now()}-5`,
        question: `Why is "${note.title}" important?`,
        answer: `This topic is important because of the reasons and significance discussed in the note content.`,
        category: note.title,
        difficulty: 'Medium',
        createdAt: new Date().toISOString(),
      });
    }
    
    // Always add at least one basic flashcard
    if (flashcards.length === 0) {
      flashcards.push({
        id: `card-${Date.now()}-basic`,
        question: `What is "${note.title}" about?`,
        answer: `This note covers ${note.title.toLowerCase()} and provides important information on the topic.`,
        category: note.title,
        difficulty: 'Easy',
        createdAt: new Date().toISOString(),
      });
    }
    
    return flashcards;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOCRProcessing = async () => {
    if (!uploadedImage) return;
    
    // Check if user can use OCR
    if (!canUseFeature('ocrScans')) {
      alert(`You've reached your OCR scan limit (${subscription.plan.limits.ocrScans}). Upgrade to Pro for unlimited scans!`);
      return;
    }
    
    setIsProcessingOCR(true);
    
    try {
      // Convert image to base64 for API
      const base64Image = uploadedImage.split(',')[1]; // Remove data:image/...;base64, prefix
      
      // Call OCR API
      const aiResponse = await aiService.extractTextFromImage({
        imageBase64: base64Image,
        type: 'text',
        model: 'openai/gpt-4o'
      });

      if (!aiResponse.success || !aiResponse.response) {
        throw new Error(aiResponse.error || 'Failed to extract text from image');
      }

      setOcrResult(aiResponse.response);
      
      // Update usage
      updateUsage('ocrScans', 1);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text from image. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleCreateNoteFromOCR = () => {
    if (!ocrResult.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: 'OCR Note - ' + new Date().toLocaleDateString(),
      content: ocrResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setNotes(prev => [note, ...prev]);
    updateUserStats('notes', 1);
    
    // Reset OCR state
    setShowOCRModal(false);
    setUploadedImage(null);
    setOcrResult('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Notes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your study materials</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowOCRModal(true)} 
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
          >
            <Camera size={20} />
            Scan Image
          </Button>
          <Button onClick={() => setShowAddNote(true)} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Plus size={20} />
            Add Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notes yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first note to get started with AI-powered studying
            </p>
            <Button onClick={() => setShowAddNote(true)} className="bg-blue-600 text-white hover:bg-blue-700">
              Create Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{note.title}</h3>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt && (
                        <span> • Updated {formatDate(note.updatedAt)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit3 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-gray-700 mb-4 ${expandedNotes.has(note.id) ? '' : 'line-clamp-3'}`}>
                  {note.content}
                </p>
                
                {note.content.length > 200 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleNoteExpansion(note.id)}
                    className="mb-4"
                  >
                    {expandedNotes.has(note.id) ? 'Show Less' : 'View More'}
                  </Button>
                )}
                
                {note.summary && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Summary</h4>
                    <p className="text-sm text-blue-800">{note.summary}</p>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateSummary(note)}
                    disabled={isGenerating === note.id}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Sparkles size={16} />
                    {isGenerating === note.id 
                      ? 'Generating...' 
                      : note.summary 
                        ? 'Regenerate Summary' 
                        : 'Generate Summary'
                    }
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateFlashcards(note)}
                    disabled={isGenerating === note.id}
                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                  >
                    <Zap size={16} />
                    {isGenerating === note.id ? 'Generating...' : 'Generate Flashcards'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddNote}
        onClose={() => {
          setShowAddNote(false);
          setEditingNote(null);
          setNewNote({ title: '', content: '' });
        }}
        title={editingNote ? 'Edit Note' : 'Create New Note'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter note title..."
            value={newNote.title}
            onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            label="Content"
            placeholder="Enter note content..."
            value={newNote.content}
            onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
            rows={8}
          />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">AI-Powered Features</h4>
                <p className="text-sm text-blue-800 mb-3">
                  After creating your note, you can generate AI summaries and flashcards to enhance your study experience.
                </p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Sparkles size={12} />
                    <span>Smart Summaries</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Zap size={12} />
                    <span>Flashcard Generation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddNote(false);
                setEditingNote(null);
                setNewNote({ title: '', content: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!newNote.title.trim() || !newNote.content.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {editingNote ? 'Update Note' : 'Create Note'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* OCR Modal */}
      <Modal isOpen={showOCRModal} onClose={() => setShowOCRModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Camera className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scan Image for Text</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upload an image to extract text using OCR</p>
            </div>
          </div>

          {!uploadedImage ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">Click to upload an image</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Supports JPG, PNG, GIF formats</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ImageIcon className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">OCR Tips</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Use clear, high-contrast images</li>
                      <li>• Ensure text is readable and not blurry</li>
                      <li>• Avoid shadows and glare on the text</li>
                      <li>• Works best with printed text</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded for OCR" 
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setOcrResult('');
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {!ocrResult ? (
                <div className="text-center">
                  <Button
                    onClick={handleOCRProcessing}
                    disabled={isProcessingOCR}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {isProcessingOCR ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera size={20} className="mr-2" />
                        Extract Text
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Extracted Text
                    </label>
                    <Textarea
                      value={ocrResult}
                      onChange={(e) => setOcrResult(e.target.value)}
                      rows={8}
                      placeholder="Extracted text will appear here..."
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setUploadedImage(null);
                        setOcrResult('');
                      }}
                      className="flex-1 bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Start Over
                    </Button>
                    <Button
                      onClick={handleCreateNoteFromOCR}
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Create Note
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => {
                setShowOCRModal(false);
                setUploadedImage(null);
                setOcrResult('');
              }}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
