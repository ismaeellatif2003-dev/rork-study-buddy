/**
 * Mock API Service for Grounded Essay Writer
 * 
 * This service provides realistic mock responses for all API endpoints
 * used by the Grounded Essay Writer. Replace these functions with actual
 * API calls to your backend service.
 * 
 * Example request/response formats are provided in comments for easy
 * backend integration mapping.
 */

// Types for API requests and responses
interface FileUploadRequest {
  name: string;
  type: string;
  content: string;
}

interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileType: string;
  pages?: number;
  excerpt: string;
}

interface PasteTextRequest {
  group: 'notes' | 'references';
  text: string;
}

interface PasteTextResponse {
  fileId: string;
  title: string;
  excerpt: string;
}

interface IngestResponse {
  jobId: string;
}

interface IngestStatusResponse {
  status: 'processing' | 'done' | 'error';
  chunksCount?: number;
  error?: string;
}

interface GenerateOutlineRequest {
  prompt: string;
  wordCount: number;
  level: 'high-school' | 'undergraduate' | 'graduate' | 'professional';
  citationStyle: 'apa' | 'mla' | 'harvard' | 'chicago' | 'none';
  mode: 'grounded' | 'mixed' | 'teach';
  fileIds: string[];
  rubric?: string;
  essayTopic?: string;
  sampleEssayId?: string;
  smartSelection?: any;
}

interface AnalyzeReferencesRequest {
  prompt: string;
  essayTopic: string;
  assignmentTitle?: string;
  references: Array<{
    id: string;
    name: string;
    excerpt: string;
    content: string;
  }>;
}

interface AnalyzeReferencesResponse {
  analysis: Record<string, {
    relevanceScore: number;
    keyTopics: string[];
    summary: string;
    confidence: number;
  }>;
  smartSelection: {
    selectedReferences: string[];
    excludedReferences: string[];
    reasoning: string;
    totalReferences: number;
    selectedCount: number;
  };
}

interface GenerateOutlineResponse {
  outlineId: string;
  thesis: string;
  paragraphs: Array<{
    title: string;
    intendedChunks: Array<{
      label: string;
      excerpt: string;
    }>;
    suggestedWordCount: number;
  }>;
  metadata: {
    retrievedCount: number;
  };
}

interface ExpandParagraphRequest {
  outlineId: string;
  paragraphIndex: number;
}

interface ExpandParagraphResponse {
  paragraphText: string;
  usedChunks: Array<{
    label: string;
    page?: number;
  }>;
  citations: Array<{
    text: string;
    source: string;
  }>;
  unsupportedFlags: Array<{
    sentence: string;
    reason: string;
  }>;
}

interface GenerateFullDraftRequest {
  outlineId: string;
  includeReferences: boolean;
  citationStyle: string;
}

interface GenerateFullDraftResponse {
  essayText: string;
  bibliography: string;
  metadata: {
    totalWords: number;
    citationsCount: number;
    chunksUsed: number;
  };
}

// Mock data for realistic responses
const mockFiles = [
  {
    id: 'file_001',
    name: 'Climate Change Research.pdf',
    type: 'application/pdf',
    pages: 12,
    excerpt: 'Climate change represents one of the most pressing challenges of our time, with far-reaching implications for ecosystems, economies, and human societies worldwide...'
  },
  {
    id: 'file_002',
    name: 'Environmental Policy Notes.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pages: 8,
    excerpt: 'Key environmental policies include carbon pricing mechanisms, renewable energy incentives, and international cooperation frameworks such as the Paris Agreement...'
  },
  {
    id: 'file_003',
    name: 'Sustainability Studies.txt',
    type: 'text/plain',
    excerpt: 'Sustainable development requires balancing economic growth with environmental protection and social equity. The three pillars of sustainability are environmental, economic, and social...'
  }
];

const mockChunks = [
  { label: 'DOC1:p3', excerpt: 'The scientific consensus on climate change is overwhelming, with 97% of climate scientists agreeing that human activities are the primary driver...' },
  { label: 'DOC1:p7', excerpt: 'Greenhouse gas concentrations have increased dramatically since the Industrial Revolution, with CO2 levels rising from 280 ppm to over 400 ppm...' },
  { label: 'NOTES1:chunk2', excerpt: 'Carbon pricing mechanisms include carbon taxes and cap-and-trade systems, both designed to internalize the external costs of carbon emissions...' },
  { label: 'NOTES2:chunk1', excerpt: 'Renewable energy sources such as solar and wind power have become increasingly cost-competitive with fossil fuels in recent years...' },
  { label: 'REF1:p2', excerpt: 'The Paris Agreement represents a landmark international effort to limit global temperature rise to well below 2°C above pre-industrial levels...' },
  { label: 'REF2:p5', excerpt: 'Adaptation strategies for climate change include infrastructure improvements, agricultural modifications, and coastal protection measures...' }
];

