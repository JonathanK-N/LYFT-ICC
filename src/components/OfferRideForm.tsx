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
      setError('Vous devez etre conducteur pour proposer un trajet.');
      return;
    }
    if (!form.origin || (!form.destination && !selectedEvent) || !form.departure) {
      setError('Veuillez renseigner l origine, la destination et l heure de depart.');
      return;
    }

    if (!mapboxToken) {
      setError('Configurez VITE_MAPBOX_TOKEN pour publier un trajet.');
      return;
    }

    setLoading(true);
    try {
      const origin = await geocodeAddress(form.origin, mapboxToken);
      let destination;

      if (selectedEvent) {
        const eventItem = events.find((evt) => evt.id === selectedEvent);
        if (!eventItem?.location) {
          setError('Evenement selectionne sans adresse definie.');
          return;
        }
        destination = await geocodeAddress(eventItem.location, mapboxToken);
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

      setSuccess('Trajet publie avec succes.');
      setForm(initialState);
    } catch (err) {
      setError('Impossible de creer le trajet.');
    } finally {
      setLoading(false);
    }
  };

  if (!mapboxToken) {
    return (
      <section className="offer-ride">
        <h2>Proposer un trajet</h2>
        <p className="offer-ride__info">
          Ajoutez VITE_MAPBOX_TOKEN dans vos variables d environnement pour activer la geolocalisation.
        </p>
      </section>
    );
  }

  return (
    <section className="offer-ride">
      <h2>Proposer un trajet</h2>
      {!isDriver ? (
        <p className="offer-ride__info">
          Votre profil est actuellement passager. Completez votre vehicule dans l onglet profil pour devenir conducteur.
        </p>
      ) : (
        <>
          <p className="offer-ride__info">
            Proposez un trajet pour un evenement ICC. Les passagers verront votre offre immediatement.
          </p>
          {selectedEvent && (
            <div className="selected-event">
              <strong>Evenement selectionne :</strong>
              {events.find((evt) => evt.id === selectedEvent)?.title}
            </div>
          )}
          <form className="offer-ride__form" onSubmit={handleSubmit}>
            <label htmlFor="origin">Point de depart</label>
            <input
              id="origin"
              value={form.origin}
              onChange={handleChange('origin')}
              placeholder="Adresse de depart"
              required
            />

            {!selectedEvent ? (
              <>
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  value={form.destination}
                  onChange={handleChange('destination')}
                  placeholder="Adresse d arrivee"
                  required
                />
              </>
            ) : null}

            <label htmlFor="departure">Heure de depart</label>
            <input
              id="departure"
              type="datetime-local"
              value={form.departure}
              onChange={handleChange('departure')}
              required
            />

            <label htmlFor="seats">Places disponibles</label>
            <select
              id="seats"
              value={form.seats}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seats: Number(event.target.value) }))
              }
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} place{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>

            <label htmlFor="notes">Message pour les passagers (optionnel)</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
              placeholder="Informations supplementaires..."
            />

            {error ? <p className="offer-ride__error">{error}</p> : null}
            {success ? <p className="offer-ride__success">{success}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? 'Publication...' : 'Publier le trajet'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
