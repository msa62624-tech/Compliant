import { Module, Global } from '@nestjs/common';
<parameter name="CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
