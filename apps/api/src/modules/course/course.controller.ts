import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { CourseService } from './course.service';
import type {
  CourseDto,
  CourseListResult,
  CreateLessonDto,
  CreateQuestionTemplateDto,
  CreateCourseDto,
  CreateQuizDto,
  LessonDto,
  QuestionTemplateDto,
  QuizAttemptDto,
  QuizDto,
  QuizListDto,
  SubmitAnswerDto,
  SubmitAnswerResultDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateQuestionTemplateDto,
  UpdateQuizDto,
  EnrollOthersDto,
  EnrollPreviewDto,
} from './course.types';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Public()
  @Get()
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('q') q?: string,
  ): Promise<CourseListResult> {
    return this.courseService.findAll(Number(skip), Number(take), status, level, q);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Request() req: { user?: JwtPayload }): Promise<CourseDto> {
    return this.courseService.findBySlug(slug, req.user?.sub, req.user?.role);
  }

  @Can('create', 'course')
  @Post()
  create(
    @Body() dto: CreateCourseDto,
    @Request() req: { user: JwtPayload },
  ): Promise<CourseDto> {
    return this.courseService.create(dto, req.user.sub);
  }

  @Can('update', 'course')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateCourseDto): Promise<CourseDto> {
    return this.courseService.update(slug, dto);
  }

  @Can('delete', 'course')
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): Promise<void> {
    return this.courseService.delete(slug);
  }

  @Post(':id/enroll')
  @Can('enroll', 'course')
  @HttpCode(HttpStatus.CREATED)
  enroll(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.courseService.enroll(id, req.user.sub);
  }

  @Post(':id/enroll-others')
  @Can('update', 'course')
  @HttpCode(HttpStatus.CREATED)
  enrollOthers(
    @Param('id') id: string,
    @Body() dto: EnrollOthersDto,
  ): Promise<void> {
    return this.courseService.enrollOthers(id, dto);
  }

  @Post(':id/enroll-preview')
  @Can('update', 'course')
  previewEnrollment(
    @Param('id') id: string,
    @Body() dto: EnrollOthersDto,
  ): Promise<EnrollPreviewDto> {
    return this.courseService.previewEnrollment(id, dto);
  }

  @Get(':slug/lessons/:lessonId')
  findLessonById(
    @Param('lessonId') lessonId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<LessonDto> {
    return this.courseService.findLessonById(lessonId, req.user?.sub, req.user?.role);
  }

  @Can('create', 'lesson')
  @Post(':slug/lessons')
  createLesson(
    @Param('slug') slug: string,
    @Body() dto: CreateLessonDto,
    @Request() req: { user: JwtPayload },
  ): Promise<LessonDto> {
    return this.courseService.createLesson(slug, dto, req.user.sub);
  }

  @Can('update', 'lesson')
  @Patch('lessons/:lessonId')
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonDto> {
    return this.courseService.updateLesson(lessonId, dto);
  }

  @Can('delete', 'lesson')
  @Delete('lessons/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLesson(@Param('lessonId') lessonId: string): Promise<void> {
    return this.courseService.deleteLesson(lessonId);
  }

  @Can('create', 'quiz')
  @Post('lessons/:lessonId/templates')
  createTemplate(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateQuestionTemplateDto,
  ): Promise<QuestionTemplateDto> {
    return this.courseService.createTemplate(lessonId, dto);
  }

  @Can('update', 'quiz')
  @Patch('templates/:templateId')
  updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateQuestionTemplateDto,
  ): Promise<QuestionTemplateDto> {
    return this.courseService.updateTemplate(templateId, dto);
  }

  @Can('delete', 'quiz')
  @Delete('templates/:templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTemplate(@Param('templateId') templateId: string): Promise<void> {
    return this.courseService.deleteTemplate(templateId);
  }

  @Public()
  @Get(':slug/quizzes')
  listCourseQuizzes(@Param('slug') slug: string): Promise<QuizListDto[]> {
    return this.courseService.listQuizzes(slug);
  }

  @Public()
  @Get('quizzes/:quizId')
  findQuiz(@Param('quizId') quizId: string): Promise<QuizDto> {
    return this.courseService.findQuiz(quizId);
  }

  @Can('create', 'quiz')
  @Post('quizzes')
  createQuiz(@Body() dto: CreateQuizDto): Promise<QuizDto> {
    return this.courseService.createQuiz(dto);
  }

  @Can('update', 'quiz')
  @Patch('quizzes/:quizId')
  updateQuiz(@Param('quizId') quizId: string, @Body() dto: UpdateQuizDto): Promise<QuizDto> {
    return this.courseService.updateQuiz(quizId, dto);
  }

  @Can('delete', 'quiz')
  @Delete('quizzes/:quizId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuiz(@Param('quizId') quizId: string): Promise<void> {
    return this.courseService.deleteQuiz(quizId);
  }

  @Can('take', 'quiz')
  @Post('quizzes/:quizId/start')
  startQuiz(
    @Param('quizId') quizId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<QuizAttemptDto> {
    return this.courseService.startQuiz(quizId, req.user.sub);
  }

  @Can('take', 'quiz')
  @Get('quiz-attempts/:attemptId')
  findAttempt(
    @Param('attemptId') attemptId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<QuizAttemptDto> {
    return this.courseService.findAttempt(attemptId, req.user.sub);
  }

  @Can('take', 'quiz')
  @Post('quiz-attempts/answers')
  submitAnswer(
    @Body() dto: SubmitAnswerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<SubmitAnswerResultDto> {
    return this.courseService.submitAnswer(dto, req.user.sub);
  }

  @Can('take', 'quiz')
  @Post('quiz-attempts/:attemptId/finish')
  finishAttempt(
    @Param('attemptId') attemptId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<QuizAttemptDto> {
    return this.courseService.finishAttempt(attemptId, req.user.sub);
  }
}
