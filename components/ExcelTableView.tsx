'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Save,
  Download,
  RefreshCw,
  Check,
  X,
  Edit3,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

interface RowData {
  row_number: number;
  data: Record<string, string | null>;
  status: string;
  written_to_excel: boolean;
}

interface ExcelTableViewProps {
  sessionId: string;
  onDownload: () => void;
}

export default function ExcelTableView({
  sessionId,
  onDownload,
}: ExcelTableViewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowNumber: number;
    header: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingRow, setSavingRow] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/rows/${sessionId}`
      );
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      const data = await response.json();
      setHeaders(data.headers || []);
      setRows(data.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const startEditing = (rowNumber: number, header: string, value: string | null) => {
    setEditingCell({ rowNumber, header });
    setEditValue(value || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveCell = async () => {
    if (!editingCell) return;

    const row = rows.find((r) => r.row_number === editingCell.rowNumber);
    if (!row) return;

    setSavingRow(editingCell.rowNumber);

    try {
      const updatedData = {
        ...row.data,
        [editingCell.header]: editValue || null,
      };

      const response = await fetch(
        `http://localhost:8000/api/v1/rows/${sessionId}/${editingCell.rowNumber}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) {
        throw new Error('فشل في حفظ التعديلات');
      }

      // Update local state - mark as written since it's now saved to Excel
      setRows((prev) =>
        prev.map((r) =>
          r.row_number === editingCell.rowNumber
            ? { ...r, data: updatedData, status: 'written', written_to_excel: true }
            : r
        )
      );

      setEditingCell(null);
      setEditValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSavingRow(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveCell();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'written':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'written':
        return 'محفوظ';
      case 'confirmed':
        return 'مؤكد';
      case 'draft':
        return 'مسودة';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="mr-3 text-gray-600">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-6 h-6 ml-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileSpreadsheet className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg">لا توجد بيانات مسجلة بعد</p>
          <p className="text-sm mt-2">ابدأ بتسجيل الصوت لإضافة بيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Table className="w-6 h-6 text-primary-600" />
          معاينة البيانات
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchRows}
            className="btn-secondary flex items-center gap-2"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onDownload}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل Excel
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        انقر على أي خلية للتعديل المباشر. اضغط Enter للحفظ أو Escape للإلغاء.
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-b border-l border-gray-200 px-4 py-3 text-right font-bold text-gray-700 w-16">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-l border-gray-200 px-4 py-3 text-right font-bold text-gray-700 min-w-[150px]"
                >
                  {header}
                </th>
              ))}
              <th className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-700 w-24">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.row_number}
                className={`hover:bg-gray-50 ${
                  row.written_to_excel ? 'bg-green-50/50' : ''
                }`}
              >
                <td className="border-b border-l border-gray-200 px-4 py-2 text-center font-medium text-gray-600">
                  {row.row_number}
                </td>
                {headers.map((header) => {
                  const isEditing =
                    editingCell?.rowNumber === row.row_number &&
                    editingCell?.header === header;
                  const value = row.data[header];

                  return (
                    <td
                      key={`${row.row_number}-${header}`}
                      className="border-b border-l border-gray-200 px-2 py-1"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-2 py-1 border border-primary-400 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                            autoFocus
                            dir="rtl"
                          />
                          <button
                            onClick={saveCell}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            disabled={savingRow === row.row_number}
                          >
                            {savingRow === row.row_number ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            startEditing(row.row_number, header, value)
                          }
                          className="px-2 py-1 min-h-[32px] cursor-pointer hover:bg-blue-50 rounded group flex items-center justify-between"
                        >
                          <span
                            className={`${
                              value ? 'text-gray-800' : 'text-gray-400 italic'
                            }`}
                          >
                            {value || 'فارغ'}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-gray-200 px-2 py-2 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      row.status
                    )}`}
                  >
                    {getStatusText(row.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>إجمالي الصفوف: {rows.length}</span>
        <span>
          محفوظ: {rows.filter((r) => r.written_to_excel).length} / {rows.length}
        </span>
      </div>
    </div>
  );
}
