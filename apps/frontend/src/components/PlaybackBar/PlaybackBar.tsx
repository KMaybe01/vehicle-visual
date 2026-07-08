import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useVehicleStore } from '../../store';
import { TOPIC, setTopic } from '../../topics';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5] as const;

interface PlaybackBarProps {
  onSeek?: (index: number) => void;
}

export default memo(function PlaybackBar({ onSeek }: PlaybackBarProps) {
  const history = useVehicleStore((s) => s.historyData);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [position, setPosition] = useState(0);
  const raf = useRef<number>(0);
  const lastTick = useRef(0);

  const totalPoints = history.length;
  const durationSec =
    totalPoints > 0 ? (history[totalPoints - 1].timestamp - history[0].timestamp) / 1000 : 0;

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
    lastTick.current = performance.now();
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = Number(e.target.value);
      setPosition(idx);
      if (history[idx]) {
        setTopic(TOPIC.VEHICLE_STATE, history[idx]);
        onSeek?.(idx);
      }
    },
    [history, onSeek],
  );

  useEffect(() => {
    if (!playing || totalPoints === 0) return;

    let stopped = false;
    const tick = (now: number) => {
      if (stopped) return;
      const delta = ((now - lastTick.current) / 1000) * speed;
      lastTick.current = now;

      setPosition((prev) => {
        const next = prev + delta * 5;
        if (next >= totalPoints - 1) {
          setPlaying(false);
          return totalPoints - 1;
        }
        const idx = Math.floor(next);
        if (history[idx]) setTopic(TOPIC.VEHICLE_STATE, history[idx]);
        return next;
      });

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, history, totalPoints]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (totalPoints < 2) return null;

  return (
    <div className="playback-bar">
      <div className="playback-controls">
        <button
          type="button"
          className="playback-btn"
          onClick={togglePlay}
          title={playing ? '暂停' : '播放'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="playback-slider-container">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalPoints - 1)}
            value={position}
            onChange={handleSeek}
            className="playback-slider"
          />
        </div>

        <span className="playback-time">
          {formatTime((position / Math.max(1, totalPoints)) * durationSec)} /{' '}
          {formatTime(durationSec)}
        </span>

        <div className="playback-speed">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`playback-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="playback-info">
        {totalPoints} 样本 · {durationSec.toFixed(0)}s
      </div>
    </div>
  );
});
