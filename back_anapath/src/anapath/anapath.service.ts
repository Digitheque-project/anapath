import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnapathRequest, Statut } from './entities/anapath-request.entity';
import { CreateAnapathDto } from './dto/create-anapath.dto';
import { UpdateAnapathDto } from './dto/update-anapath.dto';
import { ValidateAnapathDto } from './dto/validate-anapath.dto';
import * as crypto from 'crypto';

export type AnapathRequestResponse = AnapathRequest & {
  resultat: { details: string | null; conclusion: string | null };
  validationHash: string | null;
};

@Injectable()
export class AnapathService {
  constructor(
    @InjectRepository(AnapathRequest)
    private anapathRepository: Repository<AnapathRequest>,
  ) {}

  private generateAnapathId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `ANP-${year}-${random}`;
  }

  private getResultatFromJson(entity: AnapathRequest): {
    details?: string;
    conclusion?: string;
  } | null {
    if (!entity.resultat || typeof entity.resultat !== 'object') return null;
    return entity.resultat as { details?: string; conclusion?: string };
  }

  toResponse(entity: AnapathRequest): AnapathRequestResponse {
    const jsonResultat = this.getResultatFromJson(entity);
    const details =
      entity.resultatDetails ?? jsonResultat?.details ?? null;
    const conclusion =
      entity.resultatConclusion ?? jsonResultat?.conclusion ?? null;

    return {
      ...entity,
      resultat: { details, conclusion },
      validatedBySignature: entity.validatedBySignature ?? null,
      validatedByUserId: entity.validatedByUserId ?? null,
      validationHash: entity.validationHash ?? entity.signedHash ?? null,
      validatedAt: entity.validatedAt ?? null,
    } as AnapathRequestResponse;
  }

  private syncResultatFields(entity: AnapathRequest): void {
    entity.resultat = {
      details: entity.resultatDetails ?? null,
      conclusion: entity.resultatConclusion ?? null,
    };
  }

  async create(createDto: CreateAnapathDto): Promise<AnapathRequestResponse> {
    const anapathId = this.generateAnapathId();
    const request = this.anapathRepository.create({
      ...createDto,
      anapathId,
      statut: Statut.CREEE,
    });

    if (createDto.isExtemporane) {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 30);
      request.extemporaneDeadline = deadline;
    }

    const saved = await this.anapathRepository.save(request);
    return this.toResponse(saved);
  }

  async findAll(): Promise<AnapathRequestResponse[]> {
    const rows = await this.anapathRepository.find({ order: { createdAt: 'DESC' } });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(id: string): Promise<AnapathRequestResponse> {
    const request = await this.anapathRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande ${id} non trouvée`);
    return this.toResponse(request);
  }

  async findOneEntity(id: string): Promise<AnapathRequest> {
    const request = await this.anapathRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande ${id} non trouvée`);
    return request;
  }

  async update(id: string, updateDto: UpdateAnapathDto): Promise<AnapathRequestResponse> {
    const request = await this.findOneEntity(id);

    if (
      updateDto.resultatDetails !== undefined ||
      updateDto.resultat?.details !== undefined ||
      updateDto.description !== undefined
    ) {
      request.resultatDetails =
        updateDto.resultatDetails ??
        updateDto.resultat?.details ??
        updateDto.description ??
        request.resultatDetails;
    }

    if (
      updateDto.resultatConclusion !== undefined ||
      updateDto.resultat?.conclusion !== undefined ||
      updateDto.conclusion !== undefined
    ) {
      request.resultatConclusion =
        updateDto.resultatConclusion ??
        updateDto.resultat?.conclusion ??
        updateDto.conclusion ??
        request.resultatConclusion;
    }

    if (updateDto.statut !== undefined) request.statut = updateDto.statut;
    if (updateDto.prelevement !== undefined) request.prelevement = updateDto.prelevement;
    if (updateDto.motifAnnulation !== undefined) request.motifAnnulation = updateDto.motifAnnulation;

    this.syncResultatFields(request);

    const saved = await this.anapathRepository.save(request);
    return this.toResponse(saved);
  }

  async validate(id: string, dto: ValidateAnapathDto): Promise<AnapathRequestResponse> {
    const request = await this.findOneEntity(id);
    if (request.statut === Statut.VALIDE)
      throw new BadRequestException('Déjà validée');
    if (request.statut !== Statut.RESULTAT_DISPONIBLE)
      throw new BadRequestException('Résultat non disponible');

    const numeroOrdre = dto.numeroOrdre ?? dto.ordreProfessionnelNumber;
    const hash =
      dto.hash ??
      crypto
        .createHash('sha256')
        .update(`${request.anapathId}-${dto.signature}-${numeroOrdre}`)
        .digest('hex');

    if (dto.resultatDetails !== undefined) {
      request.resultatDetails = dto.resultatDetails;
    }
    if (dto.resultatConclusion !== undefined) {
      request.resultatConclusion = dto.resultatConclusion;
    }

    request.statut = Statut.VALIDE;
    request.validatedBySignature = dto.signature;
    request.validatedByUserId = numeroOrdre;
    request.validatedAt = new Date();
    request.validationHash = hash;
    request.signedHash = hash;

    this.syncResultatFields(request);

    const saved = await this.anapathRepository.save(request);
    return this.toResponse(saved);
  }
}
