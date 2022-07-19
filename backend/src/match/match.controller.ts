import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/decorators/user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { MatchDto } from './dto/match.dto';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController
{
    constructor(
        private matchService: MatchService
    ) {}

    @Post()
    saveMatch(@Body() matchData: MatchDto)
    {
        return this.matchService.saveMatch(matchData);
    }

    @Get("/:id")
    @UseGuards(JwtGuard)
    getMatches(@Param('id') id: number)
    {
        return this.matchService.getMatches(id);
    }
}
