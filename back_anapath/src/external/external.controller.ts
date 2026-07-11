import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePrescriptionAnapathDto } from './dto/create-prescription-anapath.dto';
import { ExternalService } from './external.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('external')
@Controller('external')
export class ExternalController {
  constructor(private externalService: ExternalService) {}

  @Public()
  @Post('anapath')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Recevoir une prescription Anapath depuis le service de prescription' })
  @ApiResponse({ status: 201, description: 'Prescription créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async createFromPrescription(
    @Body() dto: CreatePrescriptionAnapathDto,
    @Headers('x-service-id') serviceIdHeader?: string,
  ) {
    return this.externalService.createFromPrescription(dto, serviceIdHeader);
  }
}

