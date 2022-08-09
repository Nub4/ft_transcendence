import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
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
    getMatches(@Param('id', ParseIntPipe) id: number)
    {
        return this.matchService.getMatches(id);
    }
}
