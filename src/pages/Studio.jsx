import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Video as VideoIcon, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

import AppShell from '../components/Layout/AppShell';
import LoadingScreen from '../components/Layout/LoadingScreen';
import Hero from '../components/Home/Hero';
import PromptBar from '../components/Home/PromptBar';
import VideoCard from '../components/Video/VideoCard';
import VideoPlayer from '../components/Video/VideoPlayer';
import ProgressOverlay from '../components/Video/ProgressOverlay';

import { useVideos } from '../hooks/useVideos';
import { useVideoGenerator } from '../hooks/useVideoGenerator';

const EmptyState = ({ compact }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-14 text-center">
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-850 text-mist-500">
      <VideoIcon className="h-5 w-5" />
    </span>
    <p className="mt-3.5 text-[14px] font-medium text-mist-300">No videos yet</p>
    <p className="mt-1 max-w-xs text-[12.5px] text-mist-500">
      {compact
        ? 'Your generated videos will show up here.'
        : 'Head to Home and describe a topic to generate your first explainer.'}
    </p>
  </div>
);

const Studio = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const { videos, addVideo, removeVideo } = useVideos();
  const { processRequest, status, progress, error, video, videoUrl, canvasRef, isEngineLoaded } =
    useVideoGenerator();

  const [activePrompt, setActivePrompt] = useState(null);
  const [playing, setPlaying] = useState(null);
  const savedUrlRef = useRef(null);

  // One mounted component serves both /app and /app/videos, so a render in
  // flight survives switching between them.
  const onVideosTab = location.pathname.replace(/\/+$/, '').endsWith('/videos');
  const isGenerating = status !== 'idle' && status !== 'done' && status !== 'error';

  const handleGenerate = (prompt) => {
    setActivePrompt(prompt);
    navigate('/app');
    processRequest(prompt);
  };

  const handleDownload = (item) => {
    const a = document.createElement('a');
    a.href = item.videoUrl;
    a.download = `xplainer-${item.id}.${item.ext || 'mp4'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (id) => {
    setPlaying((current) => (current?.id === id ? null : current));
    removeVideo(id);
  };

  // Move a finished render into the library exactly once.
  useEffect(() => {
    if (status === 'done' && videoUrl && savedUrlRef.current !== videoUrl) {
      savedUrlRef.current = videoUrl;
      addVideo({ prompt: activePrompt, videoUrl, ext: video?.ext, mimeType: video?.mimeType });
    }
  }, [status, videoUrl, video, activePrompt, addVideo]);

  if (!isEngineLoaded) return <LoadingScreen />;

  return (
    <AppShell
      title={onVideosTab ? 'My Videos' : 'Home'}
      videoCount={videos.length}
      isEngineReady={isEngineLoaded}
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {onVideosTab ? (
          <section>
            <h1 className="text-[26px] font-bold tracking-tight text-mist-100">My Videos</h1>
            <p className="mt-1.5 text-[13.5px] text-mist-400">
              {videos.length} video{videos.length === 1 ? '' : 's'} generated this session.
            </p>

            <div className="mt-7">
              {videos.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item}
                      layout="grid"
                      onOpen={setPlaying}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <Hero name={user?.firstName} />

            <div className="mt-9 space-y-4">
              {error && !isGenerating ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-[13px] text-danger-fg">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {isGenerating ? (
                <ProgressOverlay status={status} progress={progress} prompt={activePrompt} />
              ) : (
                <PromptBar onSubmit={handleGenerate} disabled={isGenerating} />
              )}
            </div>

            <section className="mt-11">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[19px] font-bold tracking-tight text-mist-100">
                  Recently created
                </h2>
                {videos.length > 3 ? (
                  <button
                    onClick={() => navigate('/app/videos')}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-mist-400 transition-colors hover:text-accent-fg"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {videos.length === 0 ? (
                <EmptyState compact />
              ) : (
                <div className="space-y-3">
                  {videos.slice(0, 3).map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item}
                      onOpen={setPlaying}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <VideoPlayer video={playing} onClose={() => setPlaying(null)} onDownload={handleDownload} />

      {/* Hidden render target — the canvas the video engine draws into */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="pointer-events-none absolute hidden opacity-0"
      />
    </AppShell>
  );
};

export default Studio;
