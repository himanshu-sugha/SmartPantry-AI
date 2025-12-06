'use client'

import { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';

interface CameraScannerProps {
    onScanComplete: (detectedObject: string) => void;
}

// Map COCO-SSD classes to grocery items
const GROCERY_MAPPING: Record<string, string> = {
    'apple': 'Apple',
    'orange': 'Orange',
    'banana': 'Banana',
    'broccoli': 'Broccoli',
    'carrot': 'Carrot',
    'sandwich': 'Sandwich',
    'pizza': 'Pizza',
    'donut': 'Donut',
    'cake': 'Cake',
    'bottle': 'Bottle',
    'wine glass': 'Wine Glass',
    'cup': 'Cup',
    'fork': 'Fork',
    'knife': 'Knife',
    'spoon': 'Spoon',
    'bowl': 'Bowl',
    'hot dog': 'Hot Dog',
    'cell phone': 'Phone',
    'laptop': 'Laptop',
    'book': 'Book',
};

// Classes to IGNORE (we don't want to detect people)
const IGNORED_CLASSES = ['person', 'tie', 'handbag', 'backpack', 'umbrella'];

export function CameraScanner({ onScanComplete }: CameraScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const scanningRef = useRef(false);

    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState('Loading AI Model...');
    const [detected, setDetected] = useState<string | null>(null);
    const [confidence, setConfidence] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadModel();
        return () => {
            stopCamera();
        };
    }, []);

    const loadModel = async () => {
        try {
            setLoadingStatus('Initializing TensorFlow.js...');
            await tf.ready();

            // Use WebGL backend for better performance
            await tf.setBackend('webgl');

            setLoadingStatus('Loading AI model (better accuracy, may take longer)...');
            // Use full mobilenet_v2 for better detection accuracy
            const loadedModel = await cocoSsd.load({
                base: 'mobilenet_v2'  // Full model - more accurate than lite
            });

            setModel(loadedModel);
            setLoading(false);
            setLoadingStatus('Ready!');
        } catch (error) {
            console.error('Failed to load TF model', error);
            setError('Failed to load AI model. Please refresh the page.');
            setLoading(false);
        }
    };

    const startCamera = async () => {
        setError(null);
        setDetected(null);

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setScanning(true);
                    scanningRef.current = true;

                    setTimeout(() => {
                        detectLoop();
                    }, 500);
                }
            } else {
                setError('Camera not available on this device');
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            setError(err.message || 'Failed to access camera');
        }
    };

    const stopCamera = () => {
        scanningRef.current = false;
        setScanning(false);

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const detectLoop = async () => {
        if (!videoRef.current || !model || !scanningRef.current) {
            return;
        }

        try {
            const predictions = await model.detect(videoRef.current);

            // Separate valid items from ignored items (like person)
            const ignoredPredictions = predictions.filter(p =>
                IGNORED_CLASSES.includes(p.class) && p.score > 0.4
            );

            const objectPredictions = predictions.filter(p =>
                !IGNORED_CLASSES.includes(p.class) && p.score > 0.4
            );

            // Prioritize food/grocery items
            const foodPrediction = objectPredictions.find(p => GROCERY_MAPPING[p.class]);
            const bestPrediction = foodPrediction || objectPredictions[0];

            // Clear canvas
            if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // Draw RED boxes for ignored items (person, etc.)
                    for (const ignored of ignoredPredictions) {
                        ctx.strokeStyle = '#ef4444';  // Red
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);  // Dashed line
                        ctx.strokeRect(
                            ignored.bbox[0],
                            ignored.bbox[1],
                            ignored.bbox[2],
                            ignored.bbox[3]
                        );

                        // Label
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#ef4444';
                        ctx.fillRect(
                            ignored.bbox[0],
                            ignored.bbox[1] - 20,
                            ctx.measureText(ignored.class).width + 16,
                            20
                        );
                        ctx.fillStyle = 'white';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(
                            ignored.class,
                            ignored.bbox[0] + 8,
                            ignored.bbox[1] - 5
                        );
                    }

                    // Draw GREEN box for the best valid item
                    if (bestPrediction) {
                        const mappedName = GROCERY_MAPPING[bestPrediction.class] || bestPrediction.class;
                        setDetected(mappedName);
                        setConfidence(Math.round(bestPrediction.score * 100));

                        ctx.strokeStyle = '#10b981';  // Green
                        ctx.lineWidth = 3;
                        ctx.setLineDash([]);  // Solid line
                        ctx.strokeRect(
                            bestPrediction.bbox[0],
                            bestPrediction.bbox[1],
                            bestPrediction.bbox[2],
                            bestPrediction.bbox[3]
                        );

                        // Label
                        ctx.fillStyle = '#10b981';
                        ctx.fillRect(
                            bestPrediction.bbox[0],
                            bestPrediction.bbox[1] - 25,
                            ctx.measureText(mappedName).width + 20,
                            25
                        );
                        ctx.fillStyle = 'white';
                        ctx.font = '16px sans-serif';
                        ctx.fillText(
                            mappedName,
                            bestPrediction.bbox[0] + 10,
                            bestPrediction.bbox[1] - 7
                        );
                    } else {
                        setDetected(null);
                    }
                }
            }
        } catch (error) {
            console.error('Detection error', error);
        }

        if (scanningRef.current) {
            animationRef.current = requestAnimationFrame(detectLoop);
        }
    };

    const confirmDetection = () => {
        if (detected) {
            onScanComplete(detected);
            stopCamera();
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative w-full h-64 bg-black rounded-md overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />

                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span className="text-sm">{loadingStatus}</span>
                    </div>
                )}

                {!scanning && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                        <Camera className="h-12 w-12 opacity-50" />
                    </div>
                )}

                {detected && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            <Sparkles className="inline h-4 w-4 mr-1" />
                            {detected} ({confidence}% confident)
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="flex gap-2">
                {!scanning ? (
                    <Button onClick={startCamera} disabled={loading} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                    </Button>
                ) : (
                    <Button variant="destructive" onClick={stopCamera} className="flex-1">
                        Stop Camera
                    </Button>
                )}

                {detected && (
                    <Button onClick={confirmDetection} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="mr-2 h-4 w-4" />
                        Add {detected}
                    </Button>
                )}
            </div>

            <p className="text-xs text-gray-500 text-center">
                Point camera at food items (ignores people automatically)
            </p>
        </div>
    );
}
