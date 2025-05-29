# Plater Order System - Prompt Templates

## Voice Feature Template

```markdown
## Feature: [Voice Feature Name]

### Requirements
- [ ] Microphone permission handling
- [ ] Audio recording with visual feedback
- [ ] Transcription via OpenAI API
- [ ] Parse transcription to structured data
- [ ] Error handling for failed transcriptions
- [ ] Fallback to manual input

### Implementation Steps

1. **Create Recording Hook**
   - Set up Web Audio API
   - Handle permission requests
   - Implement start/stop recording
   - Save audio to temporary blob

2. **Transcription Service**
   - Send audio to OpenAI endpoint
   - Parse response to item array
   - Handle common speech patterns
   - Return structured order data

3. **UI Integration**
   - Add recording button with states
   - Show visual feedback during recording
   - Display transcription preview
   - Allow editing before submission

4. **Error Handling**
   - Network failures
   - Invalid transcriptions
   - Microphone access denied
   - Audio quality issues

### Testing
- [ ] Test with different accents
- [ ] Test with background noise
- [ ] Test error scenarios
- [ ] Test on mobile devices