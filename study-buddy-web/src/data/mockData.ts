import { Note, Flashcard, ChatMessage, Essay, SubscriptionPlan, UserSubscription, UsageStats } from '@/types/study';

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'React Fundamentals',
    content: 'React is a JavaScript library for building user interfaces. It uses a virtual DOM to efficiently update the UI. Components are the building blocks of React applications. Props allow data to be passed down from parent to child components. State allows components to manage their own data and re-render when it changes.',
    summary: 'React is a JavaScript library for building UIs using components, props, and state.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Machine Learning Basics',
    content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. There are three main types: supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and error with rewards).',
    summary: 'Machine learning enables computers to learn from data through supervised, unsupervised, and reinforcement learning approaches.',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    title: 'Photosynthesis Process',
    content: 'Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions (which capture light energy and convert it to ATP and NADPH) and the light-independent reactions or Calvin cycle (which uses ATP and NADPH to convert carbon dioxide into glucose).',
    summary: 'Photosynthesis converts light energy to chemical energy in two stages: light-dependent reactions and the Calvin cycle.',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
  },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    question: 'What is React?',
    answer: 'A JavaScript library for building user interfaces',
    noteId: '1',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: '2',
    question: 'What is the virtual DOM?',
    answer: 'A JavaScript representation of the real DOM that React uses to efficiently update the UI',
    noteId: '1',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: '3',
    question: 'What are the three types of machine learning?',
    answer: 'Supervised learning, unsupervised learning, and reinforcement learning',
    noteId: '2',
    createdAt: '2024-01-14T15:00:00Z',
  },
  {
    id: '4',
    question: 'Where does photosynthesis occur?',
    answer: 'In the chloroplasts of plant cells',
    noteId: '3',
    createdAt: '2024-01-13T10:00:00Z',
  },
  {
    id: '5',
    question: 'What are the two main stages of photosynthesis?',
    answer: 'Light-dependent reactions and light-independent reactions (Calvin cycle)',
    noteId: '3',
    createdAt: '2024-01-13T10:00:00Z',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you explain the difference between supervised and unsupervised learning?',
    timestamp: '2024-01-15T12:00:00Z',
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs. The algorithm learns from examples where the correct answers are provided. Examples include classification (predicting categories) and regression (predicting numerical values).\n\nUnsupervised learning finds hidden patterns in data without labeled examples. The algorithm explores the data structure on its own. Examples include clustering (grouping similar data points) and dimensionality reduction (simplifying data while preserving important information).',
    timestamp: '2024-01-15T12:01:00Z',
  },
  {
    id: '3',
    role: 'user',
    content: 'What are some real-world applications of each?',
    timestamp: '2024-01-15T12:05:00Z',
  },
  {
    id: '4',
    role: 'assistant',
    content: '**Supervised Learning Applications:**\n- Email spam detection (classification)\n- House price prediction (regression)\n- Medical diagnosis from symptoms\n- Image recognition and tagging\n\n**Unsupervised Learning Applications:**\n- Customer segmentation for marketing\n- Anomaly detection in cybersecurity\n- Recommendation systems (finding similar users/items)\n- Data compression and visualization',
    timestamp: '2024-01-15T12:06:00Z',
  },
];

export const mockEssays: Essay[] = [
  {
    id: '1',
    title: 'The Impact of Artificial Intelligence on Modern Society',
    prompt: 'Discuss the positive and negative impacts of AI on society',
    content: 'Artificial Intelligence (AI) has become one of the most transformative technologies of the 21st century, reshaping industries, economies, and daily life. While AI offers tremendous benefits, it also presents significant challenges that society must address.\n\n**Positive Impacts:**\nAI has revolutionized healthcare through improved diagnostics, drug discovery, and personalized treatment plans. In education, AI-powered tutoring systems provide personalized learning experiences. Businesses benefit from AI through automation, predictive analytics, and enhanced customer service.\n\n**Negative Impacts:**\nHowever, AI also raises concerns about job displacement, privacy violations, and algorithmic bias. The automation of routine tasks threatens traditional employment, while AI systems can perpetuate existing societal biases if not carefully designed.\n\n**Conclusion:**\nThe key to maximizing AI\'s benefits while minimizing its risks lies in responsible development, ethical guidelines, and continuous monitoring of its societal impact.',
    wordCount: 156,
    createdAt: '2024-01-12T16:30:00Z',
    updatedAt: '2024-01-12T16:30:00Z',
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: [
      '5 notes per month',
      '25 flashcards per month',
      '10 AI questions per day',
      '1 essay per month',
      'Basic summaries'
    ],
    maxNotes: 5,
    maxFlashcards: 25,
    aiQuestionsPerDay: 10,
    maxEssays: 1,
    cameraScanning: false,
    aiEnhancedCards: false,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Unlimited essays',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support'
    ],
    maxNotes: -1,
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    maxEssays: -1,
    cameraScanning: true,
    aiEnhancedCards: true,
  },
  {
    id: 'pro_yearly',
    name: 'Pro (Yearly)',
    price: 99.99,
    interval: 'yearly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Unlimited essays',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support',
      '2 months free!'
    ],
    maxNotes: -1,
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    maxEssays: -1,
    cameraScanning: true,
    aiEnhancedCards: true,
  },
];

export const mockSubscription: UserSubscription = {
  id: '1',
  planId: 'free',
  status: 'active',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  autoRenew: false,
};

export const mockUsageStats: UsageStats = {
  notesCreated: 3,
  flashcardsGenerated: 5,
  aiQuestionsAsked: 2,
  essaysGenerated: 1,
  lastResetDate: '2024-01-01T00:00:00Z',
};
