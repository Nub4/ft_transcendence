import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity, UserLevel } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { MatchDto } from './dto/match.dto';
import { MatchEntity } from './entities/match.entity';

@Injectable()
export class MatchService
{
    constructor(
        @InjectRepository(MatchEntity) private matchRepository: Repository<MatchEntity>,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        private userService: UserService
    ) {}

    async addUserRank(user: UserEntity)
    {
        const allPlayers = await this.userRepository.find();
        const array = [];
        for (var player of allPlayers)
            array.push([player, (player.wins-player.losses)]);
        array.sort(function(a, b) {
            return b[1] - a[1];
        });
        const index = array.findIndex(e => e[0].id === user.id);
        user.rank = index + 1;
        await this.userRepository.save(user);
    }

    async addNewLevel(user: UserEntity)
    {
        if (user.wins - user.losses > 5)
            user.level = UserLevel.advanced;
        if (user.wins - user.losses > 10)
            user.level = UserLevel.pro;
        if (user.wins - user.losses > 15)
            user.level = UserLevel.expert;
        await this.userRepository.save(user);   
    }

    async addNewStats(homePlayer: UserEntity, awayPlayer: UserEntity, winner: UserEntity)
    {
        if (winner.id === homePlayer.id)
        {
            homePlayer.wins++;
            awayPlayer.losses++;
        }
        else
        {   awayPlayer.wins++;
            homePlayer.losses++;
        }
        await this.userRepository.save(homePlayer);
        await this.userRepository.save(awayPlayer);
    }

    async saveMatch(matchData: MatchDto) {
        const match = this.matchRepository.create();

        let homePlayer = await this.userService.getUserById(matchData.homePlayerId);
        let awayPlayer = await this.userService.getUserById(matchData.awayPlayerId);
        let winner = await this.userService.getUserById(matchData.winnerId);
        match.homePlayer = homePlayer;
        match.awayPlayer = awayPlayer;
        match.winner = winner
        match.homeScore = matchData.homeScore;
        match.awayScore = matchData.awayScore;
        
        let temp = await this.matchRepository.save(match);
        await this.addNewStats(match.homePlayer, match.awayPlayer, match.winner);
        await this.addNewLevel(match.homePlayer);
        await this.addNewLevel(match.awayPlayer);
        await this.addUserRank(match.homePlayer);
        await this.addUserRank(match.awayPlayer);

        return temp;
    }

    async getHomeMatches(id: number): Promise<MatchEntity[]>
    {
        let user: UserEntity = await this.userService.getUserById(id);
        let temp = await this.matchRepository.find({ where: { homePlayer: {id: user.id} }}); 
        return temp;

    }

    async getAwayMatches(id: number): Promise<MatchEntity[]>
    {
        let user: UserEntity = await this.userService.getUserById(id);
        let temp = await this.matchRepository.find({ where: { awayPlayer: {id: user.id} }}); 
        return temp;
    }

    async getMatches(id: number): Promise<MatchEntity[]>
    {
        let temp = (await this.getHomeMatches(id)).concat(await this.getAwayMatches(id));
        return temp;
    }
}
