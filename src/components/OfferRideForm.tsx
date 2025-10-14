import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { geocodeAddress } from "../lib/map/geocoding";
import { useAppState } from "../contexts/AppStateContext";
import "./OfferRideForm.css";

interface FormState {
  origin: string;
  destination: string;
  departure: string;
  seats: number;
  notes: string;
}

const initialState: FormState = {
  origin: "",
  destination: "",
  departure: "",
  seats: 3,
  notes: "",
};

export default function OfferRideForm() {
  const { currentUser, createRide } = useAppState();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
  const isDriver = currentUser?.role === "driver";

  const handleChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = key === "seats" ? Number(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isDriver) {
      setError("Vous devez disposer d'un profil conducteur pour proposer un trajet.");
      return;
    }
    if (!form.origin || !form.destination || !form.departure) {
      setError("Merci de renseigner les lieux et la date de départ.");
      return;
    }

    if (!mapboxToken) {
      setError("Ajoutez VITE_MAPBOX_TOKEN dans vos variables d'environnement pour publier un trajet.");
      return;
    }

    setLoading(true);
    try {
      const [origin, destination] = await Promise.all([
        geocodeAddress(form.origin, mapboxToken),
        geocodeAddress(form.destination, mapboxToken),
      ]);

      await createRide({
        origin,
        destination,
        departureTime: new Date(form.departure).toISOString(),
        seatsAvailable: form.seats,
        notes: form.notes || undefined,
      });

      setSuccess("Trajet publié avec succès.");
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le trajet.");
    } finally {
      setLoading(false);
    }
  };

  if (!mapboxToken) {
    return (
      <section className="offer-ride">
        <h2>Proposer un trajet</h2>
        <p className="offer-ride__info">Ajoutez VITE_MAPBOX_TOKEN dans vos variables d'environnement pour activer le géocodage.</p>
      </section>
    );
  }

  return (
    <section className="offer-ride">
      <h2>Proposer un trajet</h2>
      {!isDriver ? (
        <p className="offer-ride__info">
          Votre profil est actuellement passager. Complétez votre véhicule dans l'onglet profil pour devenir conducteur.
        </p>
      ) : (
        <>
          <p className="offer-ride__info">
            Renseignez les informations principales. Les passagers verront votre trajet immédiatement.
          </p>
          <form className="offer-ride__form" onSubmit={handleSubmit}>
            <label htmlFor="origin">Point de départ</label>
            <input
              id="origin"
              value={form.origin}
              onChange={handleChange("origin")}
              placeholder="Ex. 57 rue du Commerce, Paris"
              required
            />

            <label htmlFor="destination">Destination</label>
            <input
              id="destination"
              value={form.destination}
              onChange={handleChange("destination")}
              placeholder="Ex. Impact Centre Chretien, Evry"
              required
            />

            <label htmlFor="departure">Date et heure de départ</label>
            <input
              id="departure"
              type="datetime-local"
              value={form.departure}
              onChange={handleChange("departure")}
              required
            />

            <label htmlFor="seats">Places disponibles</label>
            <input
              id="seats"
              type="number"
              min={1}
              max={8}
              value={form.seats}
              onChange={handleChange("seats")}
            />

            <label htmlFor="notes">Message aux passagers (optionnel)</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={handleChange("notes")}
              rows={3}
              placeholder="Informations utiles, point de rendez-vous..."
            />

            {error ? <p className="offer-ride__error">{error}</p> : null}
            {success ? <p className="offer-ride__success">{success}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Publication en cours..." : "Publier le trajet"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
