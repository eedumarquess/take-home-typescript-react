import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsString, IsUrl, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN!: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  NODE_ENV!: string;

  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  FRONTEND_URL!: string;

  @Transform(({ value }) => Number(value ?? 60))
  @IsInt()
  @Min(1)
  THROTTLE_TTL_SECONDS = 60;

  @Transform(({ value }) => Number(value ?? 100))
  @IsInt()
  @Min(1)
  THROTTLE_LIMIT = 100;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  COOKIE_SECURE = false;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .flatMap((error) =>
        Object.values(error.constraints ?? {}).map(
          (constraint) => `${error.property}: ${constraint}`,
        ),
      )
      .join(', ');

    throw new Error(`Invalid environment variables: ${message}`);
  }

  return validatedConfig;
}
