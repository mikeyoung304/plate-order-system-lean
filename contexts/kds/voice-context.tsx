'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

type VoiceCommand = {
  id: string;
  command: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: number;
  processed: boolean;
};

type AudioFeedback = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  played: boolean;
};

interface VoiceState {
  // Recognition state
  isListening: boolean;
  isProcessing: boolean;
  recognitionSupported: boolean;
  recognitionError: string | null;
  
  // Command handling
  commands: VoiceCommand[];
  lastCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  
  // Audio feedback
  feedbackQueue: AudioFeedback[];
  currentFeedback: AudioFeedback | null;
  audioEnabled: boolean;
  volume: number;
  
  // Voice settings
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  
  // Performance metrics
  recognitionAccuracy: number;
  averageProcessingTime: number;
  totalCommands: number;
  successfulCommands: number;
}

type VoiceAction =
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_RECOGNITION_ERROR'; payload: string | null }
  | { type: 'ADD_COMMAND'; payload: VoiceCommand }
  | { type: 'MARK_COMMAND_PROCESSED'; payload: string }
  | { type: 'ADD_FEEDBACK'; payload: Omit<AudioFeedback, 'id' | 'timestamp' | 'played'> }
  | { type: 'SET_CURRENT_FEEDBACK'; payload: AudioFeedback | null }
  | { type: 'MARK_FEEDBACK_PLAYED'; payload: string }
  | { type: 'SET_AUDIO_ENABLED'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_CONTINUOUS'; payload: boolean }
  | { type: 'UPDATE_ACCURACY'; payload: number }
  | { type: 'UPDATE_PROCESSING_TIME'; payload: number }
  | { type: 'CLEAR_COMMAND_HISTORY' }
  | { type: 'CLEAR_FEEDBACK_QUEUE' };

const initialState: VoiceState = {
  isListening: false,
  isProcessing: false,
  recognitionSupported: false,
  recognitionError: null,
  commands: [],
  lastCommand: null,
  commandHistory: [],
  feedbackQueue: [],
  currentFeedback: null,
  audioEnabled: true,
  volume: 0.7,
  language: 'en-US',
  continuous: true,
  interimResults: false,
  maxAlternatives: 1,
  recognitionAccuracy: 0,
  averageProcessingTime: 0,
  totalCommands: 0,
  successfulCommands: 0,
};

function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case 'START_LISTENING':
      return {
        ...state,
        isListening: true,
        recognitionError: null,
      };

    case 'STOP_LISTENING':
      return {
        ...state,
        isListening: false,
        isProcessing: false,
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };

    case 'SET_RECOGNITION_ERROR':
      return {
        ...state,
        recognitionError: action.payload,
        isListening: false,
        isProcessing: false,
      };

    case 'ADD_COMMAND': {
      const command = action.payload;
      return {
        ...state,
        commands: [command, ...state.commands.slice(0, 9)], // Keep last 10
        lastCommand: command,
        commandHistory: [command, ...state.commandHistory.slice(0, 99)], // Keep last 100
        totalCommands: state.totalCommands + 1,
      };
    }

    case 'MARK_COMMAND_PROCESSED': {
      const commandId = action.payload;
      return {
        ...state,
        commands: state.commands.map(cmd =>
          cmd.id === commandId ? { ...cmd, processed: true } : cmd
        ),
        commandHistory: state.commandHistory.map(cmd =>
          cmd.id === commandId ? { ...cmd, processed: true } : cmd
        ),
        successfulCommands: state.successfulCommands + 1,
      };
    }

    case 'ADD_FEEDBACK': {
      const feedback: AudioFeedback = {
        ...action.payload,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        played: false,
      };

      return {
        ...state,
        feedbackQueue: [...state.feedbackQueue, feedback],
      };
    }

    case 'SET_CURRENT_FEEDBACK':
      return {
        ...state,
        currentFeedback: action.payload,
      };

    case 'MARK_FEEDBACK_PLAYED': {
      const feedbackId = action.payload;
      return {
        ...state,
        feedbackQueue: state.feedbackQueue.map(feedback =>
          feedback.id === feedbackId ? { ...feedback, played: true } : feedback
        ),
      };
    }

    case 'SET_AUDIO_ENABLED':
      return {
        ...state,
        audioEnabled: action.payload,
      };

    case 'SET_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
      };

    case 'SET_CONTINUOUS':
      return {
        ...state,
        continuous: action.payload,
      };

    case 'UPDATE_ACCURACY':
      return {
        ...state,
        recognitionAccuracy: action.payload,
      };

    case 'UPDATE_PROCESSING_TIME': {
      const currentAvg = state.averageProcessingTime;
      const newTime = action.payload;
      const totalCommands = state.totalCommands;
      const newAvg = totalCommands > 0 
        ? (currentAvg * (totalCommands - 1) + newTime) / totalCommands
        : newTime;

      return {
        ...state,
        averageProcessingTime: newAvg,
      };
    }

    case 'CLEAR_COMMAND_HISTORY':
      return {
        ...state,
        commands: [],
        commandHistory: [],
      };

    case 'CLEAR_FEEDBACK_QUEUE':
      return {
        ...state,
        feedbackQueue: [],
        currentFeedback: null,
      };

    default:
      return state;
  }
}

