import React, { useState } from 'react';
import clsx from 'clsx';

const initials = (user) => {
  const base = (user?.name || user?.email || '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

/** User avatar: Google photo when present, initials otherwise. */
const Avatar = ({ user, className }) => {
  const [broken, setBroken] = useState(false);
  const showImage = user?.image && !broken;

  return (
    <span
      className={clsx(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-[11px] font-bold text-accent-fg',
        className,
      )}
    >
      {showImage ? (
        <img
          src={user.image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initials(user)
      )}
    </span>
  );
};

export default Avatar;
