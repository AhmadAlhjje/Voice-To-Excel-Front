'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, RefreshCw, SkipForward, Check } from 'lucide-react';

interface RowEditorProps {
  sessionId: string;
  rowNumber: number;
  headers: string[];
  initialData: Record<string, string | null>;
  onConfirm: (data: Record<string, string | null>) => void;
  onSkip: () => void;
  onRerecord: () => void;
  isLoading?: boolean;
}

export default function RowEditor({
  sessionId,
  rowNumber,
  headers,
  initialData,
  onConfirm,
  onSkip,
  onRerecord,
  isLoading = false,
}: RowEditorProps) {
  const [editData, setEditData] = useState<Record<string, string | null>>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    setEditData(initialData);
  }, [initialData]);

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleSaveField = () => {
    setEditingField(null);
  };

  const handleConfirm = () => {
    onConfirm(editData);
  };

  const filledFields = Object.entries(editData).filter(
    ([_, value]) => value !== null && value !== ''
  ).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-primary-600" />
          تعديل البيانات - الصف {rowNumber}
        </h2>
        <span className="text-sm text-gray-500">
          {filledFields} من {headers.length} حقول معبأة
        </span>
      </div>

      {/* Editable fields */}
      <div className="space-y-4 mb-6">
        {headers.map((header, index) => (
          <div key={index} className="flex items-center gap-3">
            <label className="w-32 text-sm font-medium text-gray-700 flex-shrink-0">
              {header}:
            </label>
            <div className="flex-1 flex items-center gap-2">
              {editingField === header ? (
                <>
                  <input
                    type="text"
                    value={editData[header] || ''}
                    onChange={(e) => handleFieldChange(header, e.target.value)}
                    className="input-field"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveField();
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                  />
                  <button
                    onClick={handleSaveField}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className={`
                      flex-1 px-4 py-2 rounded-lg border cursor-pointer
                      transition-colors duration-150
                      ${editData[header]
                        ? 'bg-white border-gray-200 hover:border-primary-400'
                        : 'bg-gray-50 border-gray-200 hover:border-primary-400'
                      }
                    `}
                    onClick={() => setEditingField(header)}
                  >
                    {editData[header] || (
                      <span className="text-gray-400 italic">انقر للإدخال</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleConfirm}
          disabled={isLoading || filledFields === 0}
          className="btn-success flex items-center gap-2 flex-1"
        >
          <Save className="w-5 h-5" />
          تأكيد وحفظ
        </button>

        <button
          onClick={onRerecord}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          إعادة التسجيل
        </button>

        <button
          onClick={onSkip}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <SkipForward className="w-5 h-5" />
          تخطي
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <strong>نصيحة:</strong> انقر على أي حقل لتعديله يدوياً قبل التأكيد
      </div>
    </div>
  );
}