interface VoiceContextValue {
  state: VoiceState;
  dispatch: React.Dispatch<VoiceAction>;
  // Voice recognition
  startListening: () => void;
  stopListening: () => void;
  // Command processing
  processCommand: (command: string, confidence: number) => Promise<void>;
  // Audio feedback
  playFeedback: (type: AudioFeedback['type'], message: string) => void;
  // Settings
  setAudioEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setLanguage: (language: string) => void;
  setContinuous: (continuous: boolean) => void;
  // Queries
  getRecentCommands: (limit?: number) => VoiceCommand[];
  getCommandHistory: (limit?: number) => VoiceCommand[];
  getSuccessRate: () => number;
  // Cleanup
  clearHistory: () => void;
  clearFeedback: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(voiceReducer, initialState);
  const recognitionRef = React.useRef<any | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = state.continuous;
        recognition.interimResults = state.interimResults;
        recognition.maxAlternatives = state.maxAlternatives;
        recognition.lang = state.language;

        recognition.onstart = () => {
          dispatch({ type: 'START_LISTENING' });
        };

        recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const command = result[0].transcript.trim();
            const confidence = result[0].confidence || 0;
            
            processCommand(command, confidence);
          }
        };

        recognition.onerror = (event: any) => {
          dispatch({ type: 'SET_RECOGNITION_ERROR', payload: event.error });
        };

        recognition.onend = () => {
          dispatch({ type: 'STOP_LISTENING' });
        };

        recognitionRef.current = recognition;
        
        // Mark as supported
        dispatch({ type: 'SET_RECOGNITION_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_RECOGNITION_ERROR', payload: 'Speech recognition not supported' });
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [state.continuous, state.interimResults, state.maxAlternatives, state.language]);

  // Initialize audio context for feedback
  useEffect(() => {
    if (typeof window !== 'undefined' && state.audioEnabled) {
      try {
        audioContextRef.current = new AudioContext();
      } catch (_error) {
        console.warn('Audio context not available:', _error);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [state.audioEnabled]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      try {
        recognitionRef.current.start();
      } catch (_error) {
        console.error('Error starting recognition:', _error);
        dispatch({ type: 'SET_RECOGNITION_ERROR', payload: 'Failed to start recognition' });
      }
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const processCommand = useCallback(async (command: string, confidence: number) => {
    const startTime = Date.now();
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      // Parse command
      const voiceCommand: VoiceCommand = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        command: command.toLowerCase(),
        confidence,
        timestamp: Date.now(),
        processed: false,
      };

      // Add to command list
      dispatch({ type: 'ADD_COMMAND', payload: voiceCommand });

      // Process different command types
      let processed = false;
      const commandText = command.toLowerCase();

      // Order management commands
      if (commandText.includes('bump') || commandText.includes('complete')) {
        const orderMatch = commandText.match(/(?:order|table)\s*(\d+)/);
        if (orderMatch) {
          voiceCommand.parameters = { orderId: orderMatch[1], action: 'bump' };
          processed = true;
          playFeedback('success', `Order ${orderMatch[1]} bumped`);
        }
      } else if (commandText.includes('recall') || commandText.includes('return')) {
        const orderMatch = commandText.match(/(?:order|table)\s*(\d+)/);
        if (orderMatch) {
          voiceCommand.parameters = { orderId: orderMatch[1], action: 'recall' };
          processed = true;
          playFeedback('info', `Order ${orderMatch[1]} recalled`);
        }
      } else if (commandText.includes('start') || commandText.includes('begin')) {
        const orderMatch = commandText.match(/(?:order|table)\s*(\d+)/);
        if (orderMatch) {
          voiceCommand.parameters = { orderId: orderMatch[1], action: 'start' };
          processed = true;
          playFeedback('info', `Order ${orderMatch[1]} started`);
        }
      } else if (commandText.includes('priority') || commandText.includes('rush')) {
        const orderMatch = commandText.match(/(?:order|table)\s*(\d+)/);
        if (orderMatch) {
          voiceCommand.parameters = { orderId: orderMatch[1], action: 'priority', priority: 'high' };
          processed = true;
          playFeedback('warning', `Order ${orderMatch[1]} marked as priority`);
        }
      }
      
      // Status commands
      else if (commandText.includes('status') || commandText.includes('queue')) {
        voiceCommand.parameters = { action: 'status' };
        processed = true;
        playFeedback('info', 'Checking queue status');
      }
      
      // Help commands
      else if (commandText.includes('help') || commandText.includes('commands')) {
        voiceCommand.parameters = { action: 'help' };
        processed = true;
        playFeedback('info', 'Voice commands available');
      }

      // Low confidence handling
      if (confidence < 0.7) {
        playFeedback('error', 'Command not clear, please repeat');
        processed = false;
      }

      // Mark as processed if successfully handled
      if (processed) {
        dispatch({ type: 'MARK_COMMAND_PROCESSED', payload: voiceCommand.id });
      }

      // Update processing time
      const processingTime = Date.now() - startTime;
      dispatch({ type: 'UPDATE_PROCESSING_TIME', payload: processingTime });

      // Update accuracy
      const successRate = processed ? 1 : 0;
      const currentAccuracy = state.recognitionAccuracy;
      const totalCommands = state.totalCommands + 1;
      const newAccuracy = totalCommands > 1
        ? (currentAccuracy * (totalCommands - 1) + successRate) / totalCommands
        : successRate;
      
      dispatch({ type: 'UPDATE_ACCURACY', payload: newAccuracy });

    } catch (_error) {
      console.error('Error processing command:', _error);
      playFeedback('error', 'Command processing failed');
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [state.recognitionAccuracy, state.totalCommands]);

  const playFeedback = useCallback((type: AudioFeedback['type'], message: string) => {
    if (!state.audioEnabled) return;

    dispatch({
      type: 'ADD_FEEDBACK',
      payload: { type, message },
    });

    // Play audio feedback using Web Audio API or Speech Synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = state.volume;
      utterance.rate = 1.2;
      utterance.pitch = type === 'error' ? 0.8 : type === 'success' ? 1.2 : 1.0;
      
      speechSynthesis.speak(utterance);
    }
  }, [state.audioEnabled, state.volume]);

  // Settings functions
  const setAudioEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_AUDIO_ENABLED', payload: enabled });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const setLanguage = useCallback((language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, []);

  const setContinuous = useCallback((continuous: boolean) => {
    dispatch({ type: 'SET_CONTINUOUS', payload: continuous });
  }, []);

  // Query functions
  const getRecentCommands = useCallback(
    (limit: number = 5) => state.commands.slice(0, limit),
    [state.commands]
  );

  const getCommandHistory = useCallback(
    (limit: number = 20) => state.commandHistory.slice(0, limit),
    [state.commandHistory]
  );

  const getSuccessRate = useCallback(() => {
    return state.totalCommands > 0 
      ? (state.successfulCommands / state.totalCommands) * 100 
      : 0;
  }, [state.totalCommands, state.successfulCommands]);

  // Cleanup functions
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_COMMAND_HISTORY' });
  }, []);

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK_QUEUE' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      startListening,
      stopListening,
      processCommand,
      playFeedback,
      setAudioEnabled,
      setVolume,
      setLanguage,
      setContinuous,
      getRecentCommands,
      getCommandHistory,
      getSuccessRate,
      clearHistory,
      clearFeedback,
    }),
    [
      state,
      startListening,
      stopListening,
      processCommand,
      playFeedback,
      setAudioEnabled,
      setVolume,
      setLanguage,
      setContinuous,
      getRecentCommands,
      getCommandHistory,
      getSuccessRate,
      clearHistory,
      clearFeedback,
    ]
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}