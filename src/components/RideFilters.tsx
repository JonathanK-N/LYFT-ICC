import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import './RideFilters.css';

export interface RideFilterValue {
  query: string;
  date: string;
}

interface RideFiltersProps {
  value: RideFilterValue;
  onChange: (value: RideFilterValue) => void;
}

export default function RideFilters({ value, onChange }: RideFiltersProps) {
  const [local, setLocal] = useState<RideFilterValue>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (key: keyof RideFilterValue) => (event: ChangeEvent<HTMLInputElement>) => {
    const next = { ...local, [key]: event.target.value };
    setLocal(next);
    onChange(next);
  };

  return (
    <div className='ride-filters'>
      <input
        aria-label='Recherche'
        placeholder='Ville, église ou conducteur'
        value={local.query}
        onChange={handleChange('query')}
      />
      <input
        aria-label='Date'
        type='date'
        value={local.date}
        onChange={handleChange('date')}
      />
    </div>
  );
}
