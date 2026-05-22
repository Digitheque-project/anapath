import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnapathRequest, Statut } from './entities/anapath-request.entity';
import { CreateAnapathDto } from './dto/create-anapath.dto';
import { UpdateAnapathDto } from './dto/update-anapath.dto';
import { ValidateAnapathDto } from './dto/validate-anapath.dto';
import * as crypto from 'crypto';

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

  async create(createDto: CreateAnapathDto): Promise<AnapathRequest> {
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

    return this.anapathRepository.save(request);
  }

  async findAll(): Promise<AnapathRequest[]> {
    return this.anapathRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<AnapathRequest> {
    const request = await this.anapathRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande ${id} non trouvée`);
    return request;
  }

  async update(id: string, updateDto: UpdateAnapathDto): Promise<AnapathRequest> {
    const request = await this.findOne(id);
    Object.assign(request, updateDto);
    return this.anapathRepository.save(request);
  }

  async validate(id: string, dto: ValidateAnapathDto): Promise<AnapathRequest> {
    const request = await this.findOne(id);
    if (request.statut === Statut.VALIDE)
      throw new BadRequestException('Déjà validée');
    if (request.statut !== Statut.RESULTAT_DISPONIBLE)
      throw new BadRequestException('Résultat non disponible');

    const hash = crypto.createHash('sha256')
      .update(`${request.anapathId}-${dto.signature}-${dto.ordreProfessionnelNumber}`)
      .digest('hex');

    request.statut = Statut.VALIDE;
    request.validatedByUserId = dto.ordreProfessionnelNumber;
    request.validatedAt = new Date();
    request.signedHash = hash;

    return this.anapathRepository.save(request);
  }
}
