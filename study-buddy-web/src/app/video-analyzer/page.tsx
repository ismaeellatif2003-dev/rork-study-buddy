'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Video, 
  Upload, 
  Youtube, 
  Loader2, 
  BookOpen, 
  Zap, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ClipboardCopy,
  RefreshCw,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { useNotes } from '@/hooks/useNotes';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { toast } from 'sonner';
import VideoAnalysisService, { VideoAnalysisResult, VideoTopic } from '@/services/videoAnalysisService';

export default function VideoAnalyzerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addNote } = useNotes();
  const { addFlashcardSet } = useFlashcardSets();

  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'summary' | 'flashcards'>('topics');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/api/auth/signin');
    }
  }, [session, router]);

  const handleAnalyzeUrl = async () => {
    if (!videoUrl) {
      setError('Please enter a YouTube URL.');
      return;
    }
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(videoUrl)) {
      setError('Invalid YouTube URL.');
      return;
    }
    
    // Test backend connectivity first
    console.log('🧪 Testing backend connectivity...');
    try {
      const response = await fetch('https://rork-study-buddy-production-eeeb.up.railway.app');
      const data = await response.text();
      console.log('🧪 Backend connectivity test:', { status: response.status, data: data.substring(0, 100) });
    } catch (error) {
      console.error('🧪 Backend connectivity test failed:', error);
    }
    
    // Test authentication
    console.log('🧪 Testing authentication...');
    try {
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      console.log('🧪 Session data:', sessionData);
    } catch (error) {
      console.error('🧪 Session test failed:', error);
    }
    
    await analyzeVideo('url', videoUrl);
  };

  const handleAnalyzeFile = async () => {
    if (!videoFile) {
      setError('Please select a video file.');
      return;
    }
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(videoFile.type)) {
      setError('Unsupported file type. Please upload MP4, AVI, MOV, WMV, or WebM.');
      return;
    }
    const maxSize = 250 * 1024 * 1024; // 250MB
    if (videoFile.size > maxSize) {
      setError('File too large. Maximum size is 250MB.');
      return;
    }
    await analyzeVideo('file', videoFile);
  };

  const analyzeVideo = async (type: 'url' | 'file', input: string | File) => {
    console.log('🔐 Authentication check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email,
      hasBackendToken: !!session?.backendToken,
      sessionKeys: session ? Object.keys(session) : []
    });

    // Use session email if available, otherwise use a default for testing
    const userEmail = session?.user?.email || 'test@example.com';

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setActiveTab('topics');

    try {
      let result: VideoAnalysisResult;
      
        console.log('🎥 Starting video analysis with:', { type, input: type === 'url' ? input : (input as File).name, email: userEmail });
        
        if (type === 'url') {
          result = await VideoAnalysisService.analyzeYouTubeUrl(input as string, userEmail);
        } else {
          result = await VideoAnalysisService.analyzeVideoFile(input as File, userEmail);
        }

      setAnalysisResult(result);

      // Poll for completion
      const finalResult = await VideoAnalysisService.pollAnalysisStatus(
        result.id,
        (progressResult) => {
          setAnalysisResult(progressResult);
        }
      );

      setAnalysisResult(finalResult);
      setIsAnalyzing(false);
      
      if (finalResult.status === 'completed') {
        toast.success('Video analysis completed successfully!');
      } else if (finalResult.status === 'failed') {
        setError(finalResult.error || 'Video analysis failed. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoUrl(''); // Clear URL when file is selected
      setError(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Remove file button clicked');
    setVideoFile(null);
    setError(null);
    // Reset the file input
    const fileInput = document.getElementById('video-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const testBackendConnection = async () => {
    setIsTestingConnection(true);
    setError(null);
    
    try {
      console.log('🧪 Testing backend connection...');
      const response = await fetch('https://rork-study-buddy-production-eeeb.up.railway.app');
      const data = await response.text();
      console.log('✅ Backend connection successful:', { status: response.status, data: data.substring(0, 100) });
      toast.success('Backend connection successful!');
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setError(`Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Backend connection failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile(e.dataTransfer.files[0]);
      setVideoUrl(''); // Clear URL when file is dropped
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleGenerateTopicSummary = async (topic: VideoTopic) => {
    if (!analysisResult) return;
    
    toast.info(`Generating summary for topic: "${topic.title}"...`);
    try {
      const response = await VideoAnalysisService.generateSummary(analysisResult.id, 'topic', topic.id);
      
      if (analysisResult && analysisResult.topics) {
        const updatedTopics = analysisResult.topics.map(t => 
          t.id === topic.id ? { ...t, summary: response.summary } : t
        );
        setAnalysisResult(prev => prev ? { ...prev, topics: updatedTopics } : null);
      }
      toast.success(`Summary generated for "${topic.title}"!`);
    } catch (_error) {
      toast.error('Failed to generate summary. Please try again.');
    }
  };

  const handleGenerateOverallSummary = async () => {
    if (!analysisResult?.transcript) {
      toast.error('No transcript available to generate overall summary.');
      return;
    }
    
    toast.info('Generating overall summary...');
    try {
      const response = await VideoAnalysisService.generateSummary(analysisResult.id, 'overall');
      setAnalysisResult(prev => prev ? { ...prev, overallSummary: response.summary } : null);
      toast.success('Overall summary generated!');
    } catch (_error) {
      toast.error('Failed to generate overall summary. Please try again.');
    }
  };

  const handleGenerateTopicFlashcards = async (topic: VideoTopic) => {
    if (!analysisResult) return;
    
    toast.info(`Generating flashcards for topic: "${topic.title}"...`);
    try {
      const response = await VideoAnalysisService.generateFlashcards(analysisResult.id, topic.id);
      if (analysisResult) {
        setAnalysisResult(prev => prev ? { 
          ...prev, 
          flashcards: [...(prev.flashcards || []), ...response.flashcards] 
        } : null);
      }
      toast.success(`Flashcards generated for "${topic.title}"!`);
    } catch (_error) {
      toast.error('Failed to generate flashcards. Please try again.');
    }
  };

  const handleSaveNotes = async () => {
    if (!analysisResult?.topics || analysisResult.topics.length === 0) {
      toast.error('No topics to save as notes.');
      return;
    }
    
    try {
      const response = await VideoAnalysisService.saveNotes(analysisResult.id);
      if (response.success) {
        // Also add to local notes for immediate display
        analysisResult.topics.forEach(topic => {
          addNote({
            title: `${analysisResult.title} - ${topic.title}`,
            content: topic.content,
          });
        });
        toast.success(`${response.notesCreated} notes saved successfully!`);
      }
    } catch (_error) {
      toast.error('Failed to save notes. Please try again.');
    }
  };

  const handleSaveFlashcards = async () => {
    if (!analysisResult?.flashcards || analysisResult.flashcards.length === 0) {
      toast.error('No flashcards to save.');
      return;
    }
    
    try {
      const response = await VideoAnalysisService.saveFlashcards(analysisResult.id);
      if (response.success) {
        // Also add to local flashcard sets for immediate display
        addFlashcardSet({
          name: `Video: ${analysisResult.title}`,
          description: `Flashcards generated from video analysis of "${analysisResult.title}"`,
          cardCount: analysisResult.flashcards.length,
          flashcards: analysisResult.flashcards.map(card => ({
            id: card.id,
            front: card.front,
            back: card.back,
            category: 'Video Analysis',
            difficulty: 'Medium',
            createdAt: new Date().toISOString(),
          })),
        });
        toast.success(`${response.flashcardsCreated} flashcards saved successfully!`);
      }
    } catch (_error) {
      toast.error('Failed to save flashcards. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2" size={24} /> Video AI Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate organized notes, summaries, and flashcards from YouTube videos or uploaded files.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube URL
              </label>
              <div className="flex space-x-2">
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (e.target.value && videoFile) {
                      setVideoFile(null); // Clear file when URL is entered
                      const fileInput = document.getElementById('video-file-upload') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.value = '';
                      }
                    }
                  }}
                  disabled={isAnalyzing}
                />
                <Button onClick={handleAnalyzeUrl} disabled={isAnalyzing}>
                  <Youtube className="mr-2" size={16} /> Analyze URL
                </Button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-center">
              <Button 
                onClick={testBackendConnection} 
                disabled={isTestingConnection}
                variant="outline"
                size="sm"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={16} />
                    Test Backend Connection
                  </>
                )}
              </Button>
            </div>

            <div className="relative flex items-center justify-center w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Input
                id="video-file-upload"
                type="file"
                accept="video/mp4,video/avi,video/mov,video/wmv,video/webm"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              <div className="flex flex-col items-center">
                <Upload className="text-gray-400 dark:text-gray-500 mb-2" size={32} />
                <p className="text-gray-600 dark:text-gray-400">
                  Drag & drop a video file here, or <span className="text-blue-600 dark:text-blue-400 cursor-pointer">browse</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Max 250MB, MP4, AVI, MOV, WMV, WebM
                </p>
                {videoFile && (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2 w-full max-w-md">
                    <div className="flex items-center space-x-2">
                      <Video className="text-blue-500" size={16} />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer z-10 relative"
                      title="Remove file"
                      type="button"
                    >
                      <X className="text-gray-500 hover:text-red-500" size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleAnalyzeFile} disabled={isAnalyzing || !videoFile} className="w-full">
              <Upload className="mr-2" size={16} /> Analyze Uploaded File
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isAnalyzing && analysisResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Loader2 className="mr-2 animate-spin" size={20} /> Analyzing Video...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {analysisResult.title} ({formatTime(analysisResult.duration)})
                </p>
                <Progress value={analysisResult.progress} className="w-full mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {analysisResult.progress.toFixed(0)}% - Estimated time remaining: {formatTime(analysisResult.estimatedTimeRemaining)}
                </p>
              </CardContent>
            </Card>
          )}

          {analysisResult && analysisResult.status === 'completed' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 text-green-500" size={20} /> Analysis Complete!
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setAnalysisResult(null)}>
                    <RefreshCw className="mr-2" size={16} /> Start New Analysis
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Video: {analysisResult.title} (Duration: {formatTime(analysisResult.duration)})
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Button 
                    variant={activeTab === 'topics' ? 'primary' : 'outline'} 
                    onClick={() => setActiveTab('topics')}
                  >
                    <BookOpen className="mr-2" size={16} /> Topics ({analysisResult.topics?.length || 0})
                  </Button>
                  <Button 
                    variant={activeTab === 'summary' ? 'primary' : 'outline'} 
                    onClick={() => setActiveTab('summary')}
                  >
                    <FileText className="mr-2" size={16} /> Summary
                  </Button>
                  <Button 
                    variant={activeTab === 'flashcards' ? 'primary' : 'outline'} 
                    onClick={() => setActiveTab('flashcards')}
                  >
                    <Zap className="mr-2" size={16} /> Flashcards ({analysisResult.flashcards?.length || 0})
                  </Button>
                </div>

                {activeTab === 'topics' && (
                  <div className="space-y-4">
                    {analysisResult.topics?.map(topic => (
                      <Card key={topic.id} className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {topic.title} ({formatTime(topic.startTime)} - {formatTime(topic.endTime)})
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                          {topic.content}
                        </p>
                        {topic.summary && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Summary:</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{topic.summary}</p>
                          </div>
                        )}
                        <div className="flex space-x-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateTopicSummary(topic)}
                            disabled={!!topic.summary}
                          >
                            <FileText className="mr-1" size={14} />
                            {topic.summary ? 'Summary Generated' : 'Generate Summary'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateTopicFlashcards(topic)}
                          >
                            <Zap className="mr-1" size={14} />
                            Generate Flashcards
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveNotes} className="flex-1">
                        <BookOpen className="mr-2" size={16} /> Save All Notes
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Overall Summary</h4>
                      {analysisResult.overallSummary ? (
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">{analysisResult.overallSummary}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(analysisResult.overallSummary || '')}
                          >
                            <ClipboardCopy className="mr-1" size={14} /> Copy
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-3">No overall summary generated yet.</p>
                          <Button onClick={handleGenerateOverallSummary}>
                            <FileText className="mr-2" size={16} /> Generate Overall Summary
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {activeTab === 'flashcards' && (
                  <div className="space-y-4">
                    {analysisResult.flashcards && analysisResult.flashcards.length > 0 ? (
                      <>
                        {analysisResult.flashcards.map((card, index) => (
                          <Card key={card.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Card {index + 1}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(`${card.front}\n\n${card.back}`)}
                              >
                                <ClipboardCopy className="mr-1" size={14} /> Copy
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <strong className="text-gray-900 dark:text-white">Q:</strong> {card.front}
                              </div>
                              <div>
                                <strong className="text-gray-900 dark:text-white">A:</strong> {card.back}
                              </div>
                            </div>
                          </Card>
                        ))}
                        <Button onClick={handleSaveFlashcards} className="w-full">
                          <Zap className="mr-2" size={16} /> Save All Flashcards
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Zap className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">No flashcards generated yet.</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Generate flashcards for individual topics to see them here.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
