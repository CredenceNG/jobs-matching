/**
 * AI Interview Preparation Component
 * 
 * Interactive component for AI-powered interview preparation.
 * Provides practice questions, mock interviews, and personalized feedback.
 * 
 * @description Interview prep, practice questions, and performance analysis
 */

'use client';

import { useState, useEffect, useRef } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface InterviewQuestion {
    id: string;
    question: string;
    category: 'behavioral' | 'technical' | 'situational' | 'company-specific';
    difficulty: 'easy' | 'medium' | 'hard';
    suggestedStructure: string;
    keyPoints: string[];
    sampleAnswer?: string;
}

interface InterviewSession {
    id: string;
    jobTitle: string;
    company: string;
    interviewType: 'phone' | 'video' | 'in-person' | 'technical';
    questions: InterviewQuestion[];
    responses: Array<{
        questionId: string;
        response: string;
        recordingUrl?: string;
        feedback: {
            score: number;
            strengths: string[];
            improvements: string[];
            suggestions: string[];
        };
    }>;
    overallFeedback: {
        preparedness: number;
        communication: number;
        confidence: number;
        technicalKnowledge: number;
        recommendations: string[];
    };
    createdAt: string;
}

interface AIInterviewPrepProps {
    jobTitle?: string;
    company?: string;
    interviewType?: 'phone' | 'video' | 'in-person' | 'technical';
    onSessionComplete?: (session: InterviewSession) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIInterviewPrep({
    jobTitle = '',
    company = '',
    interviewType = 'video',
    onSessionComplete,
}: AIInterviewPrepProps) {
    const [mode, setMode] = useState<'setup' | 'practice' | 'mock' | 'review'>('setup');
    const [currentSession, setCurrentSession] = useState<Partial<InterviewSession>>({
        jobTitle,
        company,
        interviewType,
        questions: [],
        responses: [],
    });
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentResponse, setCurrentResponse] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default
    const [timerActive, setTimerActive] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
            // Auto-submit response when time runs out
            if (mode === 'mock') {
                submitResponse();
            }
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft, mode]);

    const generateQuestions = async () => {
        if (!currentSession.jobTitle) {
            setError('Please provide a job title');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/interview-prep', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobTitle: currentSession.jobTitle,
                    company: currentSession.company,
                    interviewType: currentSession.interviewType,
                    questionCount: 10,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate questions');
            }

            const result = await response.json();
            setQuestions(result.questions);
            setCurrentSession(prev => ({
                ...prev,
                id: `session-${Date.now()}`,
                questions: result.questions,
                createdAt: new Date().toISOString(),
            }));
            setMode('practice');
        } catch (err) {
            console.error('Question generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate interview questions');
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                // Could upload this to storage and get URL
                console.log('Recording stopped', audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
            setError('Unable to access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const submitResponse = async () => {
        if (!currentResponse.trim() && !isRecording) {
            setError('Please provide a response');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const currentQuestion = questions[currentQuestionIndex];

            const response = await fetch('/api/ai/interview-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    response: currentResponse,
                    jobTitle: currentSession.jobTitle,
                    company: currentSession.company,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get feedback');
            }

            const feedback = await response.json();

            // Save response and feedback
            setCurrentSession(prev => ({
                ...prev,
                responses: [
                    ...(prev.responses || []),
                    {
                        questionId: currentQuestion.id,
                        response: currentResponse,
                        feedback: feedback,
                    },
                ],
            }));

            // Move to next question or finish
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentResponse('');
                setTimeLeft(180);
            } else {
                // Generate overall feedback and complete session
                await generateOverallFeedback();
            }
        } catch (err) {
            console.error('Response submission error:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit response');
        } finally {
            setLoading(false);
        }
    };

    const generateOverallFeedback = async () => {
        try {
            const response = await fetch('/api/ai/interview-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session: currentSession,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate overall feedback');
            }

            const overallFeedback = await response.json();

            const completedSession = {
                ...currentSession,
                overallFeedback,
            } as InterviewSession;

            setCurrentSession(completedSession);
            setMode('review');

            // Notify parent component
            onSessionComplete?.(completedSession);
        } catch (err) {
            console.error('Overall feedback error:', err);
            setError('Failed to generate session summary');
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score: number): string => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number): string => {
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Setup Mode
    const SetupMode = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Preparation Setup</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title *
                        </label>
                        <input
                            id="jobTitle"
                            type="text"
                            value={currentSession.jobTitle || ''}
                            onChange={(e) => setCurrentSession(prev => ({ ...prev, jobTitle: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Senior Software Engineer"
                        />
                    </div>

                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                            Company
                        </label>
                        <input
                            id="company"
                            type="text"
                            value={currentSession.company || ''}
                            onChange={(e) => setCurrentSession(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Google"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Interview Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { value: 'phone', label: '📞 Phone', desc: 'Voice-only interview' },
                            { value: 'video', label: '📹 Video', desc: 'Video conference' },
                            { value: 'in-person', label: '👥 In-Person', desc: 'Face-to-face meeting' },
                            { value: 'technical', label: '💻 Technical', desc: 'Coding/technical assessment' },
                        ].map((type) => (
                            <label key={type.value} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="interviewType"
                                    value={type.value}
                                    checked={currentSession.interviewType === type.value}
                                    onChange={(e) => setCurrentSession(prev => ({ ...prev, interviewType: e.target.value as any }))}
                                    className="sr-only"
                                />
                                <div className={`border-2 rounded-lg p-3 text-center transition-colors ${currentSession.interviewType === type.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-600 mt-1">{type.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                        <li className="flex items-center">
                            <span className="text-blue-500 mr-2">✓</span>
                            10 personalized interview questions
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-500 mr-2">✓</span>
                            AI-powered response feedback
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-500 mr-2">✓</span>
                            Practice mode with unlimited attempts
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-500 mr-2">✓</span>
                            Mock interview with timer
                        </li>
                        <li className="flex items-center">
                            <span className="text-blue-500 mr-2">✓</span>
                            Detailed performance analysis
                        </li>
                    </ul>
                </div>

                <button
                    onClick={generateQuestions}
                    disabled={loading || !currentSession.jobTitle}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Generating Questions...
                        </div>
                    ) : (
                        '🎯 Generate Interview Questions'
                    )}
                </button>
            </div>
        </div>
    );

    // Practice/Mock Mode
    const InterviewMode = () => {
        if (questions.length === 0) return null;

        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {mode === 'mock' ? 'Mock Interview' : 'Practice Mode'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </p>
                    </div>

                    {mode === 'mock' && (
                        <div className="flex items-center space-x-4">
                            <div className={`text-lg font-bold ${timeLeft < 30 ? 'text-red-600' : 'text-gray-700'}`}>
                                {formatTime(timeLeft)}
                            </div>
                            <button
                                onClick={() => setTimerActive(!timerActive)}
                                className={`px-3 py-1 rounded text-sm font-medium ${timerActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}
                            >
                                {timerActive ? 'Pause' : 'Start'} Timer
                            </button>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Question Card */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${currentQuestion.category === 'behavioral' ? 'bg-blue-100 text-blue-800' :
                                        currentQuestion.category === 'technical' ? 'bg-purple-100 text-purple-800' :
                                            currentQuestion.category === 'situational' ? 'bg-green-100 text-green-800' :
                                                'bg-orange-100 text-orange-800'
                                    }`}>
                                    {currentQuestion.category}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {currentQuestion.difficulty}
                                </span>
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-3">
                                {currentQuestion.question}
                            </h4>
                        </div>
                    </div>

                    {/* Suggested Structure */}
                    {mode === 'practice' && currentQuestion.suggestedStructure && (
                        <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                            <h5 className="font-medium text-blue-900 mb-1">Suggested Structure:</h5>
                            <p className="text-sm text-blue-800">{currentQuestion.suggestedStructure}</p>
                        </div>
                    )}

                    {/* Key Points */}
                    {mode === 'practice' && currentQuestion.keyPoints.length > 0 && (
                        <div className="mb-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
                            <h5 className="font-medium text-green-900 mb-2">Key Points to Address:</h5>
                            <ul className="space-y-1">
                                {currentQuestion.keyPoints.map((point, index) => (
                                    <li key={index} className="text-sm text-green-800 flex items-start">
                                        <span className="text-green-600 mr-2">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Response Input */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                            Your Response
                        </label>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isRecording
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {isRecording ? '🔴 Stop Recording' : '🎤 Record Audio'}
                            </button>
                        </div>
                    </div>

                    <textarea
                        id="response"
                        rows={8}
                        value={currentResponse}
                        onChange={(e) => setCurrentResponse(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your response here... Be specific and use examples when possible."
                    />

                    <div className="mt-2 text-sm text-gray-500">
                        {currentResponse.length} characters
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        <button
                            onClick={() => {
                                setCurrentResponse('');
                                // Skip to next question without saving response
                                if (currentQuestionIndex < questions.length - 1) {
                                    setCurrentQuestionIndex(prev => prev + 1);
                                }
                            }}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Skip Question
                        </button>
                    </div>

                    <button
                        onClick={submitResponse}
                        disabled={loading || (!currentResponse.trim() && !isRecording)}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Analyzing...
                            </div>
                        ) : currentQuestionIndex === questions.length - 1 ? (
                            'Finish Interview'
                        ) : (
                            'Submit & Next'
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Review Mode
    const ReviewMode = () => {
        if (!currentSession.overallFeedback) return null;

        const { overallFeedback, responses = [] } = currentSession;

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Interview Performance Review</h3>
                    <p className="text-sm text-gray-600">
                        {currentSession.jobTitle} at {currentSession.company}
                    </p>
                </div>

                {/* Overall Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Preparedness', score: overallFeedback.preparedness },
                        { label: 'Communication', score: overallFeedback.communication },
                        { label: 'Confidence', score: overallFeedback.confidence },
                        { label: 'Technical Knowledge', score: overallFeedback.technicalKnowledge },
                    ].map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(item.score)} mb-1`}>
                                {(item.score * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">{item.label}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${getScoreBackground(item.score)}`}
                                    style={{ width: `${item.score * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommendations */}
                {overallFeedback.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Key Recommendations</h4>
                        <ul className="space-y-2">
                            {overallFeedback.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-blue-800 flex items-start">
                                    <span className="text-blue-500 mr-2">💡</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Individual Question Feedback */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-4">Question-by-Question Feedback</h4>
                    <div className="space-y-4">
                        {responses.map((response, index) => {
                            const question = questions.find(q => q.id === response.questionId);
                            if (!question) return null;

                            return (
                                <div key={response.questionId} className="border border-gray-200 rounded-lg">
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900 mb-1">
                                                    Q{index + 1}: {question.question}
                                                </h5>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    Score: <span className={`font-medium ${getScoreColor(response.feedback.score)}`}>
                                                        {(response.feedback.score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h6 className="font-medium text-green-700 mb-2">Strengths</h6>
                                                <ul className="space-y-1">
                                                    {response.feedback.strengths.map((strength, i) => (
                                                        <li key={i} className="text-sm text-green-600 flex items-start">
                                                            <span className="text-green-500 mr-2">✓</span>
                                                            {strength}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h6 className="font-medium text-red-700 mb-2">Improvements</h6>
                                                <ul className="space-y-1">
                                                    {response.feedback.improvements.map((improvement, i) => (
                                                        <li key={i} className="text-sm text-red-600 flex items-start">
                                                            <span className="text-red-500 mr-2">•</span>
                                                            {improvement}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {response.feedback.suggestions.length > 0 && (
                                            <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                                <h6 className="font-medium text-yellow-900 mb-1">Suggestions</h6>
                                                <ul className="space-y-1">
                                                    {response.feedback.suggestions.map((suggestion, i) => (
                                                        <li key={i} className="text-sm text-yellow-800 flex items-start">
                                                            <span className="text-yellow-600 mr-2">💡</span>
                                                            {suggestion}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                        onClick={() => {
                            setMode('setup');
                            setCurrentSession({
                                jobTitle: '',
                                company: '',
                                interviewType: 'video',
                                questions: [],
                                responses: [],
                            });
                            setQuestions([]);
                            setCurrentQuestionIndex(0);
                            setCurrentResponse('');
                            setError(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        Start New Session
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                // Could export session data
                                const dataStr = JSON.stringify(currentSession, null, 2);
                                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                                const exportFileDefaultName = `interview-session-${Date.now()}.json`;
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            📁 Export Results
                        </button>

                        <button
                            onClick={() => setMode('practice')}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Practice Again
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Mode Navigation */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex space-x-6">
                    {[
                        { key: 'practice', label: 'Practice Mode', icon: '📚' },
                        { key: 'mock', label: 'Mock Interview', icon: '🎯' },
                    ].map((modeOption) => (
                        <button
                            key={modeOption.key}
                            onClick={() => {
                                if (questions.length > 0) {
                                    setMode(modeOption.key as any);
                                    setCurrentQuestionIndex(0);
                                    setCurrentResponse('');
                                    setTimeLeft(180);
                                    setTimerActive(false);
                                }
                            }}
                            disabled={questions.length === 0}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${(mode === modeOption.key || (mode === 'setup' && questions.length === 0))
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <span className="mr-2">{modeOption.icon}</span>
                            {modeOption.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {mode === 'setup' && <SetupMode />}
                {(mode === 'practice' || mode === 'mock') && <InterviewMode />}
                {mode === 'review' && <ReviewMode />}
            </div>
        </div>
    );
}