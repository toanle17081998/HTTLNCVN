import { Injectable, NotFoundException } from '@nestjs/common';

import { CourseRepository } from './course.repository';
import type {
  CourseDto,
  CourseListResult,
  CreateCourseDto,
  CreateLessonDto,
  CreateQuestionTemplateDto,
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
} from './course.types';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  findAll(skip: number, take: number, status?: string): Promise<CourseListResult> {
    return this.courseRepository.findAll(skip, take, status);
  }

  async findBySlug(slug: string): Promise<CourseDto> {
    const course = await this.courseRepository.findBySlug(slug);

    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return course;
  }

  create(dto: CreateCourseDto, creatorId: string): Promise<CourseDto> {
    return this.courseRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdateCourseDto): Promise<CourseDto> {
    const course = await this.courseRepository.update(slug, dto);

    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return course;
  }

  async delete(slug: string): Promise<void> {
    await this.findBySlug(slug);
    await this.courseRepository.delete(slug);
  }

  enroll(courseId: string, userId: string): Promise<void> {
    return this.courseRepository.enroll(courseId, userId);
  }

  async findLessonById(id: string): Promise<LessonDto> {
    const lesson = await this.courseRepository.findLessonById(id);

    if (!lesson) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found.' });
    }

    return lesson;
  }

  async createLesson(courseSlug: string, dto: CreateLessonDto, creatorId: string): Promise<LessonDto> {
    const lesson = await this.courseRepository.createLesson(courseSlug, dto, creatorId);

    if (!lesson) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return lesson;
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<LessonDto> {
    const lesson = await this.courseRepository.updateLesson(id, dto);

    if (!lesson) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found.' });
    }

    return lesson;
  }

  async deleteLesson(id: string): Promise<void> {
    await this.findLessonById(id);
    await this.courseRepository.deleteLesson(id);
  }

  createTemplate(lessonId: string, dto: CreateQuestionTemplateDto): Promise<QuestionTemplateDto> {
    return this.courseRepository.createTemplate(lessonId, dto);
  }

  updateTemplate(templateId: string, dto: UpdateQuestionTemplateDto): Promise<QuestionTemplateDto> {
    return this.courseRepository.updateTemplate(templateId, dto);
  }

  deleteTemplate(templateId: string): Promise<void> {
    return this.courseRepository.deleteTemplate(templateId);
  }

  listQuizzes(courseSlug?: string): Promise<QuizListDto[]> {
    return this.courseRepository.listQuizzes(courseSlug);
  }

  async findQuiz(id: string): Promise<QuizDto> {
    const quiz = await this.courseRepository.findQuiz(id);

    if (!quiz) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Quiz not found.' });
    }

    return quiz;
  }

  createQuiz(dto: CreateQuizDto): Promise<QuizDto> {
    return this.courseRepository.createQuiz(dto);
  }

  updateQuiz(id: string, dto: UpdateQuizDto): Promise<QuizDto> {
    return this.courseRepository.updateQuiz(id, dto);
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.findQuiz(id);
    await this.courseRepository.deleteQuiz(id);
  }

  async startQuiz(quizId: string, userId: string): Promise<QuizAttemptDto> {
    const attempt = await this.courseRepository.startQuiz(quizId, userId);

    if (!attempt) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Quiz not found or has no questions.',
      });
    }

    return attempt;
  }

  async findAttempt(id: string, userId: string): Promise<QuizAttemptDto> {
    const attempt = await this.courseRepository.findAttempt(id, userId);

    if (!attempt) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Quiz attempt not found.' });
    }

    return attempt;
  }

  async submitAnswer(dto: SubmitAnswerDto, userId: string): Promise<SubmitAnswerResultDto> {
    const result = await this.courseRepository.submitAnswer(
      dto.snapshot_id,
      userId,
      dto.student_answer,
    );

    if (!result) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Question not found.' });
    }

    return result;
  }

  async finishAttempt(id: string, userId: string): Promise<QuizAttemptDto> {
    const attempt = await this.courseRepository.finishAttempt(id, userId);

    if (!attempt) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Quiz attempt not found.' });
    }

    return attempt;
  }
}
