import { IsOptional, IsString } from 'class-validator';

export class AudioSpecsDto {
  @IsOptional()
  @IsString()
  impedance?: string;

  @IsOptional()
  @IsString()
  frequencyResponse?: string;

  @IsOptional()
  @IsString()
  driverType?: string;

  @IsOptional()
  @IsString()
  driverSize?: string;

  @IsOptional()
  @IsString()
  sensitivity?: string;

  @IsOptional()
  @IsString()
  thd?: string;

  @IsOptional()
  @IsString()
  cableLength?: string;

  @IsOptional()
  @IsString()
  connector?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  dacChip?: string;

  @IsOptional()
  @IsString()
  outputPower?: string;

  @IsOptional()
  @IsString()
  snr?: string;
}
