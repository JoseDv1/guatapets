import { postTypeEnum, speciesEnum, statusEnum, genderEnum } from '../db/schema';

export const TYPE_LABELS: Record<typeof postTypeEnum[number], string> = {
  lost: 'Perdido',
  found: 'Encontrado',
  adopted: 'Adoptado',
  adoption: 'En Adopción'
};

export const SPECIES_LABELS: Record<typeof speciesEnum[number], string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  other: 'Otro'
};

export const STATUS_LABELS: Record<typeof statusEnum[number], string> = {
  active: 'Activo',
  resolved: 'Resuelto'
};

export const GENDER_LABELS: Record<typeof genderEnum[number], string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido'
};

export const FILTER_OPTIONS = {
  type: [
    { value: '', label: 'Todos' },
    ...postTypeEnum.map((value) => ({
      value,
      label: TYPE_LABELS[value]
    }))
  ],
  species: [
    { value: '', label: 'Todas' },
    ...speciesEnum.map((value) => ({
      value,
      label: SPECIES_LABELS[value]
    }))
  ],
  status: [
    { value: '', label: 'Todos' },
    ...statusEnum.map((value) => ({
      value,
      label: STATUS_LABELS[value]
    }))
  ]
};
