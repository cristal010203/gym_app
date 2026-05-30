export type Logro = {
  id: string;
  titulo: string;
  emoji: string;
  desbloqueado: boolean;
};

export function obtenerLogros(stats: {
  rutinas: number;
  ejercicios: number;
  diasActivos: number;
  sesiones: number;
}): Logro[] {
  return [
    {
      id: 'primera_rutina',
      titulo: 'Primera rutina',
      emoji: '🥇',
      desbloqueado: stats.rutinas >= 1,
    },
    {
      id: 'primer_entreno',
      titulo: 'Primer entrenamiento',
      emoji: '💪',
      desbloqueado: stats.sesiones >= 1,
    },
    {
      id: 'constancia',
      titulo: 'Constancia',
      emoji: '🔥',
      desbloqueado: stats.diasActivos >= 3,
    },
    {
      id: 'maestro',
      titulo: 'Maestro fitness',
      emoji: '🏋️',
      desbloqueado: stats.ejercicios >= 10,
    },
    {
      id: 'dedicado',
      titulo: 'Dedicado',
      emoji: '⚡',
      desbloqueado: stats.sesiones >= 5,
    },
  ];
}