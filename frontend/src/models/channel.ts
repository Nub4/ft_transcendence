import {User} from './user';

export enum ChannelStatus
{
    public = 'public',
    private = 'private',
    protected = 'protected',
    direct = 'direct',
}

export class JoinedUserStatus
{
    constructor(
    public id: number,
    public owner: boolean,
    public admin: boolean,
    public muted: boolean,
    public banned: boolean,
    public user: User,
    ) {}
}

export class Channel
{
    constructor(
        public id: number,
        public name: string,
        public status: ChannelStatus,
        public members: User[],
        public userStatus: JoinedUserStatus[],
    ) {}
}