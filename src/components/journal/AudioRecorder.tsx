/**
 * src/components/journal/AudioRecorder.tsx
 * GITHUB COMMENT:
 * [AudioRecorder.tsx]
 * FIX: Replaced 'NodeJS.Timeout' with 'ReturnType<typeof setInterval>' to resolve namespace error in browser environment.
 */
import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { blobToBase64 } from '../../lib/utils';
import { generateAudioAnalysis, type AudioAnalysisResult } from '../../lib/gemini';

interface AudioRecorderProps {
    onAnalysisComplete: (result: AudioAnalysisResult) => void;
    onCancel: () => void;
}

export default function AudioRecorder({ onAnalysisComplete, onCancel }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    // FIX: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = handleRecordingStop;

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setError(null);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone access denied:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Stop all tracks to release mic
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        
        setIsProcessing(true);
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const analysis = await generateAudioAnalysis(base64Audio, 'audio/mp3');
            onAnalysisComplete(analysis);
        } catch (err) {
            console.error("Processing failed", err);
            setError("Failed to process audio. Please try again.");
            setIsProcessing(false);
        }
    };

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
            
            <div className="flex justify-between w-full items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voice Journal</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            {/* STATUS DISPLAY */}
            <div className="text-center space-y-2">
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-indigo-600 font-medium animate-pulse">Transcribing & Analyzing...</p>
                    </div>
                ) : (
                    <>
                        <div className={`text-4xl font-mono font-bold transition-colors ${isRecording ? 'text-red-500' : 'text-slate-700'}`}>
                            {formatTime(recordingTime)}
                        </div>
                        {isRecording && (
                            <div className="flex gap-1 justify-center h-4 items-end">
                                <div className="w-1 bg-red-400 h-full animate-[bounce_1s_infinite]"></div>
                                <div className="w-1 bg-red-400 h-2/3 animate-[bounce_1.2s_infinite]"></div>
                                <div className="w-1 bg-red-400 h-full animate-[bounce_0.8s_infinite]"></div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CONTROLS */}
            {!isProcessing && (
                <div className="flex items-center gap-6">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="h-16 w-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-200 transition-all active:scale-95 group"
                        >
                            <MicrophoneIcon className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="h-16 w-16 bg-slate-800 hover:bg-black rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                        >
                            <StopIcon className="h-8 w-8 text-white animate-pulse" />
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
                    <ArrowPathIcon className="h-3 w-3" /> {error}
                </div>
            )}
            
            <p className="text-xs text-slate-400 text-center max-w-xs">
                {isRecording 
                    ? "Listening... Tap stop when finished." 
                    : "Tap microphone to start recording. AI will transcribe and analyze your mood."}
            </p>
        </div>
    );
}