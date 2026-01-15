/**
 * API client for Voice To Excel backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Session {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  excel_file: ExcelFileInfo | null;
  settings: SessionSettings;
}

export interface ExcelFileInfo {
  original_name: string;
  stored_path: string;
  headers: string[];
  total_rows: number;
  current_row: number;
}

export interface SessionSettings {
  language: string;
  auto_advance: boolean;
}

export interface ProcessingResult {
  success: boolean;
  session_id: string;
  row_number: number;
  transcription: string;
  extracted_data: Record<string, string | null>;
  headers: string[];
  transcription_confidence: number;
  processing_time_ms: {
    whisper: number;
    llm: number;
  };
}

export interface RowData {
  session_id: string;
  row_number: number;
  exists: boolean;
  original_transcription?: string;
  extracted_data?: Record<string, string | null>;
  final_data?: Record<string, string | null>;
  status?: string;
  written_to_excel?: boolean;
  headers: string[];
}

export interface SessionStats {
  session_id: string;
  status: string;
  current_row: number;
  total_rows: number;
  rows_draft: number;
  rows_confirmed: number;
  rows_written: number;
  unresolved_errors: number;
}

// Session APIs
export const sessionApi = {
  create: async (): Promise<{ session_id: string; status: string }> => {
    const response = await api.post('/sessions/');
    return response.data;
  },

  get: async (sessionId: string): Promise<Session> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  getStats: async (sessionId: string): Promise<SessionStats> => {
    const response = await api.get(`/sessions/${sessionId}/stats`);
    return response.data;
  },

  complete: async (sessionId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/complete`);
  },
};

// Excel APIs
export const excelApi = {
  upload: async (sessionId: string, file: File): Promise<{
    message: string;
    session_id: string;
    filename: string;
    headers: string[];
    total_rows: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/excel/upload/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getHeaders: async (sessionId: string): Promise<{
    headers: string[];
    total_rows: number;
    current_row: number;
  }> => {
    const response = await api.get(`/excel/headers/${sessionId}`);
    return response.data;
  },

  download: (sessionId: string): string => {
    return `${API_BASE_URL}/excel/download/${sessionId}`;
  },

  createBackup: async (sessionId: string): Promise<{ backup_path: string }> => {
    const response = await api.post(`/excel/backup/${sessionId}`);
    return response.data;
  },
};

// Audio APIs
export const audioApi = {
  process: async (
    sessionId: string,
    audioBlob: Blob,
    rowNumber?: number
  ): Promise<ProcessingResult> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    if (rowNumber !== undefined) {
      formData.append('row_number', rowNumber.toString());
    }

    const response = await api.post(`/audio/process/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  transcribeOnly: async (
    sessionId: string,
    audioBlob: Blob
  ): Promise<{
    success: boolean;
    transcription: string;
    confidence: number;
    processing_time_ms: number;
  }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    const response = await api.post(`/audio/transcribe/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  checkHealth: async (): Promise<{
    whisper: { loaded: boolean };
    llm: { healthy: boolean };
    overall_healthy: boolean;
  }> => {
    const response = await api.get('/audio/health');
    return response.data;
  },
};

// Row APIs
export const rowApi = {
  get: async (sessionId: string, rowNumber: number): Promise<RowData> => {
    const response = await api.get(`/rows/${sessionId}/${rowNumber}`);
    return response.data;
  },

  update: async (
    sessionId: string,
    rowNumber: number,
    data: Record<string, string | null>
  ): Promise<{ success: boolean; final_data: Record<string, string | null> }> => {
    const response = await api.patch(`/rows/${sessionId}/${rowNumber}`, { data });
    return response.data;
  },

  confirm: async (
    sessionId: string,
    rowNumber: number,
    data: Record<string, string | null>,
    autoAdvance: boolean = true
  ): Promise<{
    success: boolean;
    row_number: number;
    status: string;
    next_row: number | null;
  }> => {
    const response = await api.post(`/rows/${sessionId}/${rowNumber}/confirm`, {
      data,
      auto_advance: autoAdvance,
    });
    return response.data;
  },

  correct: async (
    sessionId: string,
    rowNumber: number,
    correctionText: string
  ): Promise<{
    success: boolean;
    corrected_data: Record<string, string | null>;
  }> => {
    const response = await api.post(`/rows/${sessionId}/${rowNumber}/correct`, {
      correction_text: correctionText,
    });
    return response.data;
  },

  skip: async (sessionId: string): Promise<{ current_row: number }> => {
    const response = await api.post(`/rows/${sessionId}/skip`);
    return response.data;
  },

  goTo: async (sessionId: string, rowNumber: number): Promise<{ current_row: number }> => {
    const response = await api.post(`/rows/${sessionId}/goto/${rowNumber}`);
    return response.data;
  },
};

export default api;
