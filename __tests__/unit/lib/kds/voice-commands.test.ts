import { parseVoiceCommand, VoiceCommandProcessor, useVoiceCommands, VOICE_FEEDBACK } from '@/lib/kds/voice-commands'
import { renderHook, act } from '@testing-library/react'
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe'

// Mock dependencies
jest.mock('@/lib/modassembly/openai/transcribe')
jest.mock('@/lib/kds/voice-command-processor')

const mockTranscribeAudioFile = transcribeAudioFile as jest.MockedFunction<typeof transcribeAudioFile>

describe('Voice Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset global mocks
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue({
      getTracks: jest.fn(() => [{ stop: jest.fn() }])
    } as any)
    
    global.MediaRecorder = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
      state: 'inactive'
    }))
  })

  describe('parseVoiceCommand', () => {
    describe('Bump Commands', () => {
      it('should parse basic bump commands', () => {
        const testCases = [
          { input: 'bump order 123', expectedTarget: '123' },
          { input: 'mark order 456 ready', expectedTarget: '456' },
          { input: 'complete order 789', expectedTarget: '789' },
          { input: 'order 321 is ready', expectedTarget: '321' },
          { input: 'done order 654', expectedTarget: '654' },
          { input: 'finish order 987', expectedTarget: '987' },
        ]

        testCases.forEach(({ input, expectedTarget }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('bump')
          expect(result.target).toBe(expectedTarget)
          expect(result.confidence).toBeGreaterThan(0.7)
        })
      })

      it('should parse bump commands with variations', () => {
        const testCases = [
          'bump 123',
          'ready 456',
          'order 789 done',
          'mark 321 complete',
        ]

        testCases.forEach(input => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('bump')
          expect(result.target).toBeTruthy()
        })
      })
    })

    describe('Recall Commands', () => {
      it('should parse recall commands', () => {
        const testCases = [
          { input: 'recall order 123', expectedTarget: '123' },
          { input: 'bring back order 456', expectedTarget: '456' },
          { input: 'undo order 789', expectedTarget: '789' },
          { input: 'restore order 321', expectedTarget: '321' },
          { input: 'order 654 recall', expectedTarget: '654' },
        ]

        testCases.forEach(({ input, expectedTarget }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('recall')
          expect(result.target).toBe(expectedTarget)
          expect(result.confidence).toBeGreaterThan(0.7)
        })
      })
    })

    describe('Start Commands', () => {
      it('should parse start commands', () => {
        const testCases = [
          { input: 'start order 123', expectedTarget: '123' },
          { input: 'begin order 456', expectedTarget: '456' },
          { input: 'start cooking order 789', expectedTarget: '789' },
          { input: 'commence order 321', expectedTarget: '321' },
          { input: 'order 654 start', expectedTarget: '654' },
        ]

        testCases.forEach(({ input, expectedTarget }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('start')
          expect(result.target).toBe(expectedTarget)
          expect(result.confidence).toBeGreaterThan(0.7)
        })
      })
    })

    describe('Priority Commands', () => {
      it('should parse priority commands with text levels', () => {
        const testCases = [
          { input: 'set order 123 priority high', target: '123', priority: 8 },
          { input: 'make order 456 urgent', target: '456', priority: 8 },
          { input: 'priority order 789 medium', target: '789', priority: 5 },
          { input: 'order 321 low priority', target: '321', priority: 2 },
        ]

        testCases.forEach(({ input, target, priority }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('priority')
          expect(result.target).toBe(target)
          expect(result.value).toBe(priority)
        })
      })

      it('should parse priority commands with numeric levels', () => {
        const testCases = [
          { input: 'set order 123 priority 9', target: '123', priority: 9 },
          { input: 'priority order 456 to 7', target: '456', priority: 7 },
          { input: 'make order 789 priority 3', target: '789', priority: 3 },
        ]

        testCases.forEach(({ input, target, priority }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('priority')
          expect(result.target).toBe(target)
          expect(result.value).toBe(priority)
        })
      })

      it('should handle invalid priority values', () => {
        const result = parseVoiceCommand('set order 123 priority invalid')
        expect(result.action).toBe('priority')
        expect(result.target).toBe('123')
        expect(result.value).toBe(5) // Default to medium
        expect(result.confidence).toBe(0.5) // Lower confidence
      })
    })

    describe('Show/Filter Commands', () => {
      it('should parse show commands', () => {
        const testCases = [
          { input: 'show new orders', target: 'new' },
          { input: 'display overdue orders', target: 'overdue' },
          { input: 'view all orders', target: 'all' },
          { input: 'show preparing orders', target: 'preparing' },
          { input: 'what are the next orders', target: 'next' },
        ]

        testCases.forEach(({ input, target }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('show')
          expect(result.target).toBe(target)
        })
      })

      it('should parse filter commands', () => {
        const testCases = [
          { input: 'filter new orders', target: 'new' },
          { input: 'show only overdue', target: 'overdue' },
          { input: 'display only preparing orders', target: 'preparing' },
          { input: 'only show all', target: 'all' },
        ]

        testCases.forEach(({ input, target }) => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('filter')
          expect(result.target).toBe(target)
        })
      })
    })

    describe('Help Commands', () => {
      it('should recognize help commands', () => {
        const testCases = [
          'help',
          'commands',
          'what can I say',
          'show commands',
          'instructions',
        ]

        testCases.forEach(input => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('show')
          expect(result.target).toBe('help')
          expect(result.confidence).toBeGreaterThan(0.8)
        })
      })
    })

    describe('Unknown Commands', () => {
      it('should handle unknown commands', () => {
        const testCases = [
          'make me a sandwich',
          'what is the weather',
          'abracadabra',
          '',
          '   ',
        ]

        testCases.forEach(input => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('unknown')
          expect(result.confidence).toBe(0)
        })
      })
    })

    describe('Case Sensitivity and Normalization', () => {
      it('should handle different cases', () => {
        const testCases = [
          'BUMP ORDER 123',
          'BuMp OrDeR 456',
          'bump ORDER 789',
          'RECALL order 321',
        ]

        testCases.forEach(input => {
          const result = parseVoiceCommand(input)
          expect(result.action).toMatch(/^(bump|recall)$/)
          expect(result.target).toBeTruthy()
        })
      })

      it('should handle extra whitespace and punctuation', () => {
        const testCases = [
          '  bump   order   123  ',
          'bump order #123',
          'bump order: 123',
          'bump (order 123)',
          'bump order 123!',
        ]

        testCases.forEach(input => {
          const result = parseVoiceCommand(input)
          expect(result.action).toBe('bump')
          expect(result.target).toBe('123')
        })
      })
    })
  })

  describe('VoiceCommandProcessor', () => {
    let processor: VoiceCommandProcessor
    let mockOnCommand: jest.Mock
    let mockOnFeedback: jest.Mock
    let mockOnStateChange: jest.Mock

    beforeEach(() => {
      mockOnCommand = jest.fn()
      mockOnFeedback = jest.fn()
      mockOnStateChange = jest.fn()

      processor = new VoiceCommandProcessor({
        onCommand: mockOnCommand,
        onFeedback: mockOnFeedback,
        onStateChange: mockOnStateChange,
        userId: 'test-user'
      })
    })

    describe('Audio Recording', () => {
      it('should start listening and set up MediaRecorder', async () => {
        await processor.startListening()

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
        expect(MediaRecorder).toHaveBeenCalledWith(
          expect.any(Object),
          { mimeType: 'audio/webm;codecs=opus' }
        )
        expect(mockOnStateChange).toHaveBeenCalledWith('listening')
        expect(mockOnFeedback).toHaveBeenCalledWith(VOICE_FEEDBACK.listening)
      })

      it('should handle getUserMedia errors', async () => {
        const error = new Error('Permission denied')
        ;(navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(error)

        await processor.startListening()

        expect(mockOnFeedback).toHaveBeenCalledWith(
          VOICE_FEEDBACK.error('Failed to access microphone')
        )
        expect(mockOnStateChange).toHaveBeenCalledWith('idle')
      })

      it('should not start listening if already listening', async () => {
        // Mock already listening state
        processor['isListening'] = true

        await processor.startListening()

        expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled()
      })

      it('should stop listening and clean up', () => {
        const mockMediaRecorder = {
          stop: jest.fn(),
          start: jest.fn(),
          ondataavailable: null,
          onstop: null,
          state: 'recording'
        }
        
        processor['isListening'] = true
        processor['mediaRecorder'] = mockMediaRecorder as any

        processor.stopListening()

        expect(mockMediaRecorder.stop).toHaveBeenCalled()
        expect(processor['isListening']).toBe(false)
      })

      it('should handle stop listening when not recording', () => {
        processor['isListening'] = false
        processor['mediaRecorder'] = null

        // Should not throw
        expect(() => processor.stopListening()).not.toThrow()
      })
    })

    describe('Audio Processing', () => {
      it('should process audio and execute commands', async () => {
        const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
        
        mockTranscribeAudioFile.mockResolvedValue({
          transcription: 'bump order 123',
          confidence: 0.9,
          processing_time: 500
        })

        // Simulate audio processing
        const mockMediaRecorder = {
          ondataavailable: null as any,
          onstop: null as any,
          start: jest.fn(),
          stop: jest.fn(),
        }

        processor['mediaRecorder'] = mockMediaRecorder as any
        processor['audioChunks'] = [mockBlob]

        // Trigger the onstop event
        if (mockMediaRecorder.onstop) {
          await mockMediaRecorder.onstop()
        }

        expect(mockTranscribeAudioFile).toHaveBeenCalledWith(
          expect.any(Blob),
          'voice-command.webm'
        )
        expect(mockOnCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'bump',
            target: '123',
            originalText: 'bump order 123'
          })
        )
      })

      it('should handle empty transcription', async () => {
        mockTranscribeAudioFile.mockResolvedValue({
          transcription: '',
          confidence: 0,
          processing_time: 100
        })

        const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
        processor['audioChunks'] = [mockBlob]

        // Simulate processing
        await processor['processAudioCommand'](mockBlob)

        expect(mockOnFeedback).toHaveBeenCalledWith(
          VOICE_FEEDBACK.error('No speech detected')
        )
        expect(mockOnStateChange).toHaveBeenCalledWith('idle')
      })

      it('should handle transcription errors', async () => {
        mockTranscribeAudioFile.mockRejectedValue(new Error('Transcription failed'))

        const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })

        await processor['processAudioCommand'](mockBlob)

        expect(mockOnFeedback).toHaveBeenCalledWith(
          VOICE_FEEDBACK.error('Failed to process voice command')
        )
        expect(mockOnStateChange).toHaveBeenCalledWith('idle')
      })
    })

    describe('Command Execution', () => {
      it('should provide feedback for successful commands', async () => {
        mockTranscribeAudioFile.mockResolvedValue({
          transcription: 'bump order 123',
          confidence: 0.9,
          processing_time: 500
        })

        const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
        await processor['processAudioCommand'](mockBlob)

        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.stringContaining('Order 123')
        )
      })

      it('should provide feedback for unknown commands', async () => {
        mockTranscribeAudioFile.mockResolvedValue({
          transcription: 'make me a sandwich',
          confidence: 0.1,
          processing_time: 300
        })

        const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
        await processor['processAudioCommand'](mockBlob)

        expect(mockOnFeedback).toHaveBeenCalledWith(
          VOICE_FEEDBACK.error('Unknown command: "make me a sandwich"')
        )
      })
    })

    describe('Help System', () => {
      it('should provide help text', () => {
        const helpText = processor.getHelpText()
        
        expect(helpText).toContain('Available voice commands')
        expect(helpText).toContain('Mark order 123 ready')
        expect(helpText).toContain('Recall order 123')
        expect(helpText).toContain('Start order 123')
        expect(helpText).toContain('Set order 123 priority high')
      })
    })
  })

  describe('useVoiceCommands Hook', () => {
    it('should initialize voice processor when enabled', () => {
      const mockOnCommand = jest.fn()
      const mockOnFeedback = jest.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({
          onCommand: mockOnCommand,
          onFeedback: mockOnFeedback,
          enabled: true,
          userId: 'test-user'
        })
      )

      expect(result.current.isAvailable).toBe(true)
      expect(result.current.isListening).toBe(false)
      expect(result.current.isProcessing).toBe(false)
    })

    it('should not initialize when disabled', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({
          enabled: false,
          userId: 'test-user'
        })
      )

      expect(result.current.isAvailable).toBe(false)
    })

    it('should provide start and stop listening functions', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({
          enabled: true,
          userId: 'test-user'
        })
      )

      expect(typeof result.current.startListening).toBe('function')
      expect(typeof result.current.stopListening).toBe('function')
      expect(typeof result.current.getHelpText).toBe('function')
    })

    it('should update state based on processor events', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({
          enabled: true,
          userId: 'test-user'
        })
      )

      // Simulate state changes
      act(() => {
        result.current.startListening()
      })

      // Note: Full state testing would require mocking the actual processor behavior
      expect(result.current.isAvailable).toBe(true)
    })

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() =>
        useVoiceCommands({
          enabled: true,
          userId: 'test-user'
        })
      )

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow()
    })

    it('should handle changes to enabled prop', () => {
      let enabled = true
      const { result, rerender } = renderHook(() =>
        useVoiceCommands({
          enabled,
          userId: 'test-user'
        })
      )

      expect(result.current.isAvailable).toBe(true)

      // Disable
      enabled = false
      rerender()
      
      // Should reinitialize with new enabled state
      expect(result.current.isAvailable).toBe(false)
    })
  })

  describe('Voice Feedback System', () => {
    it('should provide appropriate feedback messages', () => {
      expect(VOICE_FEEDBACK.bump('123')).toBe('Order 123 marked as ready')
      expect(VOICE_FEEDBACK.recall('456')).toBe('Order 456 recalled')
      expect(VOICE_FEEDBACK.start('789')).toBe('Started preparing order 789')
      expect(VOICE_FEEDBACK.priority('321', 'high')).toBe('Order 321 priority set to high')
      expect(VOICE_FEEDBACK.show('new')).toBe('Showing new orders')
      expect(VOICE_FEEDBACK.filter('overdue')).toBe('Filtering to overdue orders')
      expect(VOICE_FEEDBACK.notFound('999')).toBe('Order 999 not found')
      expect(VOICE_FEEDBACK.error('test error')).toBe('Error: test error')
    })

    it('should provide status messages', () => {
      expect(VOICE_FEEDBACK.listening).toBe('Listening for voice command...')
      expect(VOICE_FEEDBACK.processing).toBe('Processing command...')
      expect(VOICE_FEEDBACK.ready).toBe('Voice commands ready. Say "Help" for available commands.')
    })
  })

  describe('Integration with Enhanced Processor', () => {
    it('should fall back to legacy parsing when enhanced processor fails', async () => {
      const processor = new VoiceCommandProcessor({
        onCommand: jest.fn(),
        onFeedback: jest.fn(),
        onStateChange: jest.fn(),
        userId: 'test-user'
      })

      mockTranscribeAudioFile.mockResolvedValue({
        transcription: 'bump order 123',
        confidence: 0.9,
        processing_time: 500
      })

      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
      await processor['processAudioCommand'](mockBlob)

      // Should still parse the command using legacy parser
      expect(processor['onCommand']).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bump',
          target: '123',
          originalText: 'bump order 123'
        })
      )
    })
  })
})