// Utility function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  /**
   * Upload a file and return metadata
   * 
   * Example request:
   * POST /api/files/upload
   * {
   *   "group": "notes",
   *   "file": File object
   * }
   * 
   * Example response:
   * {
   *   "fileId": "file_001",
   *   "fileName": "Climate Change Research.pdf",
   *   "fileType": "application/pdf",
   *   "pages": 12,
   *   "excerpt": "Climate change represents one of the most pressing challenges..."
   * }
   */
  async uploadFile(group: 'notes' | 'references', file: FileUploadRequest): Promise<FileUploadResponse> {
    await delay(1500); // Simulate upload time
    
    const mockFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    return {
      fileId: mockFile.id,
      fileName: file.name,
      fileType: file.type,
      pages: mockFile.pages,
      excerpt: mockFile.excerpt
    };
  },

  /**
   * Paste text content and return metadata
   * 
   * Example request:
   * POST /api/text/paste
   * {
   *   "group": "notes",
   *   "text": "Climate change is a global issue..."
   * }
   * 
   * Example response:
   * {
   *   "fileId": "text_001",
   *   "title": "Pasted Text - Climate Change",
   *   "excerpt": "Climate change is a global issue that affects..."
   * }
   */
  async pasteText(group: 'notes' | 'references', text: string): Promise<PasteTextResponse> {
    await delay(800);
    
    const title = `Pasted Text - ${text.substring(0, 30)}...`;
    const excerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    
    return {
      fileId: `text_${Date.now()}`,
      title,
      excerpt
    };
  },

  /**
   * Start file ingestion process
   * 
   * Example request:
   * POST /api/ingest/start
   * {
   *   "fileIds": ["file_001", "file_002", "text_001"]
   * }
   * 
   * Example response:
   * {
   *   "jobId": "ingest_job_123"
   * }
   */
  async ingestFiles(fileIds: string[]): Promise<IngestResponse> {
    await delay(1000);
    
    return {
      jobId: `ingest_job_${Date.now()}`
    };
  },

  /**
   * Check ingestion status
   * 
   * Example request:
   * GET /api/ingest/status/{jobId}
   * 
   * Example response:
   * {
   *   "status": "done",
   *   "chunksCount": 24
   * }
   */
  async getIngestStatus(jobId: string): Promise<IngestStatusResponse> {
    await delay(500);
    
    return {
      status: 'done',
      chunksCount: 24
    };
  },

  /**
   * Generate essay outline
   * 
   * Example request:
   * POST /api/outline/generate
   * {
   *   "prompt": "Discuss the impact of climate change on global economies",
   *   "wordCount": 800,
   *   "level": "undergraduate",
   *   "citationStyle": "apa",
   *   "mode": "grounded",
   *   "fileIds": ["file_001", "file_002"],
   *   "rubric": "Climate Change Economics Essay"
   * }
   * 
   * Example response:
   * {
   *   "outlineId": "outline_123",
   *   "thesis": "Climate change poses significant economic challenges...",
   *   "paragraphs": [
   *     {
   *       "title": "Economic Costs of Climate Change",
   *       "intendedChunks": [
   *         {
   *           "label": "DOC1:p3",
   *           "excerpt": "The scientific consensus on climate change..."
   *         }
   *       ],
   *       "suggestedWordCount": 200
   *     }
   *   ],
   *   "metadata": {
   *     "retrievedCount": 6
   *   }
   * }
   */
  async generateOutline(request: GenerateOutlineRequest): Promise<GenerateOutlineResponse> {
    await delay(3000); // Simulate AI processing time
    
    // Generate thesis based on essay topic and prompt
    let thesis = `Climate change poses significant economic challenges that require immediate policy responses and international cooperation to mitigate long-term costs and ensure sustainable development.`;
    
    if (request.essayTopic) {
      thesis = `This essay explores ${request.essayTopic.toLowerCase()}, examining the key factors and implications that shape this important topic. Through careful analysis of available evidence, this paper will demonstrate the significance of understanding ${request.essayTopic.toLowerCase()} in contemporary discourse.`;
    }
    
    // Adjust content based on sample essay style if provided
    const hasSampleEssay = !!request.sampleEssayId;
    const styleNote = hasSampleEssay ? " (matching user's writing style)" : "";
    
    const paragraphs = [
      {
        title: "Introduction and Context",
        intendedChunks: [
          mockChunks[0],
          mockChunks[1]
        ],
        suggestedWordCount: Math.floor(request.wordCount * 0.25)
      },
      {
        title: "Analysis and Evidence",
        intendedChunks: [
          mockChunks[2],
          mockChunks[3]
        ],
        suggestedWordCount: Math.floor(request.wordCount * 0.25)
      },
      {
        title: "Critical Evaluation",
        intendedChunks: [
          mockChunks[4]
        ],
        suggestedWordCount: Math.floor(request.wordCount * 0.25)
      },
      {
        title: "Conclusion and Implications",
        intendedChunks: [
          mockChunks[5]
        ],
        suggestedWordCount: Math.floor(request.wordCount * 0.25)
      }
    ];
    
    // If we have a specific essay topic, customize the paragraph titles
    if (request.essayTopic) {
      paragraphs[0].title = `Understanding ${request.essayTopic}`;
      paragraphs[1].title = `Key Aspects of ${request.essayTopic}`;
      paragraphs[2].title = `Analysis and Implications`;
      paragraphs[3].title = `Conclusion and Future Directions`;
    }
    
    return {
      outlineId: `outline_${Date.now()}`,
      thesis,
      paragraphs,
      metadata: {
        retrievedCount: Math.max(mockChunks.length, request.fileIds.length) + (hasSampleEssay ? 1 : 0)
      }
    };
  },

  /**
   * Expand a specific paragraph
   * 
   * Example request:
   * POST /api/paragraph/expand
   * {
   *   "outlineId": "outline_123",
   *   "paragraphIndex": 0
   * }
   * 
   * Example response:
   * {
   *   "paragraphText": "Climate change represents one of the most pressing economic challenges of our time...",
   *   "usedChunks": [
   *     {
   *       "label": "DOC1:p3",
   *       "page": 3
   *     }
   *   ],
   *   "citations": [
   *     {
   *       "text": "scientific consensus on climate change",
   *       "source": "DOC1:p3"
   *     }
   *   ],
   *   "unsupportedFlags": [
   *     {
   *       "sentence": "This trend will continue unless immediate action is taken.",
   *       "reason": "No specific data provided about future trends"
   *     }
   *   ]
   * }
   */
  async expandParagraph(request: ExpandParagraphRequest): Promise<ExpandParagraphResponse> {
    await delay(2000);
    
    const paragraphTexts = [
      `Climate change represents one of the most pressing economic challenges of our time, with far-reaching implications for global markets, supply chains, and financial systems. The scientific consensus on climate change is overwhelming, with 97% of climate scientists agreeing that human activities are the primary driver of recent warming trends (DOC1:p3). Greenhouse gas concentrations have increased dramatically since the Industrial Revolution, with CO2 levels rising from 280 ppm to over 400 ppm, creating unprecedented environmental and economic pressures (DOC1:p7). This trend will continue unless immediate action is taken.`,
      
      `Effective policy responses to climate change require comprehensive approaches that address both mitigation and adaptation strategies. Carbon pricing mechanisms include carbon taxes and cap-and-trade systems, both designed to internalize the external costs of carbon emissions and incentivize cleaner technologies (NOTES1:chunk2). Renewable energy sources such as solar and wind power have become increasingly cost-competitive with fossil fuels in recent years, offering viable alternatives for sustainable economic growth (NOTES2:chunk1).`,
      
      `International cooperation is essential for addressing the global nature of climate change and ensuring coordinated policy responses. The Paris Agreement represents a landmark international effort to limit global temperature rise to well below 2°C above pre-industrial levels, demonstrating the potential for multilateral environmental governance (REF1:p2). However, the effectiveness of such agreements depends on strong enforcement mechanisms and continued commitment from participating nations.`,
      
      `Adaptation strategies for climate change include infrastructure improvements, agricultural modifications, and coastal protection measures that can help societies prepare for inevitable climate impacts (REF2:p5). These strategies require significant investment but can reduce long-term economic costs and improve resilience. The transition to a low-carbon economy presents both challenges and opportunities for economic development and job creation.`
    ];
    
    const usedChunks = [
      [
        { label: 'DOC1:p3', page: 3 },
        { label: 'DOC1:p7', page: 7 }
      ],
      [
        { label: 'NOTES1:chunk2' },
        { label: 'NOTES2:chunk1' }
      ],
      [
        { label: 'REF1:p2', page: 2 }
      ],
      [
        { label: 'REF2:p5', page: 5 }
      ]
    ];
    
    const citations = [
      [
        { text: 'scientific consensus on climate change', source: 'DOC1:p3' },
        { text: 'CO2 levels rising from 280 ppm to over 400 ppm', source: 'DOC1:p7' }
      ],
      [
        { text: 'carbon taxes and cap-and-trade systems', source: 'NOTES1:chunk2' },
        { text: 'solar and wind power have become increasingly cost-competitive', source: 'NOTES2:chunk1' }
      ],
      [
        { text: 'Paris Agreement represents a landmark international effort', source: 'REF1:p2' }
      ],
      [
        { text: 'infrastructure improvements, agricultural modifications, and coastal protection measures', source: 'REF2:p5' }
      ]
    ];
    
    const unsupportedFlags = [
      [
        { sentence: 'This trend will continue unless immediate action is taken.', reason: 'No specific data provided about future trends' }
      ],
      [],
      [
        { sentence: 'However, the effectiveness of such agreements depends on strong enforcement mechanisms and continued commitment from participating nations.', reason: 'No information provided about enforcement mechanisms' }
      ],
      [
        { sentence: 'The transition to a low-carbon economy presents both challenges and opportunities for economic development and job creation.', reason: 'No specific data about job creation opportunities' }
      ]
    ];
    
    const index = request.paragraphIndex;
    
    return {
      paragraphText: paragraphTexts[index] || 'Paragraph content not available.',
      usedChunks: usedChunks[index] || [],
      citations: citations[index] || [],
      unsupportedFlags: unsupportedFlags[index] || []
    };
  },

  /**
   * Analyze references for relevance and select the most appropriate ones
   * 
   * Example request:
   * POST /api/references/analyze
   * {
   *   "prompt": "Discuss the impact of climate change on global economies",
   *   "essayTopic": "Climate Change Economics",
   *   "assignmentTitle": "Climate Change Economics Essay",
   *   "references": [
   *     {
   *       "id": "file_001",
   *       "name": "Climate Change Research.pdf",
   *       "excerpt": "Climate change represents one of the most pressing challenges...",
   *       "content": "Full content of the reference..."
   *     }
   *   ]
   * }
   * 
   * Example response:
   * {
   *   "analysis": {
   *     "file_001": {
   *       "relevanceScore": 95,
   *       "keyTopics": ["climate change", "economic impact", "policy"],
   *       "summary": "Highly relevant research on climate change economics...",
   *       "confidence": 92
   *     }
   *   },
   *   "smartSelection": {
   *     "selectedReferences": ["file_001", "file_002"],
   *     "excludedReferences": ["file_003"],
   *     "reasoning": "Selected references focus on economic aspects and policy implications...",
   *     "totalReferences": 3,
   *     "selectedCount": 2
   *   }
   * }
   */
  async analyzeReferences(request: AnalyzeReferencesRequest): Promise<AnalyzeReferencesResponse> {
    await delay(2500); // Simulate AI analysis time
    
    const analysis: Record<string, any> = {};
    const selectedReferences: string[] = [];
    const excludedReferences: string[] = [];
    
    // Generate mock analysis for each reference
    request.references.forEach((ref, index) => {
      // Simulate relevance scoring based on content analysis
      const baseScore = 60 + Math.random() * 35; // 60-95 range
      const relevanceScore = Math.round(baseScore);
      
      // Generate key topics based on the reference content
      const topicKeywords = [
        'climate change', 'economics', 'policy', 'sustainability', 'environment',
        'renewable energy', 'carbon emissions', 'global warming', 'adaptation',
        'mitigation', 'international cooperation', 'green technology'
      ];
      
      const keyTopics = topicKeywords
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 + Math.floor(Math.random() * 3));
      
      // Generate summary based on relevance score
      let summary = '';
      if (relevanceScore >= 85) {
        summary = `Highly relevant to your essay topic. This reference provides strong evidence and detailed analysis that directly supports your argument about ${request.essayTopic.toLowerCase()}.`;
      } else if (relevanceScore >= 70) {
        summary = `Moderately relevant to your essay. Contains useful information about ${request.essayTopic.toLowerCase()} but may require careful integration with your main argument.`;
      } else if (relevanceScore >= 55) {
        summary = `Somewhat relevant to your topic. Provides background information that could be useful for context but may not directly support your main points.`;
      } else {
        summary = `Limited relevance to your essay topic. Contains some related information but may not be essential for your argument.`;
      }
      
      analysis[ref.id] = {
        relevanceScore,
        keyTopics,
        summary,
        confidence: Math.round(85 + Math.random() * 15) // 85-100 range
      };
      
      // Select references based on relevance score
      if (relevanceScore >= 70) {
        selectedReferences.push(ref.id);
      } else {
        excludedReferences.push(ref.id);
      }
    });
    
    // Generate reasoning for selection
    const selectedCount = selectedReferences.length;
    const totalCount = request.references.length;
    
    let reasoning = '';
    if (selectedCount === totalCount) {
      reasoning = `All ${totalCount} references are highly relevant to your essay topic "${request.essayTopic}". Each reference provides valuable evidence and insights that will strengthen your argument.`;
    } else if (selectedCount > 0) {
      reasoning = `Selected ${selectedCount} of ${totalCount} references based on their relevance to your essay topic "${request.essayTopic}". The chosen references provide the strongest evidence and most direct support for your argument, while excluding less relevant sources to maintain focus and quality.`;
    } else {
      reasoning = `None of the uploaded references are highly relevant to your essay topic "${request.essayTopic}". Consider uploading more specific sources that directly relate to your topic, or adjust your essay focus to better align with your available references.`;
    }
    
    return {
      analysis,
      smartSelection: {
        selectedReferences,
        excludedReferences,
        reasoning,
        totalReferences: totalCount,
        selectedCount
      }
    };
  },

  /**
   * Generate full draft with bibliography
   * 
   * Example request:
   * POST /api/draft/generate
   * {
   *   "outlineId": "outline_123",
   *   "includeReferences": true,
   *   "citationStyle": "apa"
   * }
   * 
   * Example response:
   * {
   *   "essayText": "Climate change poses significant economic challenges...",
   *   "bibliography": "References\n\nSmith, J. (2023). Climate Change Economics...",
   *   "metadata": {
   *     "totalWords": 847,
   *     "citationsCount": 6,
   *     "chunksUsed": 6
   *   }
   * }
   */
  async generateFullDraft(request: GenerateFullDraftRequest): Promise<GenerateFullDraftResponse> {
    await delay(4000);
    
    const essayText = `Climate change poses significant economic challenges that require immediate policy responses and international cooperation to mitigate long-term costs and ensure sustainable development.

Climate change represents one of the most pressing economic challenges of our time, with far-reaching implications for global markets, supply chains, and financial systems. The scientific consensus on climate change is overwhelming, with 97% of climate scientists agreeing that human activities are the primary driver of recent warming trends (DOC1:p3). Greenhouse gas concentrations have increased dramatically since the Industrial Revolution, with CO2 levels rising from 280 ppm to over 400 ppm, creating unprecedented environmental and economic pressures (DOC1:p7).

Effective policy responses to climate change require comprehensive approaches that address both mitigation and adaptation strategies. Carbon pricing mechanisms include carbon taxes and cap-and-trade systems, both designed to internalize the external costs of carbon emissions and incentivize cleaner technologies (NOTES1:chunk2). Renewable energy sources such as solar and wind power have become increasingly cost-competitive with fossil fuels in recent years, offering viable alternatives for sustainable economic growth (NOTES2:chunk1).

International cooperation is essential for addressing the global nature of climate change and ensuring coordinated policy responses. The Paris Agreement represents a landmark international effort to limit global temperature rise to well below 2°C above pre-industrial levels, demonstrating the potential for multilateral environmental governance (REF1:p2).

Adaptation strategies for climate change include infrastructure improvements, agricultural modifications, and coastal protection measures that can help societies prepare for inevitable climate impacts (REF2:p5). These strategies require significant investment but can reduce long-term economic costs and improve resilience.

In conclusion, addressing climate change requires a multifaceted approach that combines immediate policy action, international cooperation, and long-term adaptation strategies. The economic costs of inaction far exceed the investments needed for mitigation and adaptation, making climate action not just an environmental imperative but an economic necessity.`;

    const bibliography = request.includeReferences ? `References

Climate Research Institute. (2023). Climate Change Research: Economic Implications. Environmental Studies Journal, 45(3), 123-145.

Environmental Policy Center. (2023). Carbon Pricing Mechanisms and Policy Implementation. Policy Review, 12(2), 67-89.

International Climate Organization. (2023). The Paris Agreement: Implementation and Progress. Global Environmental Policy, 8(4), 201-220.

Sustainability Research Group. (2023). Adaptation Strategies for Climate Change. Environmental Adaptation Quarterly, 15(1), 45-62.` : '';

    return {
      essayText,
      bibliography,
      metadata: {
        totalWords: 847,
        citationsCount: 6,
        chunksUsed: 6
      }
    };
  }
};

export default mockApi;
