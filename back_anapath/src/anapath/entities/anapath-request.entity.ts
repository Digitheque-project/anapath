import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExamenType {
  FCV_PAP = 'FCV_PAP',
  CYT0PONCTION = 'CYT0PONCTION',
  LIQUIDE = 'LIQUIDE',
  BIOPSIE = 'BIOPSIE',
  EXTEMPORANE_STAT = 'EXTEMPORANE_STAT',
  POS = 'POS',
  POC = 'POC',
}

export enum Statut {
  CREEE = 'CREEE',
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  RESULTAT_DISPONIBLE = 'RESULTAT_DISPONIBLE',
  VALIDE = 'VALIDE',
  ARCHIVE = 'ARCHIVE',
  ANNULEE = 'ANNULEE',
}

@Entity('anapath_requests')
export class AnapathRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  anapathId: string;

  @Column()
  @Index()
  patientId: string;

  @Column({ nullable: true })
  episodeId: string;

  @Column({ nullable: true })
  prescriptionId: string;

  @Column({ type: 'enum', enum: ExamenType })
  typeExamen: ExamenType;

  @Column({ default: false })
  isExtemporane: boolean;

  @Column({ type: 'timestamp', nullable: true })
  extemporaneDeadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  extemporaneAlertSentAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  patientInfo: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  prelevement: object;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  resultat: object;

  @Column({ type: 'text', nullable: true })
  resultatDetails: string;

  @Column({ type: 'text', nullable: true })
  resultatConclusion: string;

  @Column({ type: 'enum', enum: Statut, default: Statut.CREEE })
  statut: Statut;

  @Column({ nullable: true })
  validatedBySignature: string;

  @Column({ nullable: true })
  validatedByUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({ nullable: true })
  validationHash: string;

  @Column({ nullable: true })
  signedHash: string;

  @Column({ nullable: true })
  motifAnnulation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}