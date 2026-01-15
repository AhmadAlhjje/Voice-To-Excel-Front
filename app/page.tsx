'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Clock,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ServiceStatus {
  whisper: { loaded: boolean };
  llm: { healthy: boolean };
  overall_healthy: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        const data = await response.json();
        setServiceStatus({
          whisper: { loaded: data.services.whisper === 'loaded' },
          llm: { healthy: data.services.ollama === 'available' },
          overall_healthy: data.status === 'healthy',
        });
      }
    } catch (error) {
      setServiceStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const createNewSession = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء جلسة جديدة');
      }

      const data = await response.json();
      router.push(`/session/${data.session_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          مرحباً بك في Voice To Excel
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          نظام إدخال بيانات صوتي يعمل بالكامل Offline
          <br />
          حوّل صوتك إلى بيانات Excel بسهولة
        </p>
      </div>

      {/* Service Status */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          حالة الخدمات
        </h2>

        {statusLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : serviceStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Backend Status */}
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">الخادم</p>
                <p className="text-sm text-green-600">متصل</p>
              </div>
            </div>

            {/* Whisper Status */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              serviceStatus.whisper.loaded ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              {serviceStatus.whisper.loaded ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className={`font-medium ${
                  serviceStatus.whisper.loaded ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  Whisper
                </p>
                <p className={`text-sm ${
                  serviceStatus.whisper.loaded ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {serviceStatus.whisper.loaded ? 'جاهز' : 'جاري التحميل'}
                </p>
              </div>
            </div>

            {/* LLM Status */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              serviceStatus.llm.healthy ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {serviceStatus.llm.healthy ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  serviceStatus.llm.healthy ? 'text-green-800' : 'text-red-800'
                }`}>
                  Ollama (LLM)
                </p>
                <p className={`text-sm ${
                  serviceStatus.llm.healthy ? 'text-green-600' : 'text-red-600'
                }`}>
                  {serviceStatus.llm.healthy ? 'متصل' : 'غير متصل'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">الخادم غير متصل</p>
              <p className="text-sm text-red-600">
                تأكد من تشغيل الخادم على المنفذ 8000
              </p>
            </div>
          </div>
        )}

        <button
          onClick={checkServiceStatus}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700"
        >
          إعادة الفحص
        </button>
      </div>

      {/* Create Session Button */}
      <div className="card text-center">
        <FileSpreadsheet className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ابدأ جلسة جديدة
        </h2>
        <p className="text-gray-600 mb-6">
          ارفع ملف Excel وابدأ بإدخال البيانات صوتياً
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={createNewSession}
          disabled={isCreating || !serviceStatus?.overall_healthy}
          className={`
            btn-primary inline-flex items-center gap-2 text-lg px-8 py-3
            ${(!serviceStatus?.overall_healthy) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              إنشاء جلسة جديدة
            </>
          )}
        </button>

        {!serviceStatus?.overall_healthy && serviceStatus !== null && (
          <p className="mt-4 text-sm text-yellow-600">
            بعض الخدمات غير متاحة. تأكد من تشغيل Ollama.
          </p>
        )}
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            تحويل الصوت للنص
          </h3>
          <p className="text-gray-600 text-sm">
            تحويل دقيق للكلام العربي باستخدام Whisper
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            فهم ذكي للنص
          </h3>
          <p className="text-gray-600 text-sm">
            استخراج البيانات وربطها بالأعمدة تلقائياً
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            يعمل Offline
          </h3>
          <p className="text-gray-600 text-sm">
            جميع البيانات تُعالج محلياً - لا حاجة للإنترنت
          </p>
        </div>
      </div>
    </div>
  );
}
