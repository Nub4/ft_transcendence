import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class NewUserDto {

    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsString()
    username: string;
}

export class tfaDto {
    @IsNotEmpty()
    @IsBoolean()
    tfa: boolean;
}

export class tfaCodeDto {
    @IsNotEmpty()
    @IsString()
    tfaCode: string;
}