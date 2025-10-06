/**
 * Unit Tests for Grounded Essay Writer Component
 * 
 * These tests verify the core functionality of the essay writer component
 * including file upload, configuration, and generation workflows.
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GroundedEssayWriter from '../app/(tabs)/essay-writer';
import { mockApi } from '../services/mockApi';
import { validationUtils } from '../utils/essayWriterUtils';

// Mock dependencies
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
  Share: {
    share: jest.fn(),
  },
}));

jest.mock('../services/mockApi', () => ({
  mockApi: {
    uploadFile: jest.fn(),
    pasteText: jest.fn(),
    generateOutline: jest.fn(),
    expandParagraph: jest.fn(),
  },
}));

// Mock the utility functions
jest.mock('../utils/essayWriterUtils', () => ({
  validationUtils: {
    validatePrompt: jest.fn(),
    validateWordCount: jest.fn(),
    validateFileUpload: jest.fn(),
  },
}));

describe('GroundedEssayWriter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (validationUtils.validatePrompt as jest.Mock).mockReturnValue({ valid: true });
    (validationUtils.validateWordCount as jest.Mock).mockReturnValue({ valid: true });
    (validationUtils.validateFileUpload as jest.Mock).mockReturnValue({ valid: true });
  });

  describe('Initial Render', () => {
    it('renders the main title and subtitle', () => {
      render(<GroundedEssayWriter />);
      
      expect(screen.getByText('Grounded Essay Writer')).toBeTruthy();
      expect(screen.getByText('Create well-researched essays using your materials')).toBeTruthy();
    });

    it('shows the materials step by default', () => {
      render(<GroundedEssayWriter />);
      
      expect(screen.getByText(/Upload readings, notes, or paste text/)).toBeTruthy();
      expect(screen.getByText('Relevant Notes')).toBeTruthy();
      expect(screen.getByText('References')).toBeTruthy();
    });

    it('displays step indicator with correct initial state', () => {
      render(<GroundedEssayWriter />);
      
      // Check that step 1 is active
      const step1 = screen.getByText('1');
      expect(step1).toBeTruthy();
    });
  });

  describe('Materials Step', () => {
    it('allows navigation to configure step when files are present', async () => {
      render(<GroundedEssayWriter />);
      
      // Mock file upload
      const mockFile = {
        id: 'file_001',
        group: 'notes' as const,
        name: 'test.txt',
        excerpt: 'Test content...',
        priority: false,
        order: 0,
        type: 'file' as const,
      };

      (mockApi.uploadFile as jest.Mock).mockResolvedValue({
        fileId: 'file_001',
        fileName: 'test.txt',
        fileType: 'text/plain',
        excerpt: 'Test content...',
      });

      // Simulate file upload (this would normally be triggered by file picker)
      // For testing, we'll directly test the state management
      const continueButton = screen.getByText('Continue to Configuration');
      expect(continueButton).toBeTruthy();
    });

    it('disables continue button when no files are uploaded', () => {
      render(<GroundedEssayWriter />);
      
      const continueButton = screen.getByText('Continue to Configuration');
      expect(continueButton.props.disabled).toBe(true);
    });
  });

  describe('Configuration Step', () => {
    beforeEach(() => {
      // Mock having files uploaded
      const { rerender } = render(<GroundedEssayWriter />);
      
      // Simulate moving to configure step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      rerender(<GroundedEssayWriter />);
    });

    it('renders all configuration options', () => {
      expect(screen.getByText('Configure your essay parameters')).toBeTruthy();
      expect(screen.getByText('Assignment Title (Optional)')).toBeTruthy();
      expect(screen.getByText('Required Question / Prompt *')).toBeTruthy();
      expect(screen.getByText('Word Count')).toBeTruthy();
      expect(screen.getByText('Academic Level')).toBeTruthy();
      expect(screen.getByText('Citation Style')).toBeTruthy();
      expect(screen.getByText('Generation Mode')).toBeTruthy();
    });

    it('allows setting word count via preset buttons', () => {
      const wordCountButtons = [250, 500, 800, 1200];
      
      wordCountButtons.forEach(count => {
        const button = screen.getByText(count.toString());
        expect(button).toBeTruthy();
        fireEvent.press(button);
      });
    });

    it('allows custom word count input', () => {
      const customInput = screen.getByPlaceholderText('Custom word count');
      expect(customInput).toBeTruthy();
      
      fireEvent.changeText(customInput, '1000');
      expect(customInput.props.value).toBe('1000');
    });

    it('requires integrity checkbox to be checked before generation', () => {
      const generateButton = screen.getByText('Generate Outline');
      expect(generateButton.props.disabled).toBe(true);
      
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      fireEvent.press(integrityCheckbox);
      
      // Button should still be disabled until prompt is entered
      expect(generateButton.props.disabled).toBe(true);
    });

    it('enables generate button when prompt is entered and integrity is checked', () => {
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      const generateButton = screen.getByText('Generate Outline');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      expect(generateButton.props.disabled).toBe(false);
    });
  });

  describe('Generation and Review Step', () => {
    beforeEach(() => {
      // Mock successful outline generation
      (mockApi.generateOutline as jest.Mock).mockResolvedValue({
        outlineId: 'outline_123',
        thesis: 'Test thesis statement',
        paragraphs: [
          {
            title: 'Introduction',
            intendedChunks: [{ label: 'DOC1:p1', excerpt: 'Test excerpt' }],
            suggestedWordCount: 200,
          },
          {
            title: 'Body Paragraph',
            intendedChunks: [{ label: 'DOC1:p2', excerpt: 'Test excerpt 2' }],
            suggestedWordCount: 300,
          },
        ],
        metadata: { retrievedCount: 2 },
      });

      (mockApi.expandParagraph as jest.Mock).mockResolvedValue({
        paragraphText: 'This is the expanded paragraph content with citations (DOC1:p1).',
        usedChunks: [{ label: 'DOC1:p1', page: 1 }],
        citations: [{ text: 'citations', source: 'DOC1:p1' }],
        unsupportedFlags: [],
      });
    });

    it('generates outline when generate button is pressed', async () => {
      render(<GroundedEssayWriter />);
      
      // Navigate to configure step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      // Fill required fields
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      // Generate outline
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        expect(mockApi.generateOutline).toHaveBeenCalledWith({
          prompt: 'Test essay prompt',
          wordCount: 800,
          level: 'undergraduate',
          citationStyle: 'apa',
          mode: 'grounded',
          fileIds: [],
          rubric: '',
        });
      });
    });

    it('displays generated outline with thesis and paragraphs', async () => {
      render(<GroundedEssayWriter />);
      
      // Navigate through steps to generation
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test thesis statement')).toBeTruthy();
        expect(screen.getByText('1. Introduction')).toBeTruthy();
        expect(screen.getByText('2. Body Paragraph')).toBeTruthy();
      });
    });

    it('allows expanding individual paragraphs', async () => {
      render(<GroundedEssayWriter />);
      
      // Navigate to generation step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        const expandButton = screen.getByText('Expand Paragraph');
        fireEvent.press(expandButton);
      });
      
      await waitFor(() => {
        expect(mockApi.expandParagraph).toHaveBeenCalledWith({
          outlineId: 'outline_123',
          paragraphIndex: 0,
        });
      });
    });

    it('displays expanded paragraph content with citations', async () => {
      render(<GroundedEssayWriter />);
      
      // Navigate to generation step and expand paragraph
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        const expandButton = screen.getByText('Expand Paragraph');
        fireEvent.press(expandButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/This is the expanded paragraph content/)).toBeTruthy();
        expect(screen.getByText('Citations used:')).toBeTruthy();
      });
    });
  });

  describe('Export Functionality', () => {
    it('provides export options when essay is generated', async () => {
      render(<GroundedEssayWriter />);
      
      // Navigate to generation step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Export Options')).toBeTruthy();
        expect(screen.getByText('Copy to Clipboard')).toBeTruthy();
        expect(screen.getByText('Download as DOCX')).toBeTruthy();
        expect(screen.getByText('Download as PDF')).toBeTruthy();
        expect(screen.getByText('Copy with Citations')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error alert when outline generation fails', async () => {
      (mockApi.generateOutline as jest.Mock).mockRejectedValue(new Error('Generation failed'));
      
      render(<GroundedEssayWriter />);
      
      // Navigate to configure step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to generate outline');
      });
    });

    it('shows error alert when paragraph expansion fails', async () => {
      (mockApi.expandParagraph as jest.Mock).mockRejectedValue(new Error('Expansion failed'));
      
      render(<GroundedEssayWriter />);
      
      // Navigate to generation step
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      const integrityCheckbox = screen.getByText('I will use this for study/learning only');
      
      fireEvent.changeText(promptInput, 'Test essay prompt');
      fireEvent.press(integrityCheckbox);
      
      const generateButton = screen.getByText('Generate Outline');
      fireEvent.press(generateButton);
      
      await waitFor(() => {
        const expandButton = screen.getByText('Expand Paragraph');
        fireEvent.press(expandButton);
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to expand paragraph');
      });
    });
  });

  describe('Validation', () => {
    it('validates prompt input', () => {
      (validationUtils.validatePrompt as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Essay prompt is required',
      });
      
      render(<GroundedEssayWriter />);
      
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
      fireEvent.changeText(promptInput, '');
      
      // Validation should be called
      expect(validationUtils.validatePrompt).toHaveBeenCalledWith('');
    });

    it('validates word count input', () => {
      (validationUtils.validateWordCount as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Word count must be at least 100 words',
      });
      
      render(<GroundedEssayWriter />);
      
      const continueButton = screen.getByText('Continue to Configuration');
      fireEvent.press(continueButton);
      
      const customInput = screen.getByPlaceholderText('Custom word count');
      fireEvent.changeText(customInput, '50');
      
      // Validation should be called
      expect(validationUtils.validateWordCount).toHaveBeenCalledWith(50);
    });
  });
});

// Integration test for the complete workflow
describe('GroundedEssayWriter Integration', () => {
  it('completes the full essay generation workflow', async () => {
    // Mock all API calls
    (mockApi.generateOutline as jest.Mock).mockResolvedValue({
      outlineId: 'outline_123',
      thesis: 'Integration test thesis',
      paragraphs: [
        {
          title: 'Test Paragraph',
          intendedChunks: [{ label: 'DOC1:p1', excerpt: 'Test excerpt' }],
          suggestedWordCount: 200,
        },
      ],
      metadata: { retrievedCount: 1 },
    });

    (mockApi.expandParagraph as jest.Mock).mockResolvedValue({
      paragraphText: 'Integration test paragraph content.',
      usedChunks: [{ label: 'DOC1:p1', page: 1 }],
      citations: [{ text: 'test content', source: 'DOC1:p1' }],
      unsupportedFlags: [],
    });

    render(<GroundedEssayWriter />);

    // Step 1: Materials (skip file upload for integration test)
    const continueButton = screen.getByText('Continue to Configuration');
    fireEvent.press(continueButton);

    // Step 2: Configuration
    const promptInput = screen.getByPlaceholderText('Enter your essay prompt or question...');
    const integrityCheckbox = screen.getByText('I will use this for study/learning only');
    
    fireEvent.changeText(promptInput, 'Integration test prompt');
    fireEvent.press(integrityCheckbox);

    const generateButton = screen.getByText('Generate Outline');
    fireEvent.press(generateButton);

    // Step 3: Generation
    await waitFor(() => {
      expect(screen.getByText('Integration test thesis')).toBeTruthy();
    });

    const expandButton = screen.getByText('Expand Paragraph');
    fireEvent.press(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/Integration test paragraph content/)).toBeTruthy();
    });

    // Verify export options are available
    expect(screen.getByText('Export Options')).toBeTruthy();
  });
});
