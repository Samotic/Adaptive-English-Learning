import React, { useEffect } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { Mic, MicOff, AlertCircle, Check } from 'lucide-react';

/**
 * Voice Input Component for Speaking Module
 * FR23: Accept and analyze voice input for speaking skills
 */
export default function VoiceInput({ onTranscriptChange, autoSubmit = false, placeholder = "Click the microphone to start speaking..." }) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  useEffect(() => {
    // Update parent component with transcript
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }

    // Auto-submit when user stops speaking (optional)
    if (autoSubmit && transcript && !isListening && !interimTranscript) {
      // Transcript is final and listening stopped
    }
  }, [transcript, isListening, interimTranscript]); // Omit callbacks from deps to avoid infinite loops

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    resetTranscript();
    if (onTranscriptChange) {
      onTranscriptChange('');
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-unsupported">
        <AlertCircle size={24} color="#e74c3c" />
        <p className="voice-error-text">
          Speech recognition is not supported in this browser.
          <br />
          Please use Chrome, Edge, or Safari for voice input.
        </p>
      </div>
    );
  }

  return (
    <div className="voice-input-container">
      {/* Microphone Button */}
      <div className="voice-controls">
        <button
          type="button"
          onClick={handleToggle}
          className={`voice-mic-btn ${isListening ? 'active' : ''}`}
          title={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isListening ? (
            <>
              <MicOff size={32} />
              <span className="voice-btn-text">Stop</span>
            </>
          ) : (
            <>
              <Mic size={32} />
              <span className="voice-btn-text">Speak</span>
            </>
          )}
        </button>

        {transcript && (
          <button
            type="button"
            onClick={handleReset}
            className="voice-reset-btn"
            title="Clear transcript"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="voice-listening-indicator">
          <div className="voice-pulse"></div>
          <span className="voice-listening-text">Listening...</span>
        </div>
      )}

      {/* Transcript Display */}
      <div className="voice-transcript-box">
        {transcript || interimTranscript ? (
          <>
            <div className="voice-final-transcript">
              {transcript}
              {interimTranscript && (
                <span className="voice-interim-transcript">{interimTranscript}</span>
              )}
            </div>
            {transcript && !isListening && (
              <div className="voice-complete-badge">
                <Check size={16} />
                <span>Recording complete</span>
              </div>
            )}
          </>
        ) : (
          <p className="voice-placeholder">{placeholder}</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="voice-error-box">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="voice-instructions">
        <p className="voice-instruction-text">
          💡 <strong>Tips:</strong> Speak clearly at normal pace. Use Chrome/Edge/Safari. Check microphone permissions and ensure it's not muted. If no-speech error, speak louder.
        </p>
      </div>
    </div>
  );
}
