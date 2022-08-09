
export interface AdminUserDto {
    name: string;
	adminId: number;
}

export interface JoinedUserStatusDto {
    name: string;
    targetId: number;
}

export interface SetPasswordDto
{
    name: string;
    password: string;
}