import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  maxStars = 5,
  size = 16,
  showValue = true,
  count = null,
  className = ''
}) => {
  const numericRating = parseFloat(rating) || 0;

  return (
    <div className={`star-rating-container ${className}`} title={`${numericRating} out of ${maxStars} stars`}>
      <div className="stars-row">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starNumber = idx + 1;
          const isFilled = numericRating >= starNumber;
          const isHalf = !isFilled && numericRating >= starNumber - 0.5;

          return (
            <Star
              key={idx}
              size={size}
              className={`star-icon ${isFilled ? 'star-filled' : isHalf ? 'star-half' : 'star-empty'}`}
              fill={isFilled || isHalf ? '#f59e0b' : 'none'}
              color={isFilled || isHalf ? '#f59e0b' : '#cbd5e1'}
            />
          );
        })}
      </div>

      {showValue && (
        <span className="rating-numeric-score">
          {numericRating > 0 ? numericRating.toFixed(1) : 'No ratings'}
        </span>
      )}

      {count !== null && (
        <span className="rating-total-count">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default StarRating;
