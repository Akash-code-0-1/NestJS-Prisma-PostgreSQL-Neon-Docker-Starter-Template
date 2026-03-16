import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
