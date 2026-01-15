'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface ExcelUploaderProps {
  sessionId: string;
  onUploadSuccess: (data: {
    filename: string;
    headers: string[];
    totalRows: number;
  }) => void;
  onUploadError: (error: string) => void;
}

export default function ExcelUploader({
  sessionId,
  onUploadSuccess,
  onUploadError,
}: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      onUploadError('يرجى رفع ملف Excel صالح (.xlsx أو .xls)');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `http://localhost:8000/api/v1/excel/upload/${sessionId}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'فشل في رفع الملف');
      }

      const data = await response.json();
      setUploadedFile(file.name);
      onUploadSuccess({
        filename: data.filename,
        headers: data.headers,
        totalRows: data.total_rows,
      });
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'خطأ في رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
        رفع ملف Excel
      </h2>

      {uploadedFile ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">تم رفع الملف بنجاح</p>
            <p className="text-sm text-green-600">{uploadedFile}</p>
          </div>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 spinner" />
              <p className="text-gray-600">جاري رفع الملف...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  اسحب الملف هنا أو انقر للاختيار
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  يدعم ملفات Excel (.xlsx, .xls)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">ملاحظات مهمة:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>يجب أن يحتوي الصف الأول على عناوين الأعمدة</li>
          <li>سيتم قراءة العناوين لربط البيانات الصوتية</li>
          <li>يمكنك إضافة بيانات في الصفوف الفارغة</li>
        </ul>
      </div>
    </div>
  );
}
