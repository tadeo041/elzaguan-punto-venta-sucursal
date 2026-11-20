import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipsSeedService } from './tips-seed.service';
import { Tip } from '../tips/tip.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tip, User])],
    providers: [TipsSeedService],
})
export class SeedModule {}