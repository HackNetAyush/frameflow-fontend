import React, { useRef, useState } from 'react';
import { Play, Clock, Download, Trash2, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { timeAgo, formatDuration } from '../../hooks/useVideos';

/**
 * Renders a generated video as a card.
 * The thumbnail is the video's own first frame, and the duration badge comes
 * from the file's metadata — no placeholder data.
 */
const VideoCard = ({ video, layout = 'row', onOpen, onDownload, onDelete }) => {
  const [duration, setDuration] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef(null);

  const handleMetadata = (e) => {
    const d = e.currentTarget.duration;
    // WebM from the browser recorder can report Infinity until it is seeked.
    if (!Number.isFinite(d)) {
      e.currentTarget.currentTime = 1e6;
      return;
    }
    setDuration(formatDuration(d));
  };

  const handleTimeUpdate = (e) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d) && !duration) {
      setDuration(formatDuration(d));
      e.currentTarget.currentTime = 0;
    }
  };

  const isGrid = layout === 'grid';

  return (
    <div
      className={clsx(
        'group relative rounded-2xl border border-line bg-ink-900 transition-colors hover:border-line-strong',
        isGrid ? 'flex flex-col p-3' : 'flex items-center gap-5 p-3 sm:p-4'
      )}
    >
      {/* Thumbnail */}
      <button
        onClick={() => onOpen(video)}
        className={clsx(
          'relative shrink-0 overflow-hidden rounded-xl bg-black',
          isGrid ? 'aspect-video w-full' : 'h-[76px] w-[135px] sm:h-[86px] sm:w-[152px]'
        )}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={handleMetadata}
          onTimeUpdate={handleTimeUpdate}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-on-accent">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
        {duration ? (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-white">
            {duration}
          </span>
        ) : null}
      </button>

      {/* Meta */}
      <div className={clsx('min-w-0 flex-1', isGrid && 'px-1 pb-1 pt-3')}>
        <h3 className="truncate text-[15px] font-semibold text-mist-100">{video.prompt}</h3>
        <div className="mt-2 flex items-center gap-4 text-[12px] text-mist-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(video.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={clsx('shrink-0', isGrid ? 'absolute right-4 top-4 z-10' : 'relative')}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="rounded-lg p-2 text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
          aria-label="Video actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line-strong bg-ink-850 py-1 shadow-2xl">
            <button
              onClick={() => onDownload(video)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-mist-300 hover:bg-ink-800 hover:text-mist-100"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={() => onDelete(video.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-danger-fg hover:bg-ink-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VideoCard;
