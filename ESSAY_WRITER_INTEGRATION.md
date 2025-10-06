# Grounded Essay Writer - Integration Guide

## Overview

The Grounded Essay Writer is a production-ready feature that allows students to create well-researched essays using their uploaded materials. The feature includes a complete UI with file upload, configuration options, and essay generation with inline citations.

## Features Implemented

### ✅ Core Functionality
- **Three-step workflow**: Materials → Configure → Generate & Review
- **File upload support**: TXT, DOCX, PDF, PNG/JPG (with OCR placeholder)
- **Text pasting**: Direct text input and URL text extraction
- **Material organization**: Separate groups for "Relevant Notes" and "References"
- **Priority system**: Mark important sources and reorder materials
- **Configuration options**: Word count, academic level, citation style, generation mode
- **Integrity checkbox**: Required confirmation for ethical use
- **Two-step generation**: Outline generation followed by paragraph expansion
- **Inline citations**: Proper citation formatting with source tracking
- **Unsupported content detection**: Flags content not supported by materials
- **Export options**: Copy to clipboard, download as DOCX/PDF, copy with citations

### ✅ Technical Implementation
- **React Native components**: Fully responsive and accessible
- **Mock API service**: Realistic responses for testing and development
- **Prompt templates**: Ready-to-use LLM prompts for backend integration
- **Utility functions**: File handling, text processing, validation, and export
- **Unit tests**: Comprehensive test coverage for all major functionality
- **TypeScript**: Full type safety and IntelliSense support

## File Structure

```
app/(tabs)/
├── essay-writer.tsx          # Main component
services/
├── mockApi.ts               # Mock API service
utils/
├── promptTemplates.ts       # LLM prompt templates
├── essayWriterUtils.ts      # Utility functions
__tests__/
├── GroundedEssayWriter.test.tsx  # Unit tests
```

## Quick Start

1. **Navigate to the Essay Writer**: The feature is available as a new tab in the app
2. **Upload Materials**: Add files or paste text into Notes and References groups
3. **Configure Essay**: Set word count, academic level, citation style, and mode
4. **Generate Outline**: Review thesis and paragraph structure
5. **Expand Paragraphs**: Generate full content with citations
6. **Export Results**: Copy or download the completed essay

## Backend Integration

### Replacing Mock API with Real Endpoints

To integrate with your backend, replace the mock API calls in `services/mockApi.ts`:

```typescript
// Replace this:
const response = await mockApi.generateOutline(request);

// With this:
const response = await fetch('/api/outline/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
}).then(res => res.json());
```

### Required API Endpoints

1. **File Upload**: `POST /api/files/upload`
2. **Text Processing**: `POST /api/text/paste`
3. **File Ingestion**: `POST /api/ingest/start` + `GET /api/ingest/status/{jobId}`
4. **Outline Generation**: `POST /api/outline/generate`
5. **Paragraph Expansion**: `POST /api/paragraph/expand`
6. **Full Draft Generation**: `POST /api/draft/generate`

### LLM Integration

Use the prompt templates in `utils/promptTemplates.ts` with your LLM service:

```typescript
import { promptTemplates, replaceTemplateVariables } from '../utils/promptTemplates';

const prompt = replaceTemplateVariables(promptTemplates.outline, {
  prompt: userPrompt,
  word_count: wordCount,
  academic_level: academicLevel,
  citation_style: citationStyle,
  mode: mode,
  retrieved_chunks: formattedChunks
});

const response = await yourLLMService.generate(prompt);
```

## Testing

### Run Unit Tests
```bash
npm test GroundedEssayWriter.test.tsx
```

### Manual Testing Workflow
1. Open the Essay Writer tab
2. Upload a sample text file or paste content
3. Configure essay parameters
4. Generate outline and review thesis
5. Expand paragraphs and check citations
6. Test export functionality

### End-to-End Test Sequence
```typescript
// 1. Upload materials
await uploadFile('notes', 'sample.txt');
await pasteText('references', 'Sample reference content');

// 2. Configure essay
setPrompt('Discuss the impact of climate change');
setWordCount(800);
setAcademicLevel('undergraduate');
setCitationStyle('apa');
setIntegrityChecked(true);

// 3. Generate outline
const outline = await generateOutline();

// 4. Expand paragraphs
await expandParagraph(0);
await expandParagraph(1);

// 5. Export results
await copyToClipboard();
await downloadAsDocx();
```

## Configuration Options

### Academic Levels
- `high-school`: Basic concepts, simple language
- `undergraduate`: Intermediate complexity, academic tone
- `graduate`: Advanced analysis, sophisticated arguments
- `professional`: Expert-level content, industry terminology

### Citation Styles
- `apa`: American Psychological Association
- `mla`: Modern Language Association
- `harvard`: Harvard referencing system
- `chicago`: Chicago Manual of Style

### Generation Modes
- `grounded`: Use only provided materials
- `mixed`: Supplement with general knowledge
- `teach`: Educational focus with explanations

## Customization

### Styling
The component uses Tailwind CSS classes that can be customized in your app's theme:

```typescript
// Update colors in constants/colors.ts
export const colors = {
  primary: '#3b82f6',      // Blue for primary actions
  secondary: '#059669',    // Green for references
  warning: '#f59e0b',      // Yellow for unsupported content
  // ... other colors
};
```

### Copy and Text
All user-facing text is defined in the `COPY` constant at the top of the component and can be easily modified.

### Validation Rules
Update validation logic in `utils/essayWriterUtils.ts`:

```typescript
export const validationUtils = {
  validatePrompt: (prompt: string) => {
    // Custom validation logic
  },
  validateWordCount: (wordCount: number) => {
    // Custom word count limits
  }
};
```

## Performance Considerations

- **File Size Limits**: Currently set to 10MB per file
- **Chunk Processing**: Large files are processed in chunks for better performance
- **Caching**: Consider implementing response caching for repeated requests
- **Progressive Loading**: Paragraphs are expanded on-demand to improve initial load time

## Security Notes

- **File Validation**: All uploaded files are validated for type and size
- **Content Sanitization**: User input is sanitized before processing
- **Integrity Check**: Required confirmation for ethical use
- **No External APIs**: All processing happens locally or through your controlled backend

## Troubleshooting

### Common Issues

1. **File Upload Fails**: Check file type and size limits
2. **Generation Timeout**: Increase timeout for large documents
3. **Citation Formatting**: Verify citation style templates
4. **Export Issues**: Check file system permissions

### Debug Mode
Enable debug logging by setting `DEBUG=expo*` in your environment.

## Future Enhancements

- **Real-time Collaboration**: Multiple users editing the same essay
- **Version History**: Track changes and revisions
- **Advanced Analytics**: Writing quality metrics and suggestions
- **Template Library**: Pre-built essay templates for common assignments
- **Integration**: Connect with learning management systems

## Support

For technical support or feature requests, please refer to the main project documentation or create an issue in the project repository.
