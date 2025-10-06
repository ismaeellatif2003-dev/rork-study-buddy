# Grounded Essay Writer - Demo Script

## Quick Demo Sequence

Follow these steps to test the complete essay writer workflow:

### Step 1: Access the Feature
1. Open the app and navigate to the "Essay Writer" tab
2. You should see the materials upload screen with two columns: "Relevant Notes" and "References"

### Step 2: Upload Materials
1. **Upload a file** (if you have a text file):
   - Tap "Upload File" in the Notes column
   - Select a .txt, .pdf, or .docx file
   - The file should appear as a card with excerpt

2. **Paste text content**:
   - Create a text file with sample content like:
   ```
   Climate change represents one of the most pressing challenges of our time. 
   The scientific consensus is overwhelming, with 97% of climate scientists 
   agreeing that human activities are the primary driver of recent warming trends.
   Greenhouse gas concentrations have increased dramatically since the Industrial 
   Revolution, with CO2 levels rising from 280 ppm to over 400 ppm.
   ```

3. **Add references**:
   - In the References column, paste content like:
   ```
   The Paris Agreement represents a landmark international effort to limit 
   global temperature rise to well below 2°C above pre-industrial levels.
   Carbon pricing mechanisms include carbon taxes and cap-and-trade systems.
   ```

4. **Mark priority sources**:
   - Tap the star icon on any file card to mark it as priority
   - Priority sources will be preferred when generating the essay

### Step 3: Configure Essay Parameters
1. Tap "Continue to Configuration"
2. **Set assignment details**:
   - Assignment Title: "Climate Change Economics Essay" (optional)
   - Required Question: "Discuss the economic impact of climate change and evaluate policy responses"

3. **Choose word count**:
   - Tap one of the preset buttons (250, 500, 800, 1200)
   - Or enter a custom word count like "1000"

4. **Select academic level**:
   - Choose "Undergraduate" for college-level writing

5. **Pick citation style**:
   - Select "APA" for standard academic citations

6. **Set generation mode**:
   - Choose "Grounded" to use only your uploaded materials

7. **Enable references**:
   - Keep the "Include References" toggle ON

8. **Check integrity box**:
   - Tap the checkbox: "I will use this for study/learning only"
   - This enables the "Generate Outline" button

### Step 4: Generate Outline
1. Tap "Generate Outline"
2. Wait for the outline to generate (simulated 3-second delay)
3. **Review the results**:
   - Read the thesis statement
   - Check the paragraph titles and structure
   - See which source chunks will be used for each paragraph

### Step 5: Expand Paragraphs
1. **Expand individual paragraphs**:
   - Tap "Expand Paragraph" on the first paragraph
   - Wait for content to generate (simulated 2-second delay)
   - Review the expanded text with inline citations

2. **Check citations**:
   - Look for inline citations like "(DOC1:p3)"
   - Review the "Citations used" section
   - Check for any "[UNSUPPORTED]" flags

3. **Expand all paragraphs**:
   - Tap "Expand All" to generate all remaining paragraphs
   - Each paragraph will show its content, citations, and source usage

### Step 6: Review and Edit
1. **Edit paragraph content**:
   - Tap on any paragraph text to edit it
   - Make changes and see them reflected in the essay

2. **Check unsupported content**:
   - Look for yellow warning badges on unsupported sentences
   - Read the explanations for why content isn't supported

3. **Review source usage**:
   - See which chunks from your materials were used
   - Check the page numbers and excerpts

### Step 7: Export Options
1. **Copy to clipboard**:
   - Tap "Copy to Clipboard" to share the essay text

2. **Download formats**:
   - Tap "Download as DOCX" (shows info message)
   - Tap "Download as PDF" (shows info message)

3. **Copy with citations**:
   - Tap "Copy with Citations" to get the essay with proper citation formatting

### Step 8: Review Usage Summary
1. Check the usage summary at the bottom:
   - Estimated tokens used
   - Number of chunks utilized
   - Total sources processed

## Expected Results

### Successful Flow
- ✅ Materials upload and display correctly
- ✅ Configuration options work as expected
- ✅ Outline generation produces realistic thesis and paragraph structure
- ✅ Paragraph expansion includes proper citations
- ✅ Export options are functional
- ✅ UI is responsive and accessible

### Sample Output
**Thesis**: "Climate change poses significant economic challenges that require immediate policy responses and international cooperation to mitigate long-term costs and ensure sustainable development."

**Paragraph Structure**:
1. Economic Costs of Climate Change
2. Policy Responses and Carbon Pricing  
3. International Cooperation and Agreements
4. Adaptation Strategies and Future Outlook

**Citations**: Inline citations like "(DOC1:p3)" and "(NOTES1:chunk2)" throughout the text.

## Testing Different Scenarios

### Test 1: No Materials Uploaded
- Try to continue without uploading any files
- Should show disabled "Continue" button

### Test 2: Invalid Configuration
- Leave prompt field empty
- Try to generate outline without checking integrity box
- Should show disabled "Generate Outline" button

### Test 3: Different Academic Levels
- Test with "High School" level (simpler language)
- Test with "Graduate" level (more sophisticated)
- Compare the generated content complexity

### Test 4: Different Citation Styles
- Try APA, MLA, Harvard, and Chicago styles
- Check how citations are formatted differently

### Test 5: Different Generation Modes
- Test "Grounded" mode (materials only)
- Test "Mixed" mode (materials + general knowledge)
- Test "Teach" mode (educational explanations)

## Troubleshooting

### If Something Doesn't Work
1. **Check console logs** for any error messages
2. **Verify file uploads** are showing in the materials list
3. **Ensure all required fields** are filled in configuration
4. **Check network connectivity** if using real API endpoints

### Common Issues
- **File upload fails**: Check file type and size (max 10MB)
- **Generation takes too long**: Normal for first-time processing
- **Citations not showing**: Check that materials were properly uploaded
- **Export not working**: Verify device permissions for file access

## Performance Notes
- Initial outline generation: ~3 seconds (simulated)
- Paragraph expansion: ~2 seconds per paragraph (simulated)
- File upload: ~1.5 seconds (simulated)
- All times are realistic for actual API calls

## Next Steps
After testing the demo:
1. Review the integration guide for backend setup
2. Replace mock API calls with real endpoints
3. Customize the UI styling and copy text
4. Add any additional validation or features needed
5. Deploy to your production environment
