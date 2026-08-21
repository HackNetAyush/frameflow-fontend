import React, { useEffect, useRef, useState } from 'react';
import { Menu, AlertCircle, Video as VideoIcon, ArrowRight } from 'lucide-react';

import Sidebar from './components/Layout/Sidebar';
import LoadingScreen from './components/Layout/LoadingScreen';
import Hero from './components/Home/Hero';
import PromptBar from './components/Home/PromptBar';
import VideoCard from './components/Video/VideoCard';
import VideoPlayer from './components/Video/VideoPlayer';
import ProgressOverlay from './components/Video/ProgressOverlay';
import ThemeToggle from './components/Layout/ThemeToggle';

import { useVideos } from './hooks/useVideos';
import { useVideoGenerator } from './hooks/useVideoGenerator';
import { useTheme } from './hooks/useTheme';

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

function App() {
  const { videos, addVideo, removeVideo } = useVideos();
  const { theme, toggleTheme } = useTheme();
  const { processRequest, status, progress, error, video, videoUrl, canvasRef, isEngineLoaded } =
    useVideoGenerator();

  const [view, setView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState(null);
  const [playing, setPlaying] = useState(null);
  const savedUrlRef = useRef(null);

  const isGenerating = status !== 'idle' && status !== 'done' && status !== 'error';

  const handleGenerate = (prompt) => {
    setActivePrompt(prompt);
    setView('home');
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
    <div className="flex h-screen overflow-hidden bg-ink-950 text-mist-100">
      <Sidebar
        view={view}
        onViewChange={setView}
        videoCount={videos.length}
        isEngineReady={isEngineLoaded}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line px-5 sm:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-mist-400 hover:bg-ink-800 hover:text-mist-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h2 className="text-[15px] font-semibold text-mist-100">
            {view === 'home' ? 'Home' : 'My Videos'}
          </h2>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[11.5px] font-medium text-mist-300">Engine ready</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        {/* Scroll region */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            {view === 'home' ? (
              <>
                <Hero />

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

                {/* Recently created */}
                <section className="mt-11">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[19px] font-bold tracking-tight text-mist-100">
                      Recently created
                    </h2>
                    {videos.length > 3 ? (
                      <button
                        onClick={() => setView('videos')}
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
                      {videos.slice(0, 3).map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onOpen={setPlaying}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
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
                      {videos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
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
            )}
          </div>
        </div>
      </main>

      <VideoPlayer
        video={playing}
        onClose={() => setPlaying(null)}
        onDownload={handleDownload}
      />

      {/* Hidden render target — the canvas the video engine draws into */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="pointer-events-none absolute hidden opacity-0"
      />
    </div>
  );
}

export default App;
