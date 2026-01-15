'use client';

import React from 'react';
import { FileText, CheckCircle, Clock } from 'lucide-react';

interface DataPreviewProps {
  transcription: string;
  confidence: number;
  extractedData: Record<string, string | null>;
  headers: string[];
}

export default function DataPreview({
  transcription,
  confidence,
  extractedData,
  headers,
}: DataPreviewProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'ممتاز';
    if (conf >= 0.5) return 'جيد';
    return 'ضعيف';
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary-600" />
        معاينة البيانات
      </h2>

      {/* Transcription */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-700">النص المحول:</h3>
          <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
            الدقة: {(confidence * 100).toFixed(0)}% ({getConfidenceLabel(confidence)})
          </span>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-800 leading-relaxed">
            {transcription || 'لا يوجد نص'}
          </p>
        </div>
      </div>

      {/* Extracted Data */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3">البيانات المستخرجة:</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>العمود</th>
                <th>القيمة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header, index) => {
                const value = extractedData[header];
                const hasValue = value !== null && value !== undefined && value !== '';

                return (
                  <tr key={index}>
                    <td className="font-medium text-gray-700">{header}</td>
                    <td>
                      {hasValue ? (
                        <span className="text-gray-800">{value}</span>
                      ) : (
                        <span className="text-gray-400 italic">فارغ</span>
                      )}
                    </td>
                    <td>
                      {hasValue ? (
                        <span className="badge badge-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          تم
                        </span>
                      ) : (
                        <span className="badge badge-warning flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          غير محدد
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
