'use client';

import React, { useState, useCallback } from 'react';
import {
    Upload,
    File,
    X,
    CheckCircle,
    AlertCircle,
    FileText,
    Download,
    Eye
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface ResumeUploadProps {
    onUploadComplete?: (result: UploadResult) => void;
    onUploadError?: (error: string) => void;
    maxFileSize?: number; // in MB
    acceptedFormats?: string[];
    className?: string;
}

interface UploadResult {
    resumeId: string;
    fileName: string;
    parsedData: any;
}

interface UploadedFile {
    file: File;
    id: string;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    preview?: string;
}

const ACCEPTED_FORMATS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE = 10; // MB

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
    onUploadComplete,
    onUploadError,
    maxFileSize = MAX_FILE_SIZE,
    acceptedFormats = ACCEPTED_FORMATS,
    className,
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const validateFile = (file: File): string | null => {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFormats.includes(fileExtension)) {
            return `File type ${fileExtension} not supported. Please upload ${acceptedFormats.join(', ')} files.`;
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxFileSize) {
            return `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxFileSize}MB).`;
        }

        return null;
    };

    const simulateUpload = async (file: File): Promise<UploadResult> => {
        // Simulate file processing with delays
        await new Promise(resolve => setTimeout(resolve, 1500)); // Upload delay

        // Simulate parsing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return mock parsed data
        return {
            resumeId: `resume_${Date.now()}`,
            fileName: file.name,
            parsedData: {
                name: 'John Doe',
                email: 'john.doe@example.com',
                experience: ['Software Engineer at TechCorp', 'Developer at StartupXYZ'],
                skills: ['JavaScript', 'React', 'Node.js', 'Python'],
                education: ['BS Computer Science - University of Technology']
            }
        };
    };

    const processFile = async (file: File) => {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Add file to upload list
        const newFile: UploadedFile = {
            file,
            id: fileId,
            status: 'uploading',
            progress: 0,
        };

        setUploadedFiles(prev => [...prev, newFile]);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setUploadedFiles(prev => prev.map(f => {
                if (f.id === fileId && f.status === 'uploading') {
                    const newProgress = Math.min(f.progress + Math.random() * 30, 100);
                    return { ...f, progress: newProgress };
                }
                return f;
            }));
        }, 200);

        try {
            // Start processing after upload completes
            setTimeout(() => {
                clearInterval(progressInterval);
                setUploadedFiles(prev => prev.map(f =>
                    f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
                ));

                // Simulate processing progress
                const processingInterval = setInterval(() => {
                    setUploadedFiles(prev => prev.map(f => {
                        if (f.id === fileId && f.status === 'processing') {
                            const newProgress = Math.min(f.progress + Math.random() * 25, 100);
                            return { ...f, progress: newProgress };
                        }
                        return f;
                    }));
                }, 300);

                // Complete processing
                simulateUpload(file).then(result => {
                    clearInterval(processingInterval);
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, status: 'completed', progress: 100 }
                            : f
                    ));
                    onUploadComplete?.(result);
                }).catch(error => {
                    clearInterval(processingInterval);
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, status: 'error', error: error.message }
                            : f
                    ));
                    onUploadError?.(error.message);
                });
            }, 1500);

        } catch (error) {
            clearInterval(progressInterval);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setUploadedFiles(prev => prev.map(f =>
                f.id === fileId
                    ? { ...f, status: 'error', error: errorMessage }
                    : f
            ));
            onUploadError?.(errorMessage);
        }
    };

    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);

        fileArray.forEach(file => {
            const validationError = validateFile(file);
            if (validationError) {
                onUploadError?.(validationError);
                return;
            }

            processFile(file);
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const getStatusIcon = (status: UploadedFile['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            default:
                return <FileText className="h-5 w-5 text-blue-600" />;
        }
    };

    const getStatusText = (file: UploadedFile) => {
        switch (file.status) {
            case 'uploading':
                return `Uploading... ${Math.round(file.progress)}%`;
            case 'processing':
                return `Processing... ${Math.round(file.progress)}%`;
            case 'completed':
                return 'Upload complete';
            case 'error':
                return file.error || 'Upload failed';
            default:
                return 'Pending';
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Upload Area */}
            <Card>
                <CardContent className="p-6">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        )}
                    >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Upload Your Resume
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Drop your resume here or click to browse
                        </p>

                        <div className="space-y-2 mb-6">
                            <p className="text-sm text-gray-500">
                                Supported formats: {acceptedFormats.join(', ')}
                            </p>
                            <p className="text-sm text-gray-500">
                                Maximum file size: {maxFileSize}MB
                            </p>
                        </div>

                        <input
                            type="file"
                            id="resume-upload"
                            className="hidden"
                            accept={acceptedFormats.join(',')}
                            onChange={handleFileInput}
                        />

                        <label htmlFor="resume-upload">
                            <Button className="cursor-pointer">
                                Choose File
                            </Button>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Uploaded Files
                        </h4>

                        <div className="space-y-4">
                            {uploadedFiles.map((file) => (
                                <div key={file.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(file.status)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {getStatusText(file)}
                                        </p>

                                        {(file.status === 'uploading' || file.status === 'processing') && (
                                            <div className="mt-2">
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {file.status === 'completed' && (
                                            <>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(file.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};