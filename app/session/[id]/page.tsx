'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3
} from 'lucide-react';

import ExcelUploader from '@/components/ExcelUploader';
import AudioRecorder from '@/components/AudioRecorder';
import DataPreview from '@/components/DataPreview';
import RowEditor from '@/components/RowEditor';

interface SessionData {
  session_id: string;
  status: string;
  excel_file: {
    original_name: string;
    headers: string[];
    total_rows: number;
    current_row: number;
  } | null;
}

interface ExtractedData {
  transcription: string;
  extractedData: Record<string, string | null>;
  confidence: number;
}

type Step = 'upload' | 'record' | 'preview' | 'edit';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/sessions/${sessionId}`
      );

      if (!response.ok) {
        throw new Error('الجلسة غير موجودة');
      }

      const data = await response.json();
      setSession(data);

      // Determine initial step
      if (data.excel_file) {
        setCurrentStep('record');
      } else {
        setCurrentStep('upload');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ في تحميل الجلسة');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (data: {
    filename: string;
    headers: string[];
    totalRows: number;
  }) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            excel_file: {
              original_name: data.filename,
              headers: data.headers,
              total_rows: data.totalRows,
              current_row: 1,
            },
          }
        : null
    );
    setCurrentStep('record');
    setSuccessMessage('تم رفع الملف بنجاح!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUploadError = (error: string) => {
    setError(error);
    setTimeout(() => setError(null), 5000);
  };

  const handleRecordingComplete = (data: ExtractedData) => {
    setExtractedData(data);
    setCurrentStep('edit');
  };

  const handleConfirm = async (data: Record<string, string | null>) => {
    if (!session?.excel_file) return;

    setIsConfirming(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/rows/${sessionId}/${session.excel_file.current_row}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
            auto_advance: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('فشل في حفظ البيانات');
      }

      const result = await response.json();

      // Update session with new current row
      setSession((prev) =>
        prev && prev.excel_file
          ? {
              ...prev,
              excel_file: {
                ...prev.excel_file,
                current_row: result.next_row || prev.excel_file.current_row + 1,
              },
            }
          : null
      );

      setExtractedData(null);
      setCurrentStep('record');
      setSuccessMessage(`تم حفظ الصف ${session.excel_file.current_row} بنجاح!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ في الحفظ');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSkip = async () => {
    if (!session?.excel_file) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/rows/${sessionId}/skip`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('فشل في تخطي الصف');
      }

      const result = await response.json();

      setSession((prev) =>
        prev && prev.excel_file
          ? {
              ...prev,
              excel_file: {
                ...prev.excel_file,
                current_row: result.current_row,
              },
            }
          : null
      );

      setExtractedData(null);
      setCurrentStep('record');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطأ');
    }
  };

  const handleRerecord = () => {
    setExtractedData(null);
    setCurrentStep('record');
  };

  const handleDownload = () => {
    if (session) {
      window.open(
        `http://localhost:8000/api/v1/excel/download/${sessionId}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            الجلسة غير موجودة
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'لم يتم العثور على الجلسة المطلوبة'}
          </p>
          <button onClick={() => router.push('/')} className="btn-primary">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowRight className="w-5 h-5" />
          العودة
        </button>

        <div className="flex items-center gap-4">
          {session.excel_file && (
            <>
              <div className="text-sm text-gray-600">
                <span className="font-medium">الصف الحالي:</span>{' '}
                {session.excel_file.current_row}
              </div>
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تحميل الملف
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Progress indicator */}
      {session.excel_file && (
        <div className="mb-6 card">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">التقدم</span>
                <span className="font-medium text-gray-800">
                  الصف {session.excel_file.current_row}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      ((session.excel_file.current_row - 1) /
                        Math.max(session.excel_file.total_rows || 10, 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {currentStep === 'upload' && (
            <ExcelUploader
              sessionId={sessionId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          )}

          {(currentStep === 'record' || currentStep === 'edit') &&
            session.excel_file && (
              <AudioRecorder
                sessionId={sessionId}
                rowNumber={session.excel_file.current_row}
                headers={session.excel_file.headers}
                onRecordingComplete={handleRecordingComplete}
                onError={handleUploadError}
                disabled={currentStep === 'edit'}
              />
            )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {extractedData && session.excel_file && (
            <>
              <DataPreview
                transcription={extractedData.transcription}
                confidence={extractedData.confidence}
                extractedData={extractedData.extractedData}
                headers={session.excel_file.headers}
              />

              <RowEditor
                sessionId={sessionId}
                rowNumber={session.excel_file.current_row}
                headers={session.excel_file.headers}
                initialData={extractedData.extractedData}
                onConfirm={handleConfirm}
                onSkip={handleSkip}
                onRerecord={handleRerecord}
                isLoading={isConfirming}
              />
            </>
          )}

          {!extractedData && session.excel_file && currentStep === 'record' && (
            <div className="card text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                ابدأ التسجيل الصوتي
              </h3>
              <p className="text-gray-500">
                انقر على زر التسجيل وانطق البيانات المطلوبة
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
