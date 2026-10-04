import { randomUUID } from 'node:crypto';
import { extractResumeData } from '../services/resumeParser.js';
import { ensureResumeOwnerProfile } from '../services/resumeOwnerProfile.js';

const bucketName = 'resume-files';
const mimeTypes = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function validateFileSignature(file, extension) {
  if (extension === 'pdf') return file.buffer.subarray(0, 5).toString() === '%PDF-';
  return file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
}

export async function uploadResume(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Choose a PDF or DOCX resume to upload.' });
  }

  const safeOriginalName = req.file.originalname
    .replace(/[\\/]/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 255);
  const extension = safeOriginalName.split('.').pop()?.toLowerCase();
  if (!['pdf', 'docx'].includes(extension) || !validateFileSignature(req.file, extension)) {
    return res.status(400).json({ success: false, message: 'The file contents do not match a valid PDF or DOCX document.' });
  }

  const fileType = mimeTypes[extension];
  const storagePath = `${req.user.id}/${randomUUID()}.${extension}`;
  let resumeId;
  let storageUploaded = false;

  try {
    await ensureResumeOwnerProfile(req.supabase, req.user);

    const { error: uploadError } = await req.supabase.storage
      .from(bucketName)
      .upload(storagePath, req.file.buffer, { contentType: fileType, upsert: false });

    if (uploadError) throw uploadError;
    storageUploaded = true;

    const { data: resume, error: insertError } = await req.supabase
      .from('resumes')
      .insert({
        user_id: req.user.id,
        file_name: `${randomUUID()}.${extension}`,
        original_name: safeOriginalName,
        storage_path: storagePath,
        file_type: fileType,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    resumeId = resume.id;

    let extracted;
    try {
      extracted = await extractResumeData(req.file.buffer, fileType);
    } catch (error) {
      const { error: statusError } = await req.supabase
        .from('resumes')
        .update({ status: 'failed', summary: error.message })
        .eq('id', resumeId)
        .eq('user_id', req.user.id);
      if (statusError) throw statusError;
      throw error;
    }

    const { error: updateError } = await req.supabase
      .from('resumes')
      .update({
        status: 'processed',
        parsed_data: extracted,
        summary: `Extracted ${Object.values(extracted).reduce((total, value) => total + (Array.isArray(value) ? value.length : Number(Boolean(value))), 0)} resume details.`,
      })
      .eq('id', resumeId);

    if (updateError) throw updateError;

    return res.status(201).json({
      success: true,
      data: {
        id: resumeId,
        originalName: req.file.originalname,
        status: 'processed',
        extracted,
      },
    });
  } catch (error) {
    if (storageUploaded && !resumeId) {
      await req.supabase.storage.from(bucketName).remove([storagePath]);
    }
    return next(error);
  }
}

export async function listResumes(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('resumes')
      .select('id, original_name, file_type, status, score, summary, parsed_data, analysis_data, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getResumePreview(req, res, next) {
  try {
    const { data: resume, error: fetchError } = await req.supabase
      .from('resumes')
      .select('storage_path')
      .eq('id', req.params.resumeId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const { data, error } = await req.supabase.storage
      .from(bucketName)
      .createSignedUrl(resume.storage_path, 60);

    if (error) throw error;
    return res.json({ success: true, data: { signedUrl: data.signedUrl } });
  } catch (error) {
    return next(error);
  }
}