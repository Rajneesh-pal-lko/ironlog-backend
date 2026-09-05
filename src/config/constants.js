// Single source of truth for default fixed values
// Edit this file to change defaults — never hardcode these elsewhere

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Full Body',
];

export const SUBCATEGORIES = {
  Chest:      ['Upper Chest', 'Middle Chest', 'Lower Chest', 'Inner Chest'],
  Back:       ['Upper Back', 'Mid Back', 'Lower Back', 'Lats', 'Traps'],
  Legs:       ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors'],
  Shoulders:  ['Front Delt', 'Side Delt', 'Rear Delt', 'Rotator Cuff'],
  Arms:       ['Biceps', 'Triceps', 'Forearms'],
  Core:       ['Upper Abs', 'Lower Abs', 'Obliques', 'Transverse'],
  Cardio:     ['HIIT', 'Steady State', 'Plyometrics'],
  'Full Body': ['Compound', 'Olympic'],
};

export const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Bodyweight',
  'Cable',
  'Dumbbell',
  'EZ Bar',
  'Kettlebell',
  'Machine',
  'Resistance Band',
  'Smith Machine',
  'Other',
];

export const MOVEMENT_TYPES = [
  'Carry',
  'Hinge',
  'Isolation',
  'Pull',
  'Push',
  'Squat',
];
