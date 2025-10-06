/**
 * Prompt Templates for Grounded Essay Writer
 * 
 * These templates define the exact prompts that will be sent to the LLM
 * for generating outlines, expanding paragraphs, and creating full drafts.
 * 
 * Replace placeholders with actual values when calling your LLM service.
 * 
 * Template Variables:
 * - {retrieved_chunks}: Formatted chunks from uploaded materials
 * - {citation_style}: APA, MLA, Harvard, or Chicago
 * - {word_count}: Target word count for the essay
 * - {academic_level}: high-school, undergraduate, graduate, or professional
 * - {rubric}: Assignment title or rubric (optional)
 * - {mode}: grounded, mixed, or teach
 * - {prompt}: The essay question/prompt from the user
 * - {essay_topic}: Description of what the essay is about
 * - {sample_essay}: Sample essay content for style matching (optional)
 * - {paragraph_title}: Title of the paragraph to expand
 * - {intended_chunks}: Specific chunks to use for this paragraph
 * - {outline_id}: Unique identifier for the outline
 * - {include_references}: Boolean for whether to include bibliography
 */

export const promptTemplates = {
  /**
   * Template for generating essay outlines
   * 
   * This prompt instructs the LLM to create a structured outline
   * using only the provided materials when in grounded mode.
   */
  outline: `You are an expert academic writing assistant. Generate a detailed essay outline based on the provided materials and requirements.

**Assignment Details:**
- Question/Prompt: {prompt}
- Essay Topic: {essay_topic}
- Target Word Count: {word_count} words
- Academic Level: {academic_level}
- Citation Style: {citation_style}
- Mode: {mode}
- Assignment Title: {rubric}

**Available Materials:**
{retrieved_chunks}

**Sample Essay for Style Matching:**
{sample_essay}

**Instructions:**
1. Create a clear, arguable thesis statement that directly addresses the prompt and essay topic
2. Develop 3-5 main body paragraphs, each with:
   - A descriptive title
   - 2-3 specific chunks from the materials that support this paragraph
   - Suggested word count (aim for roughly equal distribution)
3. Ensure logical flow and progression of ideas
4. When mode is "grounded", use ONLY the provided materials - do not add external knowledge
5. When mode is "mixed", you may supplement with general knowledge but prioritize provided materials
6. When mode is "teach", explain concepts clearly and provide educational context
7. If a sample essay is provided, analyze its writing style, tone, structure, and vocabulary to match in the generated content

**Output Format:**
Return a JSON object with:
- thesis: The main argument in 1-2 sentences
- paragraphs: Array of objects with title, intendedChunks (array of chunk labels), and suggestedWordCount
- metadata: Object with retrievedCount (number of chunks available)

**Example Response:**
{
  "thesis": "Climate change poses significant economic challenges that require immediate policy responses and international cooperation to mitigate long-term costs and ensure sustainable development.",
  "paragraphs": [
    {
      "title": "Economic Costs of Climate Change",
      "intendedChunks": ["DOC1:p3", "DOC1:p7"],
      "suggestedWordCount": 200
    }
  ],
  "metadata": {
    "retrievedCount": 6
  }
}`,

  /**
   * Template for expanding individual paragraphs
   * 
   * This prompt instructs the LLM to write a full paragraph using
   * the specified chunks and maintaining academic writing standards.
   */
  paragraphExpansion: `You are an expert academic writer. Expand the following paragraph using the specified materials and maintaining high academic standards.

**Paragraph to Expand:**
Title: {paragraph_title}
Target Word Count: {suggested_word_count} words
Citation Style: {citation_style}
Academic Level: {academic_level}

**Materials to Use:**
{intended_chunks}

**Instructions:**
1. Write a well-structured paragraph that develops the topic thoroughly
2. Use the provided chunks as evidence and support for your arguments
3. Include inline citations in the format: (SOURCE_LABEL)
4. Maintain academic tone appropriate for {academic_level} level
5. Ensure smooth transitions and logical flow
6. If you cannot support a claim with the provided materials, mark it with [UNSUPPORTED] and provide a brief reason
7. When mode is "grounded", use ONLY the provided chunks
8. When mode is "mixed", you may add general knowledge but prioritize provided chunks
9. When mode is "teach", explain concepts clearly for educational purposes

**Output Format:**
Return a JSON object with:
- paragraphText: The full paragraph text with inline citations
- usedChunks: Array of chunk labels actually used
- citations: Array of objects with text and source for each citation
- unsupportedFlags: Array of objects with sentence and reason for unsupported claims

**Example Response:**
{
  "paragraphText": "Climate change represents one of the most pressing economic challenges of our time (DOC1:p3). The scientific consensus is overwhelming, with 97% of climate scientists agreeing that human activities are the primary driver of recent warming trends (DOC1:p3). [UNSUPPORTED: No specific data provided about future trends] This trend will continue unless immediate action is taken.",
  "usedChunks": [
    {
      "label": "DOC1:p3",
      "page": 3
    }
  ],
  "citations": [
    {
      "text": "scientific consensus on climate change",
      "source": "DOC1:p3"
    }
  ],
  "unsupportedFlags": [
    {
      "sentence": "This trend will continue unless immediate action is taken.",
      "reason": "No specific data provided about future trends"
    }
  ]
}`,

  /**
   * Template for generating full drafts with bibliography
   * 
   * This prompt creates a complete essay with proper formatting
   * and bibliography when requested.
   */
  fullDraft: `You are an expert academic writer. Generate a complete, well-structured essay based on the provided outline and materials.

**Essay Requirements:**
- Word Count: {word_count} words
- Academic Level: {academic_level}
- Citation Style: {citation_style}
- Include References: {include_references}
- Mode: {mode}

**Thesis Statement:**
{thesis}

**Paragraph Structure:**
{paragraph_outline}

**Available Materials:**
{retrieved_chunks}

**Instructions:**
1. Write a complete essay that flows logically from introduction to conclusion
2. Use the provided materials as evidence and support
3. Include inline citations in the specified format
4. Maintain consistent academic tone throughout
5. Ensure proper paragraph structure and transitions
6. When mode is "grounded", use ONLY the provided materials
7. When mode is "mixed", supplement with general knowledge but prioritize provided materials
8. When mode is "teach", provide clear explanations and educational context
9. Mark any unsupported claims with [UNSUPPORTED] and provide brief reasons
10. If include_references is true, generate a properly formatted bibliography

**Output Format:**
Return a JSON object with:
- essayText: Complete essay with inline citations
- bibliography: Formatted reference list (if include_references is true)
- metadata: Object with totalWords, citationsCount, and chunksUsed

**Example Response:**
{
  "essayText": "Climate change poses significant economic challenges that require immediate policy responses and international cooperation to mitigate long-term costs and ensure sustainable development.\n\nClimate change represents one of the most pressing economic challenges of our time, with far-reaching implications for global markets, supply chains, and financial systems. The scientific consensus on climate change is overwhelming, with 97% of climate scientists agreeing that human activities are the primary driver of recent warming trends (DOC1:p3)...",
  "bibliography": "References\n\nClimate Research Institute. (2023). Climate Change Research: Economic Implications. Environmental Studies Journal, 45(3), 123-145.\n\nEnvironmental Policy Center. (2023). Carbon Pricing Mechanisms and Policy Implementation. Policy Review, 12(2), 67-89.",
  "metadata": {
    "totalWords": 847,
    "citationsCount": 6,
    "chunksUsed": 6
  }
}`,

  /**
   * Template for chunk formatting
   * 
   * This template shows how to format retrieved chunks for inclusion in prompts
   */
  chunkFormat: `**{chunk_label}**
{chunk_excerpt}

---`,

  /**
   * Template for paragraph outline formatting
   * 
   * This template shows how to format paragraph information for full draft generation
   */
  paragraphOutlineFormat: `**{paragraph_title}**
- Target Words: {suggested_word_count}
- Intended Chunks: {intended_chunks}
- Expanded Text: {expanded_text}

---`
};

/**
 * Utility function to format chunks for inclusion in prompts
 */
export function formatChunksForPrompt(chunks: Array<{label: string, excerpt: string}>): string {
  return chunks.map(chunk => 
    promptTemplates.chunkFormat
      .replace('{chunk_label}', chunk.label)
      .replace('{chunk_excerpt}', chunk.excerpt)
  ).join('\n');
}

/**
 * Utility function to format paragraph outline for full draft generation
 */
export function formatParagraphOutline(paragraphs: Array<{
  title: string;
  suggestedWordCount: number;
  intendedChunks: Array<{label: string}>;
  expandedText?: string;
}>): string {
  return paragraphs.map(paragraph => 
    promptTemplates.paragraphOutlineFormat
      .replace('{paragraph_title}', paragraph.title)
      .replace('{suggested_word_count}', paragraph.suggestedWordCount.toString())
      .replace('{intended_chunks}', paragraph.intendedChunks.map(c => c.label).join(', '))
      .replace('{expanded_text}', paragraph.expandedText || '[Not expanded]')
  ).join('\n');
}

/**
 * Utility function to replace template variables
 */
export function replaceTemplateVariables(template: string, variables: Record<string, string | number | boolean>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return result;
}

export default promptTemplates;
