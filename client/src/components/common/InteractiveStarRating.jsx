import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_LABELS = {
  1: '1 Star — Poor',
  2: '2 Stars — Fair',
  3: '3 Stars — Good',
  4: '4 Stars — Very Good',
  5: '5 Stars — Excellent'
};

const InteractiveStarRating = ({
  value = 0,
  onChange,
  size = 28,
  disabled = false,
  showLabel = true,
  maxStars = 5
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  const handleStarClick = (starScore) => {
    if (disabled || !onChange) return;
    onChange(starScore);
  };

  const handleKeyDown = (e, starScore) => {
    if (disabled || !onChange) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(maxStars, (value || 0) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 2) - 1);
      onChange(prev);
    } else if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      onChange(parseInt(e.key, 10));
    }
  };

  return (
    <div
      className="interactive-rating-box"
      role="radiogroup"
      aria-label="Star Rating Selector (use 1-5 or arrow keys)"
    >
      <div
        className="interactive-stars-row"
        onMouseLeave={() => !disabled && setHoverValue(0)}
      >
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starScore = idx + 1;
          const isFilled = displayValue >= starScore;
          const isSelected = value === starScore;

          return (
            <button
              key={starScore}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`star-pick-btn ${isFilled ? 'filled' : 'empty'} ${hoverValue === starScore ? 'hovered' : ''}`}
              onClick={() => handleStarClick(starScore)}
              onMouseEnter={() => !disabled && setHoverValue(starScore)}
              onFocus={() => !disabled && setHoverValue(starScore)}
              onBlur={() => !disabled && setHoverValue(0)}
              onKeyDown={(e) => handleKeyDown(e, starScore)}
              disabled={disabled}
              aria-label={`${starScore} star${starScore > 1 ? 's' : ''}: ${RATING_LABELS[starScore]}`}
              tabIndex={isSelected || (value === 0 && starScore === 1) ? 0 : -1}
            >
              <Star
                size={size}
                fill={isFilled ? '#f59e0b' : 'none'}
                color={isFilled ? '#f59e0b' : '#cbd5e1'}
                strokeWidth={isFilled ? 1.5 : 2}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <div className="rating-descriptor-text" aria-live="polite">
          {displayValue > 0 ? (
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {RATING_LABELS[displayValue]}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              Select a rating from 1 to 5 stars
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveStarRating;
