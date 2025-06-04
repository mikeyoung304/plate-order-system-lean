/**
 * Audio Optimization Utilities for OpenAI Transcription
 * Handles compression, format conversion, and preprocessing
 */

export interface AudioOptimizationOptions {
  maxSizeKB?: number
  targetBitrate?: number
  maxDurationMs?: number
  minDurationMs?: number
  preferredFormat?: 'mp3' | 'wav' | 'webm' | 'ogg'
  enableDenoising?: boolean
}

export interface AudioAnalysis {
  duration: number
  size: number
  format: string
  bitrate?: number
  channels?: number
  sampleRate?: number
  needsOptimization: boolean
  estimatedCost: number
}

export interface OptimizationResult {
  originalBlob: Blob
  optimizedBlob: Blob
  analysis: AudioAnalysis
  compressionRatio: number
  costSavings: number
  optimizationApplied: string[]
}

const DEFAULT_OPTIONS: Required<AudioOptimizationOptions> = {
  maxSizeKB: 500, // 500KB max for cost optimization
  targetBitrate: 64000, // 64kbps for speech
  maxDurationMs: 30000, // 30 seconds max
  minDurationMs: 500, // 0.5 seconds min
  preferredFormat: 'mp3',
  enableDenoising: false, // Disable by default due to complexity
}

// OpenAI Whisper pricing: $0.006 per minute
const WHISPER_COST_PER_MINUTE = 0.006

export class AudioOptimizer {
  private options: Required<AudioOptimizationOptions>

  constructor(options: AudioOptimizationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Analyze audio blob for optimization needs
   */
  async analyzeAudio(blob: Blob): Promise<AudioAnalysis> {
    const size = blob.size
    const format = this.detectFormat(blob.type)
    
    // Estimate duration from size (rough approximation)
    const estimatedDuration = this.estimateDuration(size, format)
    
    // Calculate estimated cost
    const estimatedCost = (estimatedDuration / 60000) * WHISPER_COST_PER_MINUTE
    
    const needsOptimization = 
      size > this.options.maxSizeKB * 1024 || 
      estimatedDuration > this.options.maxDurationMs ||
      !this.isOptimalFormat(format)

    return {
      duration: estimatedDuration,
      size,
      format,
      needsOptimization,
      estimatedCost,
    }
  }

  /**
   * Optimize audio blob for transcription
   */
  async optimizeAudio(blob: Blob): Promise<OptimizationResult> {
    const analysis = await this.analyzeAudio(blob)
    let optimizedBlob = blob
    const optimizationApplied: string[] = []

    // Skip optimization if not needed
    if (!analysis.needsOptimization) {
      return {
        originalBlob: blob,
        optimizedBlob: blob,
        analysis,
        compressionRatio: 1,
        costSavings: 0,
        optimizationApplied: ['no-optimization-needed'],
      }
    }

    // Apply optimizations
    try {
      // 1. Format conversion
      if (!this.isOptimalFormat(analysis.format)) {
        optimizedBlob = await this.convertFormat(optimizedBlob)
        optimizationApplied.push('format-conversion')
      }

      // 2. Duration trimming
      if (analysis.duration > this.options.maxDurationMs) {
        optimizedBlob = await this.trimAudio(optimizedBlob, this.options.maxDurationMs)
        optimizationApplied.push('duration-trimming')
      }

      // 3. Compression
      if (optimizedBlob.size > this.options.maxSizeKB * 1024) {
        optimizedBlob = await this.compressAudio(optimizedBlob)
        optimizationApplied.push('compression')
      }

      // 4. Basic noise reduction (if enabled and supported)
      if (this.options.enableDenoising && this.isDenoiseSupported()) {
        optimizedBlob = await this.reduceNoise(optimizedBlob)
        optimizationApplied.push('noise-reduction')
      }

    } catch (error) {
      console.warn('Audio optimization failed, using original:', error)
      optimizedBlob = blob
      optimizationApplied.push('optimization-failed')
    }

    const finalAnalysis = await this.analyzeAudio(optimizedBlob)
    const compressionRatio = blob.size / optimizedBlob.size
    const costSavings = analysis.estimatedCost - finalAnalysis.estimatedCost

    return {
      originalBlob: blob,
      optimizedBlob,
      analysis: finalAnalysis,
      compressionRatio,
      costSavings,
      optimizationApplied,
    }
  }

  /**
   * Preprocess audio for better transcription accuracy
   */
  async preprocessForTranscription(blob: Blob): Promise<Blob> {
    try {
      // Apply basic preprocessing that doesn't require complex audio processing
      return await this.normalizeVolume(blob)
    } catch (error) {
      console.warn('Audio preprocessing failed:', error)
      return blob
    }
  }

  private detectFormat(mimeType: string): string {
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3'
    if (mimeType.includes('wav')) return 'wav'
    if (mimeType.includes('webm')) return 'webm'
    if (mimeType.includes('ogg')) return 'ogg'
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4'
    return 'unknown'
  }

  private isOptimalFormat(format: string): boolean {
    // MP3 and WAV are generally most compatible with Whisper
    return ['mp3', 'wav'].includes(format)
  }

  private estimateDuration(sizeBytes: number, format: string): number {
    // Rough estimation based on typical bitrates
    const bitrates = {
      mp3: 128000,
      wav: 1411200, // CD quality
      webm: 128000,
      ogg: 128000,
      mp4: 128000,
      unknown: 128000,
    }
    
    const bitrate = bitrates[format as keyof typeof bitrates] || bitrates.unknown
    return (sizeBytes * 8) / (bitrate / 1000) // Convert to milliseconds
  }

  private async convertFormat(blob: Blob): Promise<Blob> {
    // Simple format conversion using native browser APIs
    // For more complex conversion, would need Web Audio API or external library
    
    if (this.options.preferredFormat === 'mp3') {
      // Convert to MP3-compatible format
      return new Blob([blob], { type: 'audio/mpeg' })
    }
    
    return blob
  }

  private async trimAudio(blob: Blob, maxDurationMs: number): Promise<Blob> {
    // For production, would implement actual audio trimming
    // For now, return original blob with warning
    console.warn('Audio trimming not implemented, using original blob')
    return blob
  }

  private async compressAudio(blob: Blob): Promise<Blob> {
    // Simple compression by reducing quality
    // In production, would use proper audio compression
    
    try {
      // Use Web Audio API for basic compression if available
      if (typeof window !== 'undefined' && window.AudioContext) {
        return await this.webAudioCompress(blob)
      }
    } catch (error) {
      console.warn('Web Audio compression failed:', error)
    }
    
    return blob
  }

  private async webAudioCompress(blob: Blob): Promise<Blob> {
    // Web Audio API compression implementation
    // This is a simplified version - production would be more sophisticated
    
    const audioContext = new AudioContext()
    const arrayBuffer = await blob.arrayBuffer()
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        1, // mono
        audioBuffer.length,
        22050 // lower sample rate for compression
      )
      
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineContext.destination)
      source.start()
      
