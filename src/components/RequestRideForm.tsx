import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { geocodeAddress } from '../lib/map/geocoding';
import { useAppState } from '../contexts/AppStateContext';
import './OfferRideForm.css';

interface RequestRideFormProps {
  selectedEvent?: string;
}

interface FormState {
  pickupAddress: string;
  notes: string;
  passengers: number;
}

const initialState: FormState = {
  pickupAddress: '',
  notes: '',
  passengers: 1,
};

export default function RequestRideForm({ selectedEvent }: RequestRideFormProps) {
  const { currentUser, events, requestRide, rides } = useAppState();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<string>('');
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

  const handleChange = (key: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const value = key === 'passengers' ? Number(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const availableRides = rides
    .filter((ride) => (selectedEvent ? ride.eventId === selectedEvent : true))
    .filter(
      (ride) => ride.driverId !== currentUser?.id && ride.seatsAvailable > ride.seatsBooked,
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRide) {
      setError('Veuillez selectionner un trajet.');
      return;
    }
    if (!form.pickupAddress.trim()) {
      setError('Veuillez indiquer votre adresse de prise en charge.');
      return;
    }

    setLoading(true);
    try {
      if (!mapboxToken) {
        throw new Error('Configurez VITE_MAPBOX_TOKEN pour activer la geolocalisation.');
      }
      const pickup = await geocodeAddress(form.pickupAddress, mapboxToken);
      await requestRide({
        rideId: selectedRide,
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        passengers: form.passengers,
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
      setSuccess('Demande envoyee au conducteur.');
      setForm(initialState);
      setSelectedRide('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d envoyer la demande.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mapboxToken) {
    return (
      <section className="offer-ride">
        <h2>Demander un trajet</h2>
        <p className="offer-ride__info">
          Ajoutez VITE_MAPBOX_TOKEN dans vos variables d environnement pour activer la
          localisation des adresses.
        </p>
      </section>
    );
  }

  return (
    <section className="offer-ride">
      <h2>Demander un trajet</h2>
      {selectedEvent ? (
        <div className="selected-event">
          <strong>Evenement selectionne :</strong>
          {events.find((evt) => evt.id === selectedEvent)?.title}
        </div>
      ) : null}

      {availableRides.length === 0 ? (
        <p className="offer-ride__info">
          Aucun trajet disponible pour cet evenement pour le moment.
        </p>
      ) : (
        <>
          <p className="offer-ride__info">
            Selectionnez un trajet et indiquez votre adresse de prise en charge.
          </p>
          <form className="offer-ride__form" onSubmit={handleSubmit}>
            <label htmlFor="ride-select">Trajet disponible</label>
            <select
              id="ride-select"
              value={selectedRide}
              onChange={(e) => setSelectedRide(e.target.value)}
              required
            >
              <option value="">Choisir un trajet</option>
              {availableRides.map((ride) => (
                <option key={ride.id} value={ride.id}>
                  {ride.driverName} - {ride.origin}
                  {' -> '}
                  {ride.destination} (
                  {new Date(ride.departureTime).toLocaleString()})
                </option>
              ))}
            </select>

            <label htmlFor="pickupAddress">Votre adresse de prise en charge</label>
            <input
              id="pickupAddress"
              value={form.pickupAddress}
              onChange={handleChange('pickupAddress')}
              placeholder="123 rue Exemple, Sherbrooke, QC"
              required
            />

            <label htmlFor="passengers">Nombre de passagers</label>
            <select
              id="passengers"
              value={form.passengers}
              onChange={handleChange('passengers')}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} passager{count > 1 ? 's' : ''}
                </option>
              ))}
            </select>

            <label htmlFor="notes">Message pour le conducteur (optionnel)</label>
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
              {loading ? 'Envoi...' : 'Demander le trajet'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
