
import { useState, useRef, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import CCapture from 'ccapture.js-npmfixed';
import { CanvasMarkupRenderer } from '../utils/CanvasRenderer';

const server_url = import.meta.env.VITE_SERVER_URL

export const useVideoGenerator = () => {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isEngineLoaded, setIsEngineLoaded] = useState(false);

    const ffmpegRef = useRef(null);
    const canvasRef = useRef(null);
    const chatID = useRef(null);

    // Progress Smoothing Logic
    const targetProgressRef = useRef(0);
    const currentProgressRef = useRef(0);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        const animateCX = () => {
            // Linear interpolation for smoothness
            const diff = targetProgressRef.current - currentProgressRef.current;

            if (Math.abs(diff) > 0.1) {
                // Move 5% of the distance per frame, or at least 0.1
                const step = Math.max(Math.abs(diff) * 0.05, 0.1);
                currentProgressRef.current += Math.sign(diff) * step;

                // Clamp
                if (currentProgressRef.current > 100) currentProgressRef.current = 100;

                setProgress(currentProgressRef.current);
                animationFrameRef.current = requestAnimationFrame(animateCX);
            } else {
                // Snap to target if very close
                if (currentProgressRef.current !== targetProgressRef.current) {
                    currentProgressRef.current = targetProgressRef.current;
                    setProgress(currentProgressRef.current);
                }
                animationFrameRef.current = requestAnimationFrame(animateCX);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animateCX);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const setTargetProgress = (val) => {
        targetProgressRef.current = val;
    };

    const loadFFmpeg = async () => {
        if (ffmpegRef.current) {
            setIsEngineLoaded(true);
            return;
        }

        try {
            const ffmpeg = createFFmpeg({
                log: false,
                corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            });
            await ffmpeg.load();
            ffmpegRef.current = ffmpeg;
            setIsEngineLoaded(true);
            console.log("FFmpeg loaded successfully");
        } catch (err) {
            console.error("FFmpeg load failed:", err);
            // We don't throw blocking error here to allow retry, but for splash screen we might wanna handle it.
            // For now, let's just log. Splash screen will stay indefinitely or we can add a timeout error.
            // throw new Error("Failed to load video engine.");
        }
    };

    useEffect(() => {
        // Attempt initial load
        loadFFmpeg().catch(err => {
            console.warn("Initial FFmpeg load failed, will retry on demand.");
            setError("Video engine failed to load. It will retry when you generate.");
        });
    }, []);

    const generateChatID = () => {
        return 'chat_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    };

    const processRequest = async (prompt) => {
        setStatus('generating_script');
        setTargetProgress(0);
        currentProgressRef.current = 0;
        setProgress(0);
        setError(null);
        setVideoUrl(null);

        // Retry loading FFmpeg if needed
        if (!ffmpegRef.current) {
            try {
                await loadFFmpeg();
            } catch (err) {
                setError(err.message);
                setStatus('error');
                return;
            }
        }

        chatID.current = generateChatID();

        // Trickle progress while waiting for script
        const trickleInterval = setInterval(() => {
            if (targetProgressRef.current < 25) {
                targetProgressRef.current += 2;
            }
        }, 500);

        try {
            // Step 1: Send request to backend (Streaming)
            const response = await fetch(`${server_url}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, chatID: chatID.current })
            });

            clearInterval(trickleInterval);

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            if (!response.body) throw new Error('ReadableStream not supported in this browser.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split("\n");

                // Process all complete lines
                buffer = lines.pop(); // Keep the last incomplete line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);

                        if (event.type === 'progress') {
                            // Update Status Text based on message
                            if (event.message.includes("Generating image")) {
                                setStatus('generating_images');
                            } else if (event.message.includes("audio")) {
                                setStatus('generating_audio');
                            } else {
                                setStatus('generating_script'); // Default fallback
                            }

                            // Update Numeric Progress if provided
                            if (event.progress) {
                                setTargetProgress(event.progress);
                            }

                        } else if (event.type === 'error') {
                            throw new Error(event.message);
                        } else if (event.type === 'complete') {
                            console.log("Generation complete!");
                        }
                    } catch (e) {
                        console.warn("Error parsing stream line:", line, e);
                    }
                }
            }

            // After stream is done, we proceed to frontend rendering
            setStatus('loading_resources'); // New intermediate status
            setTargetProgress(100); // Backend part done

            // Allow valid '100' to settle before resetting for frontend phase
            await new Promise(r => setTimeout(r, 500));

            // Reset for frontend phase
            setTargetProgress(0);
            setProgress(0);
            currentProgressRef.current = 0;

            setStatus('loading_images');
            const jsonUrl = `${server_url}/${chatID.current}/json/j1.json`;
            const slidesData = await (await fetch(jsonUrl)).json();

            // Step 2.1: Pre-load Images
            setStatus('loading_images');
            const imageCache = await preloadImages(slidesData);

            setTargetProgress(40);

            const audioUrl = `${server_url}/${chatID.current}/merged/output.wav`;
            const audioBlob = await (await fetch(audioUrl)).blob();

            setTargetProgress(50);
            setStatus('rendering');

            // Step 3: Render visuals
            const videoBlob = await renderVisuals(slidesData, imageCache, (pct) => {
                const overall = 50 + (pct * 0.4);
                setTargetProgress(overall);
            });

            setStatus('merging');
            setTargetProgress(95);

            // Step 4: Merge audio/video
            const finalBlob = await mergeAudioVideo(videoBlob, audioBlob);

            const finalUrl = URL.createObjectURL(finalBlob);
            setVideoUrl(finalUrl);

            setTargetProgress(100);
            setTimeout(() => {
                setStatus('done');
            }, 500);

        } catch (err) {
            console.error(err);
            clearInterval(trickleInterval);
            setError(err.message);
            setStatus('error');
        }
    };

    const extractImageUrls = (markdown) => {
        const regex = /!\[.*?\]\((.*?)\)/g;
        const urls = [];
        let match;
        while ((match = regex.exec(markdown)) !== null) {
            urls.push(match[1]);
        }
        return urls;
    };

    const preloadImages = async (slides) => {
        const cache = {};
        const allContent = slides.map(s => s.content).join('\n');
        const urls = extractImageUrls(allContent);

        const uniqueUrls = [...new Set(urls)];

        const promises = uniqueUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Important for canvas export
                img.onload = () => {
                    cache[url] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${url}`);
                    resolve(); // Don't fail the whole video for one image
                };
                img.src = url;
            });
        });

        await Promise.all(promises);
        return cache;
    };

    const renderVisuals = (slidesData, imageCache, onProgress) => {
        return new Promise((resolve, reject) => {
            if (!canvasRef.current) return reject("No canvas found");

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Prepare timing
            let currentTime = 0;
            const slides = slidesData.map(slide => {
                const s = { start: currentTime, end: currentTime + slide.time, content: slide.content };
                currentTime += slide.time;
                return s;
            });

            const totalDuration = currentTime;
            const fps = 2;
            const frameDuration = 1000 / fps;
            let virtualTime = 0;

            const capturer = new CCapture({
                format: 'webm',
                framerate: fps,
                quality: 85,
                verbose: false
            });

            capturer.start();

            const renderFrame = () => {
                const currentSlide = slides.find(s => virtualTime >= s.start && virtualTime < s.end);

                if (currentSlide) {
                    const renderer = new CanvasMarkupRenderer(ctx, canvas.width, canvas.height, {
                        fontSize: 36,
                        lineHeight: 52,
                        imageCache: imageCache
                    });
                    renderer.render(currentSlide.content);
                } else {
                    ctx.fillStyle = "#0f172a"; // Match Slate-900
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                capturer.capture(canvas);
                virtualTime += frameDuration;

                const pct = Math.min((virtualTime / totalDuration) * 100, 100);
                onProgress(pct);

                if (virtualTime < totalDuration) {
                    setTimeout(renderFrame, 0);
                } else {
                    capturer.stop();
                    capturer.save((blob) => resolve(blob));
                }
            };

            renderFrame();
        });
    };

    const mergeAudioVideo = async (videoBlob, audioBlob) => {
        if (!ffmpegRef.current) throw new Error("FFmpeg not loaded");
        const ffmpeg = ffmpegRef.current;

        const videoData = await fetchFile(videoBlob);
        const audioData = await fetchFile(audioBlob);

        ffmpeg.FS('writeFile', 'video.webm', videoData);
        ffmpeg.FS('writeFile', 'audio.wav', audioData);

        await ffmpeg.run(
            '-i', 'video.webm',
            '-i', 'audio.wav',
            '-c:v', 'copy',
            '-c:a', 'libopus',
            '-strict', 'experimental',
            '-shortest',
            'temp_output.webm'
        );

        // Run a second pass to fix the container duration/seeking
        // This remuxing step forces FFmpeg to write the correct duration header
        await ffmpeg.run(
            '-i', 'temp_output.webm',
            '-c', 'copy',
            'output.webm'
        );

        const data = ffmpeg.FS('readFile', 'output.webm');
        return new Blob([data.buffer], { type: 'video/webm' });
    };

    return { processRequest, status, progress, error, videoUrl, canvasRef, isEngineLoaded };
};
