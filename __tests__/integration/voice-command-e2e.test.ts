import { createClient } from '@/lib/modassembly/supabase/server'
// processVoiceCommand is now part of VoiceCommandProcessor in voice-commands.ts
import { parseVoiceCommand, VoiceCommandProcessor } from '@/lib/kds/voice-commands'
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe'
import { bumpOrder, recallOrder, startOrderPrep, updateOrderPriority } from '@/lib/modassembly/supabase/database/kds'

// Mock external dependencies
jest.mock('@/lib/modassembly/supabase/server')
jest.mock('@/lib/modassembly/openai/transcribe')
jest.mock('@/lib/modassembly/supabase/database/kds')

describe('Voice Command End-to-End Integration', () => {
  let mockSupabase: any
  const mockUserId = 'test-user-123'
  const mockSessionId = 'test-session-456'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    }
    
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    // Setup successful database operations by default
    ;(bumpOrder as jest.Mock).mockResolvedValue(undefined)
    ;(recallOrder as jest.Mock).mockResolvedValue(undefined)
    ;(startOrderPrep as jest.Mock).mockResolvedValue(undefined)
    ;(updateOrderPriority as jest.Mock).mockResolvedValue(undefined)
  })

  describe('Audio → Transcription → Command → Database Flow', () => {
    it('should complete full bump order flow', async () => {
      // Mock transcription
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'bump order 123',
        confidence: 0.95,
        processing_time: 450
      })

      // Mock order lookup
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-123',
          order: {
            id: 'order-123',
            order_number: 123,
            table: { id: 'table-5', label: '5' }
          }
        },
        error: null
      })

      // Mock voice command history insert
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Create audio blob
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/webm' })
      
      // Setup voice processor
      let commandResult: any = null
      let feedbackMessage = ''
      let currentState = 'idle'

      const processor = new VoiceCommandProcessor({
        onCommand: (command) => { commandResult = command },
        onFeedback: (message) => { feedbackMessage = message },
        onStateChange: (state) => { currentState = state },
        userId: mockUserId
      })

      // Start the flow
      processor['audioChunks'] = [audioBlob]
      await processor['processAudioCommand'](audioBlob)

      // Verify the complete flow
      expect(transcribeAudioFile).toHaveBeenCalledWith(audioBlob, 'voice-command.webm')
      expect(commandResult).toMatchObject({
        action: 'bump',
        target: '123',
        originalText: 'bump order 123',
        confidence: expect.any(Number)
      })
      expect(bumpOrder).toHaveBeenCalledWith('routing-123', mockUserId)
      expect(feedbackMessage).toContain('Order 123')
      expect(currentState).toBe('idle')
    })

    it('should handle recall command with table lookup', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'recall order 456',
        confidence: 0.92,
        processing_time: 380
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-456',
          order: {
            id: 'order-456',
            order_number: 456,
            table: { id: 'table-8', label: '8' }
          }
        },
        error: null
      })

      let commandResult: any = null
      const processor = new VoiceCommandProcessor({
        onCommand: (command) => { commandResult = command },
        userId: mockUserId
      })

      const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
      processor['audioChunks'] = [audioBlob]
      await processor['processAudioCommand'](audioBlob)

      expect(commandResult.action).toBe('recall')
      expect(commandResult.target).toBe('456')
      expect(recallOrder).toHaveBeenCalledWith('routing-456')
    })

    it('should handle start command with priority detection', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'start order 789',
        confidence: 0.88,
        processing_time: 420
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-789',
          order: {
            id: 'order-789',
            order_number: 789,
            table: { id: 'table-3', label: '3' }
          }
        },
        error: null
      })

      let commandResult: any = null
      const processor = new VoiceCommandProcessor({
        onCommand: (command) => { commandResult = command },
        userId: mockUserId
      })

      const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
      processor['audioChunks'] = [audioBlob]
      await processor['processAudioCommand'](audioBlob)

      expect(commandResult.action).toBe('start')
      expect(startOrderPrep).toHaveBeenCalledWith('routing-789')
    })

    it('should handle priority command with enhanced processing', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'set order 321 priority high',
        confidence: 0.93,
        processing_time: 520
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-321',
          order: {
            id: 'order-321',
            order_number: 321,
            table: { id: 'table-7', label: '7' }
          }
        },
        error: null
      })

      // Test with enhanced processor integration
      const result = await processVoiceCommand('set order 321 priority high', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.command.action).toBe('priority')
      expect(result.command.targets[0].value).toBe(321)
      expect(result.command.modifiers[0].type).toBe('priority')
      expect(result.command.modifiers[0].value).toBe('high')
      expect(result.executionResult?.success).toBe(true)
      expect(result.feedback.type).toBe('success')
    })
  })

  describe('Batch Operations', () => {
    it('should handle table-level batch bump operations', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'bump all table 5 orders',
        confidence: 0.91,
        processing_time: 600
      })

      // Mock table orders lookup
      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          data: [
            { id: 'routing-1', order: { table: { id: 'table-5', label: '5' } } },
            { id: 'routing-2', order: { table: { id: 'table-5', label: '5' } } },
            { id: 'routing-3', order: { table: { id: 'table-5', label: '5' } } },
          ],
          error: null
        })
      })

      const result = await processVoiceCommand('bump all table 5 orders', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.command.action).toBe('bump')
      expect(result.command.targets[0].type).toBe('table')
      expect(result.command.targets[0].value).toBe(5)
      expect(result.actions[0].batchable).toBe(true)
      expect(result.executionResult?.affectedItems).toBeGreaterThan(1)
    })

    it('should handle batch recall operations', async () => {
      const result = await processVoiceCommand('recall all table 3 orders', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.command.action).toBe('recall')
      expect(result.command.targets[0].type).toBe('table')
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle order not found gracefully', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'bump order 999',
        confidence: 0.95,
        processing_time: 400
      })

      // Mock order not found
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      })

      let feedbackMessage = ''
      const processor = new VoiceCommandProcessor({
        onFeedback: (message) => { feedbackMessage = message },
        userId: mockUserId
      })

      const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
      await processor['processAudioCommand'](audioBlob)

      expect(feedbackMessage).toContain('999') // Should mention the order number
      expect(bumpOrder).not.toHaveBeenCalled()
    })

    it('should handle database operation failures', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'bump order 123',
        confidence: 0.95,
        processing_time: 400
      })

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-123',
          order: { id: 'order-123', order_number: 123 }
        },
        error: null
      })

      // Mock database operation failure
      ;(bumpOrder as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const result = await processVoiceCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.executionResult?.success).toBe(false)
      expect(result.executionResult?.errors).toContain('Bump failed: Database connection failed')
      expect(result.feedback.type).toBe('error')
    })

    it('should handle transcription failures with retries', async () => {
      ;(transcribeAudioFile as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          transcription: 'bump order 123',
          confidence: 0.85,
          processing_time: 800
        })

      let errorFeedback = ''
      let successFeedback = ''
      const feedbacks: string[] = []

      const processor = new VoiceCommandProcessor({
        onFeedback: (message) => { 
          feedbacks.push(message)
          if (message.includes('Error')) {
            errorFeedback = message
          } else if (message.includes('Order')) {
            successFeedback = message
          }
        },
        userId: mockUserId
      })

      const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
      await processor['processAudioCommand'](audioBlob)

      expect(errorFeedback).toContain('Failed to process voice command')
    })

    it('should handle unclear audio with confidence scoring', async () => {
      ;(transcribeAudioFile as jest.Mock).mockResolvedValue({
        transcription: 'mumble something order maybe',
        confidence: 0.3,
        processing_time: 300
      })

      let feedbackMessage = ''
      const processor = new VoiceCommandProcessor({
        onFeedback: (message) => { feedbackMessage = message },
        userId: mockUserId
      })

      const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
      await processor['processAudioCommand'](audioBlob)

      expect(feedbackMessage).toContain('Unknown command')
    })
  })

  describe('Permission and Role-Based Access', () => {
    it('should enforce cook permissions for bump operations', async () => {
      const result = await processVoiceCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.metadata.validationErrors).not.toContain(
        expect.stringContaining('Insufficient permissions')
      )
    })

    it('should deny server permissions for recall operations', async () => {
      const result = await processVoiceCommand('recall order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'server'
      })

      expect(result.metadata.validationErrors).toContain(
        expect.stringContaining('Insufficient permissions')
      )
    })

    it('should allow admin permissions for all operations', async () => {
      const operations = ['bump order 123', 'recall order 456', 'start order 789', 'set order 321 priority high']

      for (const operation of operations) {
        const result = await processVoiceCommand(operation, {
          userId: mockUserId,
          sessionId: mockSessionId,
          timestamp: new Date().toISOString(),
          userRole: 'admin'
        })

        expect(result.metadata.validationErrors).not.toContain(
          expect.stringContaining('Insufficient permissions')
        )
      }
    })
  })

  describe('Performance and Metrics', () => {
    it('should track processing time and database queries', async () => {
      const startTime = Date.now()
      
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-123',
          order: { id: 'order-123', order_number: 123 }
        },
        error: null
      })

      const result = await processVoiceCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.metadata.processingTime).toBeGreaterThan(0)
      expect(result.metadata.processingTime).toBeLessThan(Date.now() - startTime + 100)
      expect(result.metadata.dbQueries).toBeGreaterThanOrEqual(1)
    })

    it('should utilize caching for repeated commands', async () => {
      const processor = new (require('@/lib/kds/voice-command-processor').VoiceCommandProcessor)()

      // First call
      await processor.processCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      jest.clearAllMocks()

      // Second call - should use cache
      const result = await processor.processCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.metadata.cacheHits).toBe(1)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('Command History and Analytics', () => {
    it('should log successful commands to history', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'routing-123',
          order: { id: 'order-123', order_number: 123 }
        },
        error: null
      })

      await processVoiceCommand('bump order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          command: 'bump order 123',
          success: true,
          affected_items: expect.any(Number)
        })
      )
    })

    it('should generate suggestions based on command patterns', async () => {
      const result = await processVoiceCommand('bmp order 123', {
        userId: mockUserId,
        sessionId: mockSessionId,
        timestamp: new Date().toISOString(),
        userRole: 'cook'
      })

      expect(result.metadata.suggestions.length).toBeGreaterThan(0)
      expect(result.metadata.suggestions[0]).toContain('Did you mean')
    })
  })

  describe('Real-time Integration', () => {
    it('should handle concurrent voice commands', async () => {
      const commands = [
        'bump order 123',
        'start order 456',
        'recall order 789'
      ]

      const promises = commands.map((command, index) => {
        mockSupabase.single.mockResolvedValueOnce({
          data: {
            id: `routing-${123 + index * 111}`,
            order: { id: `order-${123 + index * 111}`, order_number: 123 + index * 111 }
          },
          error: null
        })

        return processVoiceCommand(command, {
          userId: `user-${index}`,
          sessionId: `session-${index}`,
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        })
      })

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(results[0].command.action).toBe('bump')
      expect(results[1].command.action).toBe('start')
      expect(results[2].command.action).toBe('recall')
    })

    it('should handle voice commands during high kitchen load', async () => {
      // Simulate high load scenario
      const highLoadPromises = Array(20).fill(null).map((_, i) => {
        mockSupabase.single.mockResolvedValue({
          data: {
            id: `routing-${i}`,
            order: { id: `order-${i}`, order_number: i }
          },
          error: null
        })

        return processVoiceCommand(`bump order ${i}`, {
          userId: `user-${i}`,
          sessionId: `session-${i}`,
          timestamp: new Date().toISOString(),
          userRole: 'cook'
        })
      })

      const results = await Promise.all(highLoadPromises)
      
      // All commands should complete successfully
      expect(results.every(r => r.command.action === 'bump')).toBe(true)
      expect(results.every(r => r.metadata.processingTime > 0)).toBe(true)
    })
  })
})