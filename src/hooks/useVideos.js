import { useCallback, useState } from 'react';

/**
 * In-session library of generated videos.
 * Videos live as object URLs created by the generator, so they are kept in
 * memory only — a reload clears them, same as before the redesign.
 */
export const useVideos = () => {
  const [videos, setVideos] = useState([]);

  const addVideo = useCallback(({ prompt, videoUrl, ext = 'mp4', mimeType = 'video/mp4' }) => {
    const video = {
      id: `${Date.now()}`,
      prompt,
      videoUrl,
      ext,
      mimeType,
      createdAt: Date.now(),
    };
    setVideos((prev) => [video, ...prev]);
    return video;
  }, []);

  const removeVideo = useCallback((id) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) URL.revokeObjectURL(target.videoUrl);
      return prev.filter((v) => v.id !== id);
    });
  }, []);

  return { videos, addVideo, removeVideo };
};

export const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';

  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [label, span] of units) {
    const value = Math.floor(seconds / span);
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
