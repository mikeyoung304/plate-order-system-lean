import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { AudioRecorder } from "@/lib/modassembly/audio-recording/record";

// Constants
const AUDIO_VISUALIZER_BARS = 40;

type VoiceOrderPanelProps = {
  tableId: string;
  tableName: string;
  seatNumber: number;
  orderType: "food" | "drink";
  onOrderSubmitted?: (orderData: { items: string[], transcription: string }) => void;
  onCancel?: () => void;
  testMode?: boolean;
};

export function VoiceOrderPanel({ 
  tableId, 
  tableName, 
  seatNumber, 
  orderType, 
  onOrderSubmitted,
  onCancel,
  testMode = false 
}: VoiceOrderPanelProps) {
  // --- State Variables ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [transcriptionItems, setTranscriptionItems] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dietaryAlerts, setDietaryAlerts] = useState<string[]>([]);
  const [audioRecorder] = useState(() => new AudioRecorder());

  // --- Hooks ---
  const { toast } = useToast();

  // --- Helper Functions ---
  const showInternalToast = useCallback((message: string, type = 'default', duration = 3000) => {
    toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: (type === 'error' ? 'destructive' : type === 'warning' ? 'warning' as any : 'default'),
        duration: duration,
    });
  }, [toast]);

  // Keep dietary alerts logic
  const checkDietaryAlerts = useCallback((text: string) => {
    if (!text) return;
    const alertKeywords = {
        'nut allergy': ['nut', 'peanut', 'almond', 'walnut', 'cashew', 'pistachio', 'pecan'],
        'gluten-free': ['gluten', 'gluten-free', 'wheat'],
        'dairy-free': ['dairy', 'milk', 'lactose', 'cheese', 'butter', 'cream'],
        'vegetarian': ['vegetarian', 'no meat'],
        'vegan': ['vegan', 'no animal', 'plant based', 'plant-based'],
        'shellfish allergy': ['shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'scallop'],
        'spicy': ['not spicy', 'mild', 'no spice']
    };
    setDietaryAlerts([]);
    const lowerText = text.toLowerCase();
    const foundAlerts = Object.entries(alertKeywords)
        .filter(([, keywords]: [string, string[]]) => keywords.some((keyword: string) => lowerText.includes(keyword.toLowerCase())))
        .map(([alert]) => alert);
    if (foundAlerts.length > 0) setDietaryAlerts(foundAlerts);
  }, []);

  const resetUI = useCallback(() => {
    setTranscription('');
    setTranscriptionItems([]);
    setShowConfirmation(false);
    setDietaryAlerts([]);
    setIsProcessing(false);
    setIsSubmitting(false);
  }, []);

  // --- Voice Recording Logic ---
  const handleVoiceRecording = useCallback(async () => {
    try {
      if (isRecording) {
        // Stop recording manually
        setIsProcessing(true);
        showInternalToast("Processing audio...", "default", 5000);
        
        const result = await audioRecorder.stopRecording();
        setIsRecording(false);
        
        console.log(`Recording completed: ${Math.round(result.durationMs / 1000)}s, ${result.audioBlob.size} bytes`);
        
        try {
          // Send to API route for transcription
          const formData = new FormData();
          const audioFile = new File([result.audioBlob], 'recording.webm', { type: result.audioBlob.type });
          formData.append('audio', audioFile);
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          const items = data.items; // Array of items
          const transcriptionText = data.transcription; // Full transcription text
          
          // Print transcription data to console
          console.log("Transcription result (items):", items);
          console.log("Transcription result (text):", transcriptionText);
          console.log("Individual items:");
          items.forEach((item: string, index: number) => {
            console.log(`  ${index + 1}. ${item}`);
          });
          
          // Set transcription data and show confirmation
          setTranscriptionItems(items);
          setTranscription(transcriptionText);
          setShowConfirmation(true);
          checkDietaryAlerts(transcriptionText);
          
          showInternalToast("Transcription complete", "default", 2000);
          
        } catch (transcriptionError) {
          console.error("Transcription failed:", transcriptionError);
          showInternalToast("Transcription failed. Please try again.", "error");
        } finally {
          setIsProcessing(false);
        }
        
      } else {
        // Start recording
        const hasPermission = await audioRecorder.requestPermission();
        if (!hasPermission) {
          showInternalToast("Microphone permission required", "error");
          return;
        }

        await audioRecorder.startRecording({ maxDurationMs: 30000 });
        setIsRecording(true);
        console.log("Recording started...");
        showInternalToast("Recording started. Speak your order clearly...", "default", 2000);
      }
      
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      setIsProcessing(false);
      showInternalToast("Recording failed. Please try again.", "error");
    }
  }, [audioRecorder, isRecording, showInternalToast, checkDietaryAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRecorder.cleanup();
    };
  }, [audioRecorder]);

  // --- UI Event Handlers ---
  const confirmTranscription = useCallback(async () => {
    if (onOrderSubmitted && transcriptionItems.length > 0) {
      setIsSubmitting(true);
      showInternalToast("Submitting order...", "default", 3000);
      
      try {
        await onOrderSubmitted({ 
          items: transcriptionItems, 
          transcription: transcription 
        });
        // Don't reset UI here - let the parent component handle navigation
        // The parent will unmount this component or navigate away
      } catch (error) {
        console.error("Order submission failed:", error);
        setIsSubmitting(false);
        showInternalToast("Failed to submit order. Please try again.", "error");
      }
    }
  }, [transcriptionItems, transcription, onOrderSubmitted, showInternalToast]);

  const cancelTranscription = useCallback(() => {
    resetUI();
    showInternalToast("Order cancelled", "default");
  }, [resetUI, showInternalToast]);

  const handleCancel = useCallback(() => {
    resetUI();
    if (onCancel) {
      onCancel();
    }
  }, [resetUI, onCancel]);

  // --- Rendering Logic ---
  const transcriptionDisplayText = useMemo(() => {
    if (isSubmitting) return "Submitting your order...";
    if (isProcessing) return "Processing audio...";
    if (isRecording) return "Listening... Tap to stop recording";
    if (showConfirmation && transcriptionItems.length > 0) {
      // Show clean list of items instead of raw transcription
      return transcriptionItems.join(" • ");
    }
    if (showConfirmation && transcriptionItems.length === 0) return "No items detected.";
    return `Tap microphone to start recording your ${orderType} order`;
  }, [isRecording, isProcessing, isSubmitting, showConfirmation, transcriptionItems, orderType]);

  const getButtonIcon = () => {
    if (isProcessing || isSubmitting) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isRecording) return <Square className="h-6 w-6 text-red-500 fill-red-500" />;
    return <Mic className="h-6 w-6" />;
  };

  const isButtonDisabled = isProcessing || isSubmitting;

  // --- JSX ---
  return (
    <div className="voice-order-panel p-4 border rounded-lg shadow-md bg-card text-card-foreground flex flex-col items-center space-y-4 max-w-md mx-auto">
      {/* Title/Context */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {tableName} - Seat {seatNumber} ({orderType})
        </p>
      </div>

      {/* Transcription Display Area */}
      <div className="w-full min-h-[80px] p-4 border rounded-md bg-muted text-muted-foreground flex items-center justify-center text-center">
        {showConfirmation && transcriptionItems.length > 0 && !isSubmitting ? (
          <div className="w-full">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Your Order:</p>
            <ul className="space-y-1">
              {transcriptionItems.map((item, index) => (
                <li key={index} className="text-base flex items-center justify-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-lg font-medium">{transcriptionDisplayText}</p>
        )}
      </div>

      {/* Audio Visualization & Recording Indicator */}
      <div className="w-full h-[60px] flex items-center justify-center space-x-1 overflow-hidden">
        {isRecording && Array.from({ length: AUDIO_VISUALIZER_BARS }).map((_, i) => (
          <div
            key={i}
            className="voice-audio-bar w-1 bg-primary rounded-full"
            style={{ height: '5px', transition: 'height 0.1s ease-out' }}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col items-center space-y-3">
        {!showConfirmation ? (
          <div className="flex flex-col items-center space-y-3">
            {/* Recording Button */}
            <motion.div className="relative" whileTap={{ scale: isButtonDisabled ? 1 : 0.95 }} whileHover={{ scale: isButtonDisabled ? 1 : 1.05 }}>
              <Button
                size="lg"
                className={`w-20 h-20 rounded-full shadow-lg ${isRecording ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
                onClick={handleVoiceRecording}
                disabled={isButtonDisabled}
                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {getButtonIcon()}
              </Button>
              {/* Recording pulse animation */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary opacity-75"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.75, 0, 0.75] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </motion.div>
            
            {/* Cancel Button */}
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel Order
            </Button>
          </div>
        ) : (
          // Confirmation Buttons
          <div className="confirmation-buttons w-full flex justify-center space-x-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={cancelTranscription}
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-5 w-5" /> Try Again
            </Button>
            <Button 
              size="lg" 
              onClick={confirmTranscription}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Submit Order
                </>
              )}
            </Button>
          </div>
        )}
      </div>

       {/* Dietary Alerts */}
       {dietaryAlerts.length > 0 && (
            <div className="dietary-alerts w-full p-3 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800">
                <h4 className="font-semibold mb-1"><AlertCircle className="inline-block h-4 w-4 mr-1" /> Potential Dietary Alert:</h4>
                <ul className="list-disc list-inside text-sm">
                    {dietaryAlerts.map(alert => <li key={alert}>{alert.charAt(0).toUpperCase() + alert.slice(1)}</li>)}
                </ul>
            </div>
        )}

    </div>
  );
}
