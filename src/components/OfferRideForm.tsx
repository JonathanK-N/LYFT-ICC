import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { geocodeAddress } from '../lib/map/geocoding';
import { useAppState } from '../contexts/AppStateContext';
import './OfferRideForm.css';

interface FormState {
  origin: string;
  destination: string;
  departure: string;
  seats: number;
  notes: string;
}

const initialState: FormState = {
  origin: '',
  destination: '',
  departure: '',
  seats: 3,
  notes: '',
};

interface OfferRideFormProps {
  selectedEvent?: string;
}

export default function OfferRideForm({ selectedEvent }: OfferRideFormProps) {
  const { currentUser, createRide, events } = useAppState();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
  const isDriver = currentUser?.role === 'driver';

  const handleChange = (key: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = key === 'seats' ? Number(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isDriver) {
      setError('You need a driver profile to offer a ride.');
      return;
    }
    if (!form.origin || (!form.destination && !selectedEvent) || !form.departure) {
      setError('Veuillez remplir l\'origine, la destination et l\'heure de départ.');
      return;
    }

    if (!mapboxToken) {
      setError('Set VITE_MAPBOX_TOKEN to publish a ride.');
      return;
    }

    setLoading(true);
    try {
      const origin = await geocodeAddress(form.origin, mapboxToken);
      let destination;
      
      if (selectedEvent) {
        const event = events.find(e => e.id === selectedEvent);
        if (!event?.location) {
          setError('L\'événement sélectionné n\'a pas d\'adresse définie.');
          return;
        }
        destination = await geocodeAddress(event.location, mapboxToken);
      } else {
        destination = await geocodeAddress(form.destination, mapboxToken);
      }

      await createRide({
        origin,
        destination,
        departureTime: new Date(form.departure).toISOString(),
        seatsAvailable: form.seats,
        notes: form.notes || undefined,
        eventId: selectedEvent || undefined,
      });

      setSuccess('Ride published successfully.');
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create ride.');
    } finally {
      setLoading(false);
    }
  };

  if (!mapboxToken) {
    return (
      <section className="offer-ride">
        <h2>Offer a ride</h2>
        <p className="offer-ride__info">Add VITE_MAPBOX_TOKEN in your environment variables to enable geocoding.</p>
      </section>
    );
  }

  return (
    <section className="offer-ride">
      <h2>Offer a ride</h2>
      {!isDriver ? (
        <p className="offer-ride__info">
          Your profile is currently passenger. Complete your vehicle in the profile tab to become a driver.
        </p>
      ) : (
        <>
          <p className="offer-ride__info">
            Proposez un trajet pour un événement ICC. Les passagers verront votre offre immédiatement.
          </p>
          {selectedEvent && (
            <div className="selected-event">
              <strong>Événement sélectionné:</strong>
              {events.find(e => e.id === selectedEvent)?.title}
            </div>
          )}
          <form className="offer-ride__form" onSubmit={handleSubmit}>
            <label htmlFor="origin">Origin</label>
            <input
              id="origin"
              value={form.origin}
              onChange={handleChange('origin')}
              placeholder="e.g. 57 rue du Commerce, Paris"
              required
            />

            <label htmlFor="destination">Destination</label>
            {selectedEvent ? (
              <input
                id="destination"
                value={events.find(e => e.id === selectedEvent)?.location || ''}
                disabled
                style={{ background: '#f3f4f6', color: '#6b7280' }}
              />
            ) : (
              <input
                id="destination"
                value={form.destination}
                onChange={handleChange('destination')}
                placeholder="e.g. Impact Centre Chretien, Evry"
                required
              />
            )}

            <label htmlFor="departure">Departure (date & time)</label>
            <input
              id="departure"
              type="datetime-local"
              value={form.departure}
              onChange={handleChange('departure')}
              required
            />

            <label htmlFor="seats">Seats available</label>
            <input
              id="seats"
              type="number"
              min={1}
              max={8}
              value={form.seats}
              onChange={handleChange('seats')}
            />

            <label htmlFor="notes">Message for passengers (optional)</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
              placeholder="Extra info, meeting point..."
            />

            {error ? <p className="offer-ride__error">{error}</p> : null}
            {success ? <p className="offer-ride__success">{success}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish ride'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
