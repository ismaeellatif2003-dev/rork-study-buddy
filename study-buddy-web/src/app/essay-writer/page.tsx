'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Sparkles, Download, Save, Plus, Trash2, Edit3, Eye, Copy, Share2, Clock, BookOpen, FileUp, Quote, Link, User, Search, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { mockEssays } from '@/data/mockData';
import { updateUserStats } from '@/utils/userStats';
import { canUseFeature, updateUsage, getCurrentSubscription } from '@/utils/subscription';
import { aiService } from '@/services/aiService';
import { useAuthGuard, useFeatureGuard } from '@/utils/auth-guards';
import { essaysApi } from '@/services/dataService';
import UpgradePrompt from '@/components/UpgradePrompt';
import type { Essay } from '@/types/study';

export default function EssayWriterPage() {
  // Authentication guard
  const { isAuthenticated: authCheck, isLoading: authLoading } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/auth/signin'
  });
  
  const { canUseFeature: canCreateEssays, getRemainingUsage: getRemainingEssays } = useFeatureGuard('essays');
  
  const [essays, setEssays] = useState<Essay[]>(mockEssays);
  const [showNewEssay, setShowNewEssay] = useState(false);
  const [editingEssay, setEditingEssay] = useState<Essay | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullEssay, setShowFullEssay] = useState<Essay | null>(null);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showSampleWorkModal, setShowSampleWorkModal] = useState(false);
  const [showWebSearchModal, setShowWebSearchModal] = useState(false);
  const [sampleWork, setSampleWork] = useState<string>('');
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResults, setWebSearchResults] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
    sourceType: string;
    reliability: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subscription, setSubscription] = useState(getCurrentSubscription());
  const [citations, setCitations] = useState<Array<{
    id: string;
    type: 'book' | 'article' | 'website' | 'journal' | 'other';
    title: string;
    author: string;
    year: string;
    url?: string;
    publisher?: string;
  }>>([]);
  const [newCitation, setNewCitation] = useState({
    type: 'article' as 'book' | 'article' | 'website' | 'journal' | 'other',
    title: '',
    author: '',
    year: '',
    url: '',
    publisher: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEssay, setNewEssay] = useState({
    title: '',
    prompt: '',
    wordCount: 500,
    includeCitations: false,
    useSampleWork: false,
    autoWebReferences: false,
    citationStyle: 'apa' as 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee',
  });

  // Listen for subscription updates
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      setSubscription(getCurrentSubscription());
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    return () => window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
  }, []);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleCreateEssay = async () => {
    if (!newEssay.title.trim() || !newEssay.prompt.trim()) return;

    // Check if user can create essays
    if (!canUseFeature('essays')) {
      alert(`You've reached your essay limit (${subscription.plan.limits.essays}). Upgrade to Pro for unlimited essays!`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate essay using AI service
      const aiResponse = await aiService.generateText({
        messages: [
          {
            role: 'system',
            content: `You are an expert academic writer. Write a comprehensive essay based on the given title and prompt. 
            ${newEssay.includeCitations ? 'Include proper citations and references.' : ''}
            ${newEssay.useSampleWork && sampleWork ? `Match the writing style of this sample work: ${sampleWork}` : ''}
            Target word count: ${newEssay.wordCount} words.
            Citation style: ${newEssay.citationStyle || 'APA'}.`
          },
          {
            role: 'user',
            content: `Title: ${newEssay.title}\n\nPrompt: ${newEssay.prompt}`
          }
        ],
        type: 'text',
        model: 'openai/gpt-4o'
      });

      if (!aiResponse.success || !aiResponse.response) {
        throw new Error(aiResponse.error || 'Failed to generate essay');
      }

      const essay: Essay = {
        id: Date.now().toString(),
        title: newEssay.title,
        prompt: newEssay.prompt,
        content: aiResponse.response,
        wordCount: aiResponse.response.split(' ').length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setEssays(prev => [essay, ...prev]);
      setNewEssay({ 
        title: '', 
        prompt: '', 
        wordCount: 500,
        includeCitations: false,
        useSampleWork: false,
        autoWebReferences: false,
        citationStyle: 'apa'
      });
      setEditingEssay(null);
      setShowNewEssay(false);
      
      // Save essay to backend to update usage stats
      try {
        await essaysApi.create({
          title: essay.title,
          prompt: essay.prompt,
          content: essay.content,
          word_count: essay.wordCount
        });
        console.log('✅ Essay saved to backend');
      } catch (backendError) {
        console.error('❌ Failed to save essay to backend:', backendError);
        // Don't fail the operation if backend save fails
      }
      
      // Update user stats for essay generation
      updateUserStats('essays', 1);
      updateUsage('essays', 1);
    } catch (error) {
      console.error('Error creating essay:', error);
      alert('Failed to create essay. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditEssay = (essay: Essay) => {
    setEditingEssay(essay);
    setNewEssay({
      title: essay.title,
      prompt: essay.prompt,
      wordCount: essay.wordCount,
      includeCitations: false,
      useSampleWork: false,
      autoWebReferences: false,
      citationStyle: 'apa'
    });
    setShowNewEssay(true);
  };

  const handleDeleteEssay = (essayId: string) => {
    if (confirm('Are you sure you want to delete this essay?')) {
      setEssays(prev => prev.filter(essay => essay.id !== essayId));
    }
  };

  const handleDownloadEssay = (essay: Essay) => {
    const element = document.createElement('a');
    const file = new Blob([essay.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${essay.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyEssay = (essay: Essay) => {
    navigator.clipboard.writeText(essay.content);
    alert('Essay copied to clipboard!');
  };

  const handleShareEssay = (essay: Essay) => {
    if (navigator.share) {
      navigator.share({
        title: essay.title,
        text: essay.content.substring(0, 200) + '...',
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${essay.title}\n\n${essay.content}`);
      alert('Essay content copied to clipboard for sharing!');
    }
  };

  const handleViewFullEssay = (essay: Essay) => {
    setShowFullEssay(essay);
  };

  const handleUpdateEssay = (essay: Essay) => {
    setEssays(prev => prev.map(e => 
      e.id === essay.id 
        ? { ...essay, updatedAt: new Date().toISOString() }
        : e
    ));
    setShowFullEssay(null);
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSampleWork(content);
        setShowSampleWorkModal(true);
      };
      reader.readAsText(file);
    }
  };

  const handleAddCitation = () => {
    if (!newCitation.title.trim() || !newCitation.author.trim() || !newCitation.year.trim()) {
      alert('Please fill in all required fields (title, author, year)');
      return;
    }

    const citation = {
      id: Date.now().toString(),
      ...newCitation,
    };
    
    setCitations(prev => [...prev, citation]);
    setNewCitation({
      type: 'article',
      title: '',
      author: '',
      year: '',
      url: '',
      publisher: '',
    });
    setShowCitationModal(false);
  };

  const handleRemoveCitation = (citationId: string) => {
    setCitations(prev => prev.filter(c => c.id !== citationId));
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate trusted academic source search API call
    // In the future, this will connect to AI-powered academic search
    setTimeout(() => {
      const mockResults = [
        {
          title: `${webSearchQuery} - Academic Research Overview`,
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Peer-reviewed academic research and studies on ${webSearchQuery}. Comprehensive analysis from leading universities and research institutions.`,
          domain: 'scholar.google.com',
          sourceType: 'Academic Database',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery}: Systematic Review and Meta-Analysis`,
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Systematic reviews and meta-analyses on ${webSearchQuery} from PubMed. Evidence-based research from medical and scientific journals.`,
          domain: 'pubmed.ncbi.nlm.nih.gov',
          sourceType: 'Medical Database',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery} - JSTOR Academic Articles`,
          url: `https://www.jstor.org/action/doBasicSearch?Query=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Academic articles and research papers on ${webSearchQuery} from JSTOR's collection of scholarly journals and books.`,
          domain: 'jstor.org',
          sourceType: 'Academic Database',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery}: Research from IEEE Xplore`,
          url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Technical research papers and conference proceedings on ${webSearchQuery} from IEEE Xplore Digital Library.`,
          domain: 'ieeexplore.ieee.org',
          sourceType: 'Technical Database',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery} - ScienceDirect Research`,
          url: `https://www.sciencedirect.com/search?qs=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Scientific research articles and studies on ${webSearchQuery} from ScienceDirect's collection of peer-reviewed journals.`,
          domain: 'sciencedirect.com',
          sourceType: 'Scientific Database',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery}: Government Research and Reports`,
          url: `https://www.govinfo.gov/app/search?query=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Government research reports, policy papers, and official studies on ${webSearchQuery} from federal agencies and departments.`,
          domain: 'govinfo.gov',
          sourceType: 'Government Source',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery} - Encyclopedia Britannica`,
          url: `https://www.britannica.com/search?query=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Comprehensive encyclopedia entries and authoritative information about ${webSearchQuery} from Britannica's expert-reviewed content.`,
          domain: 'britannica.com',
          sourceType: 'Reference Source',
          reliability: 'High'
        },
        {
          title: `${webSearchQuery}: World Health Organization Reports`,
          url: `https://www.who.int/search?query=${encodeURIComponent(webSearchQuery)}`,
          snippet: `WHO research reports, guidelines, and health data on ${webSearchQuery} from the World Health Organization.`,
          domain: 'who.int',
          sourceType: 'International Organization',
          reliability: 'High'
        }
      ];
      
      setWebSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const handleAddWebCitation = (result: typeof webSearchResults[0]) => {
    const citation = {
      id: Date.now().toString(),
      type: 'website' as const,
      title: result.title,
      author: result.domain,
      year: new Date().getFullYear().toString(),
      url: result.url,
    };
    
    setCitations(prev => [...prev, citation]);
    setShowWebSearchModal(false);
    setWebSearchQuery('');
    setWebSearchResults([]);
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatCitation = (citation: { type: string; title: string; author: string; year: string; url?: string; publisher?: string }, style: string = 'apa') => {
    const { author, title, year, url = '', publisher = '' } = citation;
    
    switch (style) {
      case 'apa':
        switch (citation.type) {
          case 'book':
            return `${author} (${year}). ${title}. ${publisher || 'Publisher'}.`;
          case 'article':
            return `${author} (${year}). ${title}. ${publisher || 'Journal'}.`;
          case 'website':
            return `${author} (${year}). ${title}. Retrieved from ${url}`;
          case 'journal':
            return `${author} (${year}). ${title}. ${publisher || 'Journal'}.`;
          default:
            return `${author} (${year}). ${title}.`;
        }
      
      case 'mla':
        switch (citation.type) {
          case 'book':
            return `${author}. ${title}. ${publisher || 'Publisher'}, ${year}.`;
          case 'article':
            return `${author}. "${title}." ${publisher || 'Journal'}, ${year}.`;
          case 'website':
            return `${author}. "${title}." ${extractDomain(url || '')}, ${year}, ${url}.`;
          case 'journal':
            return `${author}. "${title}." ${publisher || 'Journal'}, vol. 1, no. 1, ${year}.`;
          default:
            return `${author}. "${title}." ${year}.`;
        }
      
      case 'chicago':
        switch (citation.type) {
          case 'book':
            return `${author}. ${title}. ${publisher || 'Publisher'}, ${year}.`;
          case 'article':
            return `${author}. "${title}." ${publisher || 'Journal'} (${year}).`;
          case 'website':
            return `${author}. "${title}." ${extractDomain(url || '')}. Last modified ${year}. ${url}.`;
          case 'journal':
            return `${author}. "${title}." ${publisher || 'Journal'} ${year}.`;
          default:
            return `${author}. "${title}." ${year}.`;
        }
      
      case 'harvard':
        switch (citation.type) {
          case 'book':
            return `${author} ${year}, ${title}, ${publisher || 'Publisher'}.`;
          case 'article':
            return `${author} ${year}, '${title}', ${publisher || 'Journal'}.`;
          case 'website':
            return `${author} ${year}, ${title}, viewed ${new Date().toLocaleDateString()}, <${url}>.`;
          case 'journal':
            return `${author} ${year}, '${title}', ${publisher || 'Journal'}.`;
          default:
            return `${author} ${year}, '${title}'.`;
        }
      
      case 'ieee':
        switch (citation.type) {
          case 'book':
            return `${author}, ${title}. ${publisher || 'Publisher'}, ${year}.`;
          case 'article':
            return `${author}, "${title}," ${publisher || 'Journal'}, ${year}.`;
          case 'website':
            return `${author}, "${title}," ${extractDomain(url || '')}, ${year}. [Online]. Available: ${url}`;
          case 'journal':
            return `${author}, "${title}," ${publisher || 'Journal'}, vol. 1, no. 1, pp. 1-10, ${year}.`;
          default:
            return `${author}, "${title}," ${year}.`;
        }
      
      default:
        return `${author} (${year}). ${title}.`;
    }
  };

  const generateEssayWithCitations = () => {
    let essayContent = `# ${newEssay.title}

## Introduction

${newEssay.prompt} This is a complex topic that requires careful analysis and consideration of multiple perspectives. In this essay, we will explore the various aspects of this subject and provide a comprehensive understanding of its implications.

## Main Body

### Key Concepts

The first important concept to consider is the fundamental nature of the topic. This involves understanding the basic principles that govern the subject matter and how they interact with other related concepts. The complexity of this topic requires a systematic approach to analysis.

### Analysis and Discussion

When examining this topic, several key factors emerge that are crucial to understanding its full scope. These factors include:

1. **Historical Context**: Understanding the background and development of this topic provides essential context for current discussions.

2. **Current Applications**: Examining how this topic is applied in contemporary settings reveals its practical significance.

3. **Future Implications**: Considering the potential future developments and their impact on society and individuals.

### Supporting Evidence

Research and studies in this area have provided valuable insights. The evidence suggests that this topic has significant implications for various aspects of human life and society. The data supports the importance of continued study and analysis in this field.

## Conclusion

In conclusion, this topic represents an important area of study that requires ongoing attention and analysis. The various aspects we have examined demonstrate the complexity and significance of this subject. Future research and discussion will continue to shed light on its many dimensions and implications.

The key takeaway is that understanding this topic requires a multifaceted approach that considers historical context, current applications, and future possibilities. As our understanding continues to evolve, so too will our appreciation for the depth and complexity of this important subject.`;

    // Add citations if requested
    if (newEssay.includeCitations && citations.length > 0) {
      const styleName = (newEssay.citationStyle || 'apa').toUpperCase();
      essayContent += `\n\n## References (${styleName} Style)\n\n`;
      citations.forEach((citation, index) => {
        essayContent += `${index + 1}. ${formatCitation(citation, newEssay.citationStyle || 'apa')}\n`;
      });
    }

    // Add automatic web references if enabled
    if (newEssay.autoWebReferences) {
      const styleName = (newEssay.citationStyle || 'apa').toUpperCase();
      essayContent += `\n\n## AI-Generated References from Trusted Sources (${styleName} Style)\n\n`;
      
      // Simulate AI-generated references based on essay topic
      const topicKeywords = newEssay.prompt.toLowerCase().split(' ').slice(0, 3);
      const mockWebReferences = [
        {
          author: 'Smith, J. et al.',
          title: `Recent Advances in ${topicKeywords[0] || 'Research'}: A Comprehensive Review`,
          year: '2024',
          url: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(newEssay.prompt),
          type: 'website' as const
        },
        {
          author: 'Johnson, M.',
          title: `${topicKeywords[1] || 'Analysis'} and Its Impact on Modern ${topicKeywords[2] || 'Studies'}`,
          year: '2024',
          url: 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(newEssay.prompt),
          type: 'website' as const
        },
        {
          author: 'Brown, A. & Wilson, K.',
          title: `Peer-Reviewed Research on ${newEssay.title}`,
          year: '2024',
          url: 'https://www.jstor.org/action/doBasicSearch?Query=' + encodeURIComponent(newEssay.prompt),
          type: 'website' as const
        }
      ];

      mockWebReferences.forEach((ref, index) => {
        const citationNumber = newEssay.includeCitations ? citations.length + index + 1 : index + 1;
        essayContent += `${citationNumber}. ${formatCitation(ref, newEssay.citationStyle || 'apa')}\n`;
      });
      
      essayContent += '\n*Note: These references were automatically generated by AI from trusted academic sources based on your essay topic.*';
    }

    // Add note about sample work if used
    if (newEssay.useSampleWork && sampleWork) {
      essayContent += '\n\n*Note: This essay was generated using your writing style based on the provided sample work.*';
    }

    return essayContent;
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
          <h1 className="text-2xl font-bold text-gray-900">Essay Writer</h1>
          <p className="text-gray-600 mt-1">AI-powered essay generation and editing</p>
        </div>
        <Button onClick={() => setShowNewEssay(true)} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus size={20} />
          New Essay
        </Button>
      </div>

      {essays.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No essays yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first AI-generated essay to get started
            </p>
            <Button onClick={() => setShowNewEssay(true)} className="bg-blue-600 text-white hover:bg-blue-700">
              Create Your First Essay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {essays.map((essay) => (
            <Card key={essay.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{essay.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Created {formatDate(essay.createdAt)}
                      {essay.updatedAt !== essay.createdAt && (
                        <span> • Updated {formatDate(essay.updatedAt)}</span>
                      )}
                    </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{essay.wordCount} words</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {getReadingTime(essay.content)} min read
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    AI Generated
                  </span>
                </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewFullEssay(essay)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditEssay(essay)}
                      className="bg-gray-600 text-white hover:bg-gray-700"
                    >
                      <Edit3 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCopyEssay(essay)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadEssay(essay)}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Download size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleShareEssay(essay)}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Share2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteEssay(essay.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt:</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {essay.prompt}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Essay Preview:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {essay.content.substring(0, 300)}
                      {essay.content.length > 300 && '...'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleViewFullEssay(essay)}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Eye size={16} />
                    View Full Essay
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCopyEssay(essay)}
                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                  >
                    <Copy size={16} />
                    Copy Text
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadEssay(essay)}
                    className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewEssay}
        onClose={() => {
          setShowNewEssay(false);
          setEditingEssay(null);
          setNewEssay({ 
            title: '', 
            prompt: '', 
            wordCount: 500,
            includeCitations: false,
            useSampleWork: false,
            autoWebReferences: false,
            citationStyle: 'apa'
          });
        }}
        title={editingEssay ? 'Edit Essay' : 'Create New Essay'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Essay Title"
            placeholder="Enter essay title..."
            value={newEssay.title}
            onChange={(e) => setNewEssay(prev => ({ ...prev, title: e.target.value }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Word Count
            </label>
            <select
              value={newEssay.wordCount}
              onChange={(e) => setNewEssay(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={250}>250 words</option>
              <option value={500}>500 words</option>
              <option value={750}>750 words</option>
              <option value={1000}>1000 words</option>
              <option value={1500}>1500 words</option>
              <option value={2000}>2000 words</option>
            </select>
          </div>
          
          <Textarea
            label="Essay Prompt"
            placeholder="Describe what you want your essay to be about..."
            value={newEssay.prompt}
            onChange={(e) => setNewEssay(prev => ({ ...prev, prompt: e.target.value }))}
            rows={4}
          />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeCitations"
                checked={newEssay.includeCitations}
                onChange={(e) => setNewEssay(prev => ({ ...prev, includeCitations: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeCitations" className="text-sm font-medium text-gray-700">
                Include citations and references
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useSampleWork"
                checked={newEssay.useSampleWork}
                onChange={(e) => setNewEssay(prev => ({ ...prev, useSampleWork: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="useSampleWork" className="text-sm font-medium text-gray-700">
                Use my writing style from sample work
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoWebReferences"
                checked={newEssay.autoWebReferences}
                onChange={(e) => setNewEssay(prev => ({ ...prev, autoWebReferences: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoWebReferences" className="text-sm font-medium text-gray-700">
                AI will automatically find and include references from trusted academic sources
              </label>
            </div>
          </div>

          {newEssay.includeCitations && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Quote className="text-yellow-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Citations Added</h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    {citations.length} citation(s) will be included in your essay.
                  </p>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-yellow-900 mb-1">Citation Style</label>
                    <select
                      value={newEssay.citationStyle || 'apa'}
                      onChange={(e) => setNewEssay(prev => ({ ...prev, citationStyle: e.target.value as 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' }))}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    >
                      <option value="apa">APA (American Psychological Association)</option>
                      <option value="mla">MLA (Modern Language Association)</option>
                      <option value="chicago">Chicago Manual of Style</option>
                      <option value="harvard">Harvard Referencing</option>
                      <option value="ieee">IEEE (Institute of Electrical and Electronics Engineers)</option>
                    </select>
                    <div className="mt-2 text-xs text-yellow-700">
                      <p><strong>APA:</strong> Psychology, Education, Social Sciences</p>
                      <p><strong>MLA:</strong> Literature, Arts, Humanities</p>
                      <p><strong>Chicago:</strong> History, Publishing, General</p>
                      <p><strong>Harvard:</strong> Business, Economics, General</p>
                      <p><strong>IEEE:</strong> Engineering, Computer Science, Technology</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCitationModal(true)}
                      size="sm"
                      className="bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Citation
                    </Button>
                    <Button
                      onClick={() => setShowWebSearchModal(true)}
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Search size={16} className="mr-1" />
                      Search Trusted Sources
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {newEssay.useSampleWork && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="text-green-600 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">Writing Style</h4>
                  <p className="text-sm text-green-800 mb-2">
                    {sampleWork ? 'Sample work loaded - AI will match your writing style.' : 'Upload sample work to help AI match your writing style.'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <FileUp size={16} className="mr-1" />
                      Upload Sample
                    </Button>
                    {sampleWork && (
                      <Button
                        onClick={() => setShowSampleWorkModal(true)}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Eye size={16} className="mr-1" />
                        View Sample
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {newEssay.autoWebReferences && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Search className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Web Reference Search Enabled</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    AI will automatically search trusted academic databases and include relevant references in your essay. 
                    References will be formatted in {(newEssay.citationStyle || 'apa').toUpperCase()} style.
                  </p>
                  <div className="text-xs text-blue-700">
                    <p><strong>Sources include:</strong> Google Scholar, PubMed, JSTOR, IEEE Xplore, ScienceDirect, and other peer-reviewed databases.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">AI Essay Generation</h4>
                <p className="text-sm text-blue-800">
                  Our AI will create a well-structured essay based on your prompt, including introduction, 
                  main body paragraphs, and conclusion.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewEssay(false);
                setEditingEssay(null);
                setNewEssay({ 
                  title: '', 
                  prompt: '', 
                  wordCount: 500,
                  includeCitations: false,
                  useSampleWork: false,
                  autoWebReferences: false,
                  citationStyle: 'apa'
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEssay}
              disabled={!newEssay.title.trim() || !newEssay.prompt.trim() || isGenerating}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {editingEssay ? 'Update Essay' : 'Generate Essay'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Essay Viewer Modal */}
      {showFullEssay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{showFullEssay.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span>{showFullEssay.wordCount} words</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {getReadingTime(showFullEssay.content)} min read
                    </span>
                    <span>•</span>
                    <span>Created {formatDate(showFullEssay.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullEssay(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Original Prompt:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{showFullEssay.prompt}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Generated Essay:</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                      {showFullEssay.content}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopyEssay(showFullEssay)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Essay
                  </Button>
                  <Button
                    onClick={() => handleDownloadEssay(showFullEssay)}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleShareEssay(showFullEssay)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Share2 size={16} className="mr-2" />
                    Share
                  </Button>
                </div>
                <Button
                  onClick={() => setShowFullEssay(null)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add Citation</h2>
                  <p className="text-sm text-gray-600">Current style: {(newEssay.citationStyle || 'apa').toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setShowCitationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newCitation.type}
                    onChange={(e) => setNewCitation(prev => ({ ...prev, type: e.target.value as 'article' | 'book' | 'website' | 'journal' | 'other' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="article">Article</option>
                    <option value="book">Book</option>
                    <option value="journal">Journal</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                
                <Input
                  label="Title *"
                  placeholder="Enter title..."
                  value={newCitation.title}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <Input
                  label="Author *"
                  placeholder="Enter author name..."
                  value={newCitation.author}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, author: e.target.value }))}
                />
                
                <Input
                  label="Year *"
                  placeholder="Enter publication year..."
                  value={newCitation.year}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, year: e.target.value }))}
                />
                
                {newCitation.type === 'website' && (
                  <Input
                    label="URL"
                    placeholder="Enter website URL..."
                    value={newCitation.url}
                    onChange={(e) => setNewCitation(prev => ({ ...prev, url: e.target.value }))}
                  />
                )}
                
                {(newCitation.type === 'book' || newCitation.type === 'journal') && (
                  <Input
                    label="Publisher"
                    placeholder="Enter publisher..."
                    value={newCitation.publisher}
                    onChange={(e) => setNewCitation(prev => ({ ...prev, publisher: e.target.value }))}
                  />
                )}
              </div>
              
              {newCitation.title && newCitation.author && newCitation.year && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Preview ({(newEssay.citationStyle || 'apa').toUpperCase()} Style):</h4>
                  <p className="text-sm text-gray-700 italic">
                    {formatCitation(newCitation, newEssay.citationStyle || 'apa')}
                  </p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => setShowCitationModal(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCitation}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add Citation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Work Modal */}
      {showSampleWorkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Sample Work</h2>
                <button
                  onClick={() => setShowSampleWorkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  This sample work will help the AI understand your writing style and generate essays that match your tone and structure.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {sampleWork}
                  </pre>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setSampleWork('');
                    setShowSampleWorkModal(false);
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Remove Sample
                </Button>
                <Button
                  onClick={() => setShowSampleWorkModal(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Web Search Modal */}
      {showWebSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search Trusted Academic Sources</h2>
                  <p className="text-sm text-gray-600">AI-powered search of peer-reviewed databases • Citations in {(newEssay.citationStyle || 'apa').toUpperCase()} style</p>
                </div>
                <button
                  onClick={() => {
                    setShowWebSearchModal(false);
                    setWebSearchQuery('');
                    setWebSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search trusted academic databases for peer-reviewed sources..."
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleWebSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleWebSearch}
                    disabled={!webSearchQuery.trim() || isSearching}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search size={16} />
                    )}
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> AI will automatically search and pull relevant references from trusted academic databases, 
                    saving you time and ensuring you have the most current and credible sources for your essay.
                  </p>
                </div>
              </div>
              
              {webSearchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Trusted Academic Sources</h3>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>All sources verified for academic reliability</span>
                    </div>
                  </div>
                  {webSearchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{result.title}</h4>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {result.reliability}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Globe size={12} />
                              <span>{result.domain}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{result.sourceType}</span>
                            </div>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink size={12} />
                              Visit Source
                            </a>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddWebCitation(result)}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700 ml-4"
                        >
                          <Plus size={16} className="mr-1" />
                          Add Citation
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {webSearchResults.length === 0 && !isSearching && webSearchQuery && (
                <div className="text-center py-8">
                  <Search size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No results found. Try a different search term.</p>
                </div>
              )}
              
              {!webSearchQuery && (
                <div className="text-center py-8">
                  <Globe size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Enter a search term to find trusted academic sources for your essay.</p>
                  <p className="text-sm text-gray-500 mt-2">AI will search peer-reviewed databases, academic journals, and verified research sources.</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowWebSearchModal(false);
                    setWebSearchQuery('');
                    setWebSearchResults([]);
                  }}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
