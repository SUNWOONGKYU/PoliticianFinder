/**
 * Utils Index - Central export point for utility functions
 * Project Grid: Multiple tasks
 */

// File Upload Utilities (P4BA4)
export {
  // Main functions
  uploadPostAttachment,
  uploadMultipleAttachments,
  validateFile,
  deleteAttachment,
  deletePostAttachments,

  // Helper functions
  getFileExtension,
  getFileCategory,
  generateSafeFilename,
  generateStoragePath,
  getAllowedExtensions,
  getAllowedMimeTypes,
  getMaxFileSizeMB,
  getFileTypeConfig,

  // Types
  type FileUploadOptions,
  type FileUploadResult,
  type FileValidationResult,
  FileCategory,
  ERROR_CODES,
} from './file-upload';
