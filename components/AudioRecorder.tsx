'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  sessionId: string;
  rowNumber: number;
  headers: string[];
  onRecordingComplete: (data: {
    transcription: string;
    extractedData: Record<string, string | null>;
    confidence: number;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function AudioRecorder({
  sessionId,
  rowNumber,
  headers,
  onRecordingComplete,
  onError,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualization
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop visualization
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      onError('لا يمكن الوصول إلى الميكروفون. يرجى السماح بالوصول.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('row_number', rowNumber.toString());

      const response = await fetch(
        `http://localhost:8000/api/v1/audio/process/${sessionId}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'فشل في معالجة الصوت');
      }

      const data = await response.json();

      onRecordingComplete({
        transcription: data.transcription,
        extractedData: data.extracted_data,
        confidence: data.transcription_confidence,
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'خطأ في معالجة الصوت');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Mic className="w-6 h-6 text-primary-600" />
        تسجيل صوتي
      </h2>

      <div className="flex flex-col items-center gap-6 py-6">
        {/* Recording button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-200
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 recording-pulse'
              : 'bg-primary-600 hover:bg-primary-700'
            }
            ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        {/* Status text */}
        <div className="text-center">
          {isProcessing ? (
            <p className="text-lg font-medium text-gray-600">
              جاري معالجة الصوت...
            </p>
          ) : isRecording ? (
            <>
              <p className="text-lg font-medium text-red-600">جاري التسجيل</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatTime(recordingTime)}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-600">
              انقر للبدء بالتسجيل
            </p>
          )}
        </div>

        {/* Audio level indicator */}
        {isRecording && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Headers display */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">الأعمدة المتاحة:</h3>
        <div className="flex flex-wrap gap-2">
          {headers.map((header, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600"
            >
              {header}
            </span>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          طريقة النطق:
        </h3>
        <p className="text-sm text-yellow-700">
          انطق اسم العمود ثم قيمته. مثال: "الاسم محمد، الرقم خمسة وأربعون، الهاتف صفر تسعة تسعة ثمانية..."
        </p>
      </div>
    </div>
  );
}
