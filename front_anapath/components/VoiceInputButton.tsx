'use client';

import { useEffect, useRef, useState } from 'react';

interface VoiceInputButtonProps {
  /** Appelé avec chaque segment de texte reconnu (définitif) — à concaténer au champ ciblé. */
  onResult: (text: string) => void;
  className?: string;
}

/** Bouton micro : dictée vocale en français via l'API navigateur (Chrome). Invisible si non supportée. */
export default function VoiceInputButton({ onResult, className = '' }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) onResult(finalTranscript.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Arrêter la dictée' : 'Dicter (transcription vocale)'}
      className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-[11px] font-semibold ${
        listening ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      } ${className}`}
    >
      <span className={`material-symbols-outlined text-base ${listening ? 'animate-pulse' : ''}`}>
        {listening ? 'mic' : 'mic_none'}
      </span>
      {listening ? 'Écoute...' : 'Dicter'}
    </button>
  );
}