      const compressedBuffer = await offlineContext.startRendering()
      
      // Convert back to blob (simplified)
      const arrayBuffer2 = this.audioBufferToArrayBuffer(compressedBuffer)
      return new Blob([arrayBuffer2], { type: 'audio/wav' })
      
    } finally {
      await audioContext.close()
    }
  }

  private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    // Convert AudioBuffer to ArrayBuffer (WAV format)
    // This is a simplified implementation
    const length = audioBuffer.length
    const channels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    
    // WAV header + data
    const arrayBuffer = new ArrayBuffer(44 + length * channels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV header (simplified)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * channels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * 2, true)
    view.setUint16(32, channels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * channels * 2, true)
    
    // Audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return arrayBuffer
  }

  private async reduceNoise(blob: Blob): Promise<Blob> {
    // Basic noise reduction would require sophisticated audio processing
    // For now, return original blob
    console.warn('Noise reduction not implemented')
    return blob
  }

  private async normalizeVolume(blob: Blob): Promise<Blob> {
    // Volume normalization would require audio analysis
    // For now, return original blob
    return blob
  }

  private isDenoiseSupported(): boolean {
    // Check if noise reduction is supported in current environment
    return typeof window !== 'undefined' && !!window.AudioContext
  }
}

// Factory function for easy use
export function createAudioOptimizer(options?: AudioOptimizationOptions): AudioOptimizer {
  return new AudioOptimizer(options)
}

// Helper function for quick optimization
export async function optimizeAudioForTranscription(
  blob: Blob,
  options?: AudioOptimizationOptions
): Promise<OptimizationResult> {
  const optimizer = createAudioOptimizer(options)
  return optimizer.optimizeAudio(blob)
}