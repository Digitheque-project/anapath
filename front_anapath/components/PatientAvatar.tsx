'use client';

import { getPatientInitials } from '@/lib/patientInitials';

interface PatientAvatarProps {
  nom?: string | null;
  prenom?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-[11px]',
};

/** Avatar rond affichant les initiales du patient, à la place d'une icône générique. */
export default function PatientAvatar({ nom, prenom, size = 'md', className = '' }: PatientAvatarProps) {
  const initials = getPatientInitials(nom, prenom);
  const sizeClass = SIZE_CLASSES[size];
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#00478d]/10 flex items-center justify-center shrink-0 ${className}`}
    >
      <span className="text-[#00478d] font-bold tracking-tight">{initials}</span>
    </div>
  );
}
