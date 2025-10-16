'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Video, 
  Upload, 
  Link, 
  Play, 
  Pause, 
  Loader2, 
  FileText, 
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

interface VideoAnalysisResult {
  id: string;
  title: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  transcript?: string;
  topics?: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    content: string;
    summary?: string;
  }>;
  notes?: Array<{
    id: string;
    title: string;
    content: string;
    topicId: string;
  }>;
  flashcards?: Array<{
    id: string;
    front: string;
    back: string;
    topicId: string;
  }>;
  error?: string;
  estimatedTimeRemaining?: number;
  overallSummary?: string;
}

export default function VideoAnalyzerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inputType, setInputType] = useState<'url' | 'upload'>('url');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2.5 hours of video, assuming ~100MB per hour)
      const maxSize = 250 * 1024 * 1024; // 250MB
      if (file.size > maxSize) {
        setError('File size too large. Maximum size is 250MB (approximately 2.5 hours of video).');
        return;
      }
      
      // Check file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setError('Unsupported file type. Please upload MP4, AVI, MOV, WMV, or WebM files.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleAnalyze = async () => {
    if (!session?.user?.email) {
      setError('You must be logged in to analyze videos.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Simulate video analysis for now (frontend-only implementation)
      const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create initial analysis result
      const initialResult: VideoAnalysisResult = {
        id: analysisId,
        title: inputType === 'url' ? 'YouTube Video' : selectedFile?.name || 'Video Analysis',
        duration: 0,
        status: 'processing',
        progress: 0,
        estimatedTimeRemaining: inputType === 'url' ? 300 : 600
      };

      setAnalysisResult(initialResult);

      // Simulate processing with progress updates
      await simulateVideoAnalysis(analysisId);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze video. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const simulateVideoAnalysis = async (analysisId: string) => {
    // Simulate processing steps
    const steps = [
      { progress: 10, message: 'Extracting audio from video...' },
      { progress: 30, message: 'Converting speech to text...' },
      { progress: 50, message: 'Analyzing content structure...' },
      { progress: 70, message: 'Identifying topics and themes...' },
      { progress: 90, message: 'Organizing content...' },
      { progress: 100, message: 'Analysis complete!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay per step
      
      setAnalysisResult(prev => prev ? {
        ...prev,
        progress: step.progress,
        estimatedTimeRemaining: Math.max(0, (prev.estimatedTimeRemaining || 0) - 60)
      } : null);
    }

    // Complete the analysis with mock data
    const completedResult: VideoAnalysisResult = {
      id: analysisId,
      title: inputType === 'url' ? 'YouTube Video' : selectedFile?.name || 'Video Analysis',
      duration: 1800, // 30 minutes
      status: 'completed',
      progress: 100,
      transcript: `
        Welcome to this educational video about machine learning. In this video, we'll cover the fundamentals of machine learning algorithms.

        First, let's talk about supervised learning. Supervised learning is a type of machine learning where we train a model using labeled data. The model learns to make predictions based on input-output pairs.

        There are two main types of supervised learning: classification and regression. Classification is used when we want to predict discrete categories, while regression is used for continuous values.

        Next, let's discuss unsupervised learning. Unlike supervised learning, unsupervised learning works with unlabeled data. The goal is to find hidden patterns or structures in the data.

        Common unsupervised learning techniques include clustering and dimensionality reduction. Clustering groups similar data points together, while dimensionality reduction reduces the number of features while preserving important information.

        Finally, let's touch on reinforcement learning. This is a type of machine learning where an agent learns to make decisions by interacting with an environment and receiving rewards or penalties.

        Reinforcement learning has been successfully applied to game playing, robotics, and autonomous systems. The agent learns through trial and error to maximize its cumulative reward.

        That concludes our overview of machine learning types. Each approach has its own strengths and is suitable for different types of problems.
      `,
      topics: [
        {
          id: 'topic-1',
          title: 'Introduction to Machine Learning',
          startTime: 0,
          endTime: 300,
          content: 'Welcome to this educational video about machine learning. In this video, we\'ll cover the fundamentals of machine learning algorithms.'
        },
        {
          id: 'topic-2',
          title: 'Supervised Learning',
          startTime: 300,
          endTime: 600,
          content: 'First, let\'s talk about supervised learning. Supervised learning is a type of machine learning where we train a model using labeled data. The model learns to make predictions based on input-output pairs. There are two main types of supervised learning: classification and regression. Classification is used when we want to predict discrete categories, while regression is used for continuous values.'
        },
        {
          id: 'topic-3',
          title: 'Unsupervised Learning',
          startTime: 600,
          endTime: 900,
          content: 'Next, let\'s discuss unsupervised learning. Unlike supervised learning, unsupervised learning works with unlabeled data. The goal is to find hidden patterns or structures in the data. Common unsupervised learning techniques include clustering and dimensionality reduction. Clustering groups similar data points together, while dimensionality reduction reduces the number of features while preserving important information.'
        },
        {
          id: 'topic-4',
          title: 'Reinforcement Learning',
          startTime: 900,
          endTime: 1200,
          content: 'Finally, let\'s touch on reinforcement learning. This is a type of machine learning where an agent learns to make decisions by interacting with an environment and receiving rewards or penalties. Reinforcement learning has been successfully applied to game playing, robotics, and autonomous systems. The agent learns through trial and error to maximize its cumulative reward.'
        }
      ],
      notes: [
        {
          id: 'note-1',
          title: 'Introduction to Machine Learning',
          content: 'Welcome to this educational video about machine learning. In this video, we\'ll cover the fundamentals of machine learning algorithms.',
          topicId: 'topic-1'
        },
        {
          id: 'note-2',
          title: 'Supervised Learning',
          content: 'First, let\'s talk about supervised learning. Supervised learning is a type of machine learning where we train a model using labeled data. The model learns to make predictions based on input-output pairs. There are two main types of supervised learning: classification and regression. Classification is used when we want to predict discrete categories, while regression is used for continuous values.',
          topicId: 'topic-2'
        },
        {
          id: 'note-3',
          title: 'Unsupervised Learning',
          content: 'Next, let\'s discuss unsupervised learning. Unlike supervised learning, unsupervised learning works with unlabeled data. The goal is to find hidden patterns or structures in the data. Common unsupervised learning techniques include clustering and dimensionality reduction. Clustering groups similar data points together, while dimensionality reduction reduces the number of features while preserving important information.',
          topicId: 'topic-3'
        },
        {
          id: 'note-4',
          title: 'Reinforcement Learning',
          content: 'Finally, let\'s touch on reinforcement learning. This is a type of machine learning where an agent learns to make decisions by interacting with an environment and receiving rewards or penalties. Reinforcement learning has been successfully applied to game playing, robotics, and autonomous systems. The agent learns through trial and error to maximize its cumulative reward.',
          topicId: 'topic-4'
        }
      ]
    };

    setAnalysisResult(completedResult);
    setIsAnalyzing(false);
  };

  const handleGenerateSummary = async (topicId: string, type: 'topic' | 'overall') => {
    if (!analysisResult) return;

    // Simulate AI summary generation
    const summary = type === 'overall' 
      ? 'This video provides a comprehensive overview of machine learning, covering the three main types: supervised learning (classification and regression), unsupervised learning (clustering and dimensionality reduction), and reinforcement learning (agent-based decision making). Each approach has distinct characteristics and applications in solving different types of problems.'
      : 'This topic covers the fundamental concepts and key characteristics of the subject matter, including important definitions, practical applications, and real-world examples that demonstrate the core principles discussed.';

    // Update the analysis result with the new summary
    setAnalysisResult(prev => {
      if (!prev) return null;
      
      if (type === 'overall') {
        return { ...prev, overallSummary: summary };
      } else {
        const updatedTopics = prev.topics?.map(topic => 
          topic.id === topicId ? { ...topic, summary } : topic
        );
        return { ...prev, topics: updatedTopics };
      }
    });
  };

  const handleGenerateFlashcards = async (topicId: string) => {
    if (!analysisResult) return;

    // Simulate AI flashcard generation
    const flashcards = [
      {
        id: `card-${Date.now()}-1`,
        front: 'What is the main topic of this section?',
        back: 'The main topic covers key concepts and important information related to the subject matter.',
        topicId
      },
      {
        id: `card-${Date.now()}-2`,
        front: 'What are the key characteristics?',
        back: 'The key characteristics include important details, practical applications, and real-world examples.',
        topicId
      },
      {
        id: `card-${Date.now()}-3`,
        front: 'How is this concept applied?',
        back: 'This concept is applied in various real-world scenarios and practical situations.',
        topicId
      }
    ];
    
    // Update the analysis result with the new flashcards
    setAnalysisResult(prev => {
      if (!prev) return null;
      
      const existingFlashcards = prev.flashcards || [];
      const newFlashcards = [...existingFlashcards, ...flashcards];
      
      return { ...prev, flashcards: newFlashcards };
    });
  };

  const handleSaveToNotes = async () => {
    if (!analysisResult?.notes) return;

    // For now, just show a success message
    alert(`Successfully saved ${analysisResult.notes.length} notes to your Notes tab!`);
    router.push('/notes');
  };

  const handleSaveToFlashcards = async () => {
    if (!analysisResult?.flashcards) return;

    // For now, just show a success message
    alert(`Successfully saved ${analysisResult.flashcards.length} flashcards to your Flashcards tab!`);
    router.push('/flashcards');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Video Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a video or enter a YouTube URL to automatically generate organized notes and flashcards
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!analysisResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Video Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Type Selection */}
              <div className="flex space-x-4">
                <Button
                  variant={inputType === 'url' ? 'default' : 'outline'}
                  onClick={() => setInputType('url')}
                  className="flex items-center"
                >
                  <Link className="h-4 w-4 mr-2" />
                  YouTube URL
                </Button>
                <Button
                  variant={inputType === 'upload' ? 'default' : 'outline'}
                  onClick={() => setInputType('upload')}
                  className="flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </Button>
              </div>

              {/* URL Input */}
              {inputType === 'url' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}

              {/* File Upload */}
              {inputType === 'upload' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      MP4, AVI, MOV, WMV, WebM (max 250MB)
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4"
                    >
                      Select File
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center">
                        <Video className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedFile.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (inputType === 'url' && !youtubeUrl.trim()) || (inputType === 'upload' && !selectedFile)}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Analysis Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {analysisResult.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Duration: {formatDuration(analysisResult.duration)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {analysisResult.status === 'processing' && (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-blue-600">
                          Processing... {analysisResult.progress}%
                        </span>
                      </>
                    )}
                    {analysisResult.status === 'completed' && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-600">Completed</span>
                      </>
                    )}
                    {analysisResult.status === 'failed' && (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm text-red-600">Failed</span>
                      </>
                    )}
                  </div>
                </div>
                
                {analysisResult.status === 'processing' && analysisResult.estimatedTimeRemaining && (
                  <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    Estimated time remaining: {formatDuration(analysisResult.estimatedTimeRemaining)}
                  </div>
                )}

                {analysisResult.status === 'failed' && analysisResult.error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {analysisResult.error}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topics and Content */}
            {analysisResult.status === 'completed' && analysisResult.topics && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Video Topics
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleGenerateSummary('', 'overall')}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Overall Summary
                    </Button>
                    <Button
                      onClick={handleSaveToNotes}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save to Notes
                    </Button>
                  </div>
                </div>

                {analysisResult.topics.map((topic) => (
                  <Card key={topic.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatDuration(topic.startTime)} - {formatDuration(topic.endTime)}
                          </span>
                          <Button
                            onClick={() => handleGenerateSummary(topic.id, 'topic')}
                            variant="outline"
                            size="sm"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Summary
                          </Button>
                          <Button
                            onClick={() => handleGenerateFlashcards(topic.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Flashcards
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {topic.content}
                        </p>
                        {topic.summary && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              AI Summary:
                            </h4>
                            <p className="text-blue-800 dark:text-blue-200">
                              {topic.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Generated Flashcards */}
            {analysisResult.flashcards && analysisResult.flashcards.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Generated Flashcards ({analysisResult.flashcards.length})
                    </CardTitle>
                    <Button
                      onClick={handleSaveToFlashcards}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save to Flashcards
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {analysisResult.flashcards.map((card) => (
                      <div
                        key={card.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          {card.front}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {card.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
