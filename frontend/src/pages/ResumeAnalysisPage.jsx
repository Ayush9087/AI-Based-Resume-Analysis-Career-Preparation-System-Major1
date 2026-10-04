import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ResumeDashboard from '../components/ResumeDashboard';
import { useAuth } from '../context/AuthContext';

const maximumFileSize = 10 * 1024 * 1024;
const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResumeAnalysisPage() {
  const { session } = useAuth();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [analyzingResumeId, setAnalyzingResumeId] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [analysisErrorId, setAnalysisErrorId] = useState('');
  const [previewLoadingId, setPreviewLoadingId] = useState('');
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (!session?.access_token) return undefined;

    const abortController = new AbortController();

    fetch(`${apiBaseUrl}/resumes`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: abortController.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Could not load saved resumes.');
        return payload.data;
      })
      .then((data) => {
        setListError('');
        setResumes(data);
        setSelectedResumeId((current) => (
          data.some((resume) => resume.id === current) ? current : (data[0]?.id ?? '')
        ));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setListError(error.message || 'Could not load saved resumes.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) setListLoading(false);
      });

    return () => abortController.abort();
  }, [session?.access_token, refreshCount]);

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId) ?? null;

  const runAnalysis = async (resumeId) => {
    setAnalyzingResumeId(resumeId);
    setAnalysisError('');
    setAnalysisErrorId('');

    try {
      const response = await fetch(`${apiBaseUrl}/resume/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Resume analysis failed.');

      setResumes((current) => current.map((resume) => (
        resume.id === resumeId
          ? {
              ...resume,
              analysis_data: payload.data.analysis,
              score: payload.data.analysis.overallScore,
              updated_at: payload.data.analyzedAt,
            }
          : resume
      )));
    } catch (error) {
      setAnalysisError(error.message || 'Could not reach the analysis service. Please try again.');
      setAnalysisErrorId(resumeId);
    } finally {
      setAnalyzingResumeId('');
    }
  };

  const viewResume = async (resumeId) => {
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setPreviewError('Allow pop-ups to open the uploaded resume.');
      return;
    }
    previewWindow.opener = null;
    setPreviewLoadingId(resumeId);
    setPreviewError('');

    try {
      const response = await fetch(`${apiBaseUrl}/resumes/${resumeId}/view`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Could not open this resume.');
      previewWindow.location.replace(payload.data.signedUrl);
    } catch (error) {
      previewWindow.close();
      setPreviewError(error.message || 'Could not open this resume.');
    } finally {
      setPreviewLoadingId('');
    }
  };

  const chooseFile = (nextFile) => {
    setMessage('');
    if (!nextFile) return;

    const extension = nextFile.name.split('.').pop()?.toLowerCase();
    const expectedMime = extension === 'pdf' ? 'application/pdf' : docxMimeType;
    if (!['pdf', 'docx'].includes(extension) || (nextFile.type && nextFile.type !== expectedMime && nextFile.type !== 'application/octet-stream')) {
      setFile(null);
      setStatus('error');
      setMessage('Choose a PDF or DOCX file.');
      return;
    }

    if (nextFile.size === 0) {
      setFile(null);
      setStatus('error');
      setMessage('The selected file is empty. Choose another resume.');
      return;
    }

    if (nextFile.size > maximumFileSize) {
      setFile(null);
      setStatus('error');
      setMessage('The resume must be 10 MB or smaller.');
      return;
    }

    setFile(nextFile);
    setStatus('ready');
    setProgress(0);
  };

  const handleUpload = () => {
    if (!file || !session?.access_token) {
      setStatus('error');
      setMessage('Your session is unavailable. Sign in again and retry.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    setStatus('uploading');
    setProgress(0);
    setMessage('');

    const request = new XMLHttpRequest();
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
    request.open('POST', `${apiBaseUrl}/resumes/upload`);
    request.setRequestHeader('Authorization', `Bearer ${session.access_token}`);

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });
    request.upload.addEventListener('load', () => {
      setStatus('processing');
      setProgress(100);
    });
    request.addEventListener('load', () => {
      let response;
      try {
        response = JSON.parse(request.responseText);
      } catch {
        response = null;
      }

      if (request.status >= 200 && request.status < 300 && response?.success) {
        const uploadedResume = {
          id: response.data.id,
          original_name: response.data.originalName,
          file_type: file.type,
          status: response.data.status,
          parsed_data: response.data.extracted,
          analysis_data: null,
          score: null,
          created_at: null,
          updated_at: null,
        };
        setResumes((current) => [uploadedResume, ...current.filter((resume) => resume.id !== uploadedResume.id)]);
        setSelectedResumeId(uploadedResume.id);
        setStatus('success');
        void runAnalysis(response.data.id);
        return;
      }

      setStatus('error');
      setMessage(response?.message || 'Resume upload failed. Please try again.');
    });
    request.addEventListener('error', () => {
      setStatus('error');
      setMessage('Could not reach the upload service. Check that the backend is running and try again.');
    });
    request.send(formData);
  };

  const resetUpload = () => {
    setFile(null);
    setMessage('');
    setProgress(0);
    setStatus('idle');
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <AppLayout title="Resume Analysis" subtitle="Review your saved resume scores, skills, and improvement feedback.">
      <div className="mx-auto max-w-7xl space-y-5">
        <Card title="Add a resume" subtitle="Files are private and can only be accessed by your account.">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files?.[0]);
            }}
            className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition-colors hover:border-primary-400"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-primary-700 shadow-sm" aria-hidden="true">
              PDF
            </div>
            <p className="mt-4 font-semibold text-slate-800">Drop your resume here</p>
            <p className="mt-1 text-sm text-slate-500">PDF or DOCX, up to 10 MB</p>
            <Button className="mt-5" onClick={() => fileInput.current?.click()}>Choose file</Button>
          </div>

          {file && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              {status === 'ready' && <Button onClick={handleUpload}>Upload resume</Button>}
            </div>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <div className="mt-5" aria-live="polite">
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>{status === 'uploading' ? 'Uploading resume...' : 'Extracting resume details...'}</span>
                <span>{progress}%</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label="Resume upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div className="h-full rounded-full bg-primary-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {message}
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" role="status">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Resume processed</p>
                <p className="text-sm text-emerald-700">{selectedResume?.original_name}</p>
              </div>
              <Button variant="secondary" onClick={resetUpload}>Upload another</Button>
            </div>
          )}
        </Card>

        {previewError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{previewError}</p>}

        <ResumeDashboard
          resumes={resumes}
          resume={selectedResume}
          loading={listLoading}
          loadError={listError}
          onRefresh={() => {
            setListLoading(true);
            setListError('');
            setRefreshCount((count) => count + 1);
          }}
          onSelect={(resumeId) => {
            setSelectedResumeId(resumeId);
            setAnalysisError('');
            setAnalysisErrorId('');
          }}
          onAnalyze={runAnalysis}
          analyzing={Boolean(selectedResume && analyzingResumeId === selectedResume.id)}
          analysisError={analysisErrorId === selectedResume?.id ? analysisError : ''}
          onView={viewResume}
          previewLoading={Boolean(selectedResume && previewLoadingId === selectedResume.id)}
        />
      </div>
    </AppLayout>
  );
}