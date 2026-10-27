import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormError from '../common/FormError';
import InteractiveStarRating from '../common/InteractiveStarRating';
import storeService from '../../services/storeService';
import { Store, Star, MapPin, CheckCircle2 } from 'lucide-react';

const RatingModal = ({
  isOpen = false,
  onClose,
  store = null,
  onRatingSuccess
}) => {
  const isEditing = Boolean(store?.user_submitted_rating);

  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prepopulate rating if user already rated this store
  useEffect(() => {
    if (store && store.user_submitted_rating) {
      setRating(store.user_submitted_rating);
    } else {
      setRating(0);
    }
    setError('');
  }, [store]);

  if (!store) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isEditing) {
        result = await storeService.modifyRating(store.id, rating);
      } else {
        result = await storeService.submitRating(store.id, rating);
      }

      if (onRatingSuccess) {
        onRatingSuccess({
          storeId: store.id,
          storeName: store.name,
          newRating: rating,
          overallRating: result.data?.overall_rating,
          totalRatings: result.data?.total_ratings,
          isEditing
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modify Your Rating' : 'Submit Store Rating'}
      subtitle={isEditing ? 'Update your feedback score for this merchant' : 'Share your authentic consumer experience'}
      maxWidth="480px"
    >
      {error && <FormError message={error} type="danger" />}

      {/* Store context card */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Store size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {store.name}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <MapPin size={14} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
          <span>{store.address}</span>
        </div>

        {isEditing && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            Your current rating: {store.user_submitted_rating} / 5 stars
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            {isEditing ? 'Choose your updated score:' : 'How would you rate this store?'}
          </label>

          <InteractiveStarRating
            value={rating}
            onChange={setRating}
            size={36}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={isEditing ? CheckCircle2 : Star}
          >
            {isEditing ? 'Update Rating' : 'Submit Rating'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RatingModal;
