import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import './OfferRideForm.css';

interface RequestRideFormProps {
  selectedEvent?: string;
}

interface FormState {
  pickupAddress: string;
  notes: string;
}

const initialState: FormState = {
  pickupAddress: '',
  notes: '',
};

export default function RequestRideForm({ selectedEvent }: RequestRideFormProps) {
  const { currentUser, events, requestRide, rides } = useAppState();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<string>('');

  const handleChange = (key: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const availableRides = rides.filter(ride => 
    selectedEvent ? ride.eventId === selectedEvent : true
  ).filter(ride => 
    ride.driverId !== currentUser?.id && 
    ride.seatsAvailable > ride.seatsBooked
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRide) {
      setError('Veuillez sélectionner un trajet.');
      return;
    }
    if (!form.pickupAddress.trim()) {
      setError('Veuillez entrer votre adresse de prise en charge.');
      return;
    }

    setLoading(true);
    try {
      await requestRide(selectedRide, `Adresse de prise en charge: ${form.pickupAddress}. ${form.notes}`);
      setSuccess('Demande envoyée au conducteur.');
      setForm(initialState);
      setSelectedRide('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'envoyer la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="offer-ride">
      <h2>Demander un trajet</h2>
      {selectedEvent && (
        <div className="selected-event">
          <strong>Événement sélectionné:</strong>
          {events.find(e => e.id === selectedEvent)?.title}
        </div>
      )}
      
      {availableRides.length === 0 ? (
        <p className="offer-ride__info">
          Aucun trajet disponible pour cet événement pour le moment.
        </p>
      ) : (
        <>
          <p className="offer-ride__info">
            Sélectionnez un trajet et indiquez votre adresse de prise en charge.
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
                  {ride.driverName} - {ride.origin} → {ride.destination} 
                  ({new Date(ride.departureTime).toLocaleString()})
                </option>
              ))}
            </select>

            <label htmlFor="pickupAddress">Votre adresse de prise en charge</label>
            <input
              id="pickupAddress"
              value={form.pickupAddress}
              onChange={handleChange('pickupAddress')}
              placeholder="123 rue Example, Sherbrooke, QC"
              required
            />

            <label htmlFor="notes">Message pour le conducteur (optionnel)</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
              placeholder="Informations supplémentaires..."
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