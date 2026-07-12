import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UsePipes,
} from "@nestjs/common";
import { Request } from "express";

import { ZodValidationPipe } from "../../pipes/zod-validation-pipe";
import { nextLink, PaginationPage } from "../shared/pagination";
import { type Page, PaginatedResponse, type Response } from "../shared/shared.types";
import { toDispatchRunDTO } from "../dispatchRuns/dispatchRuns.mapper";
import { DispatchRunDTO } from "../dispatchRuns/dispatchRuns.schemas";
import { toCourierDTO } from "./courier.mapper";
import { type CreateCourier, createCourierSchema, CourierDTO } from "./courier.schemas";
import { CouriersService } from "./courier.service";

@Controller("couriers")
export class CouriersController {
  constructor(private readonly service: CouriersService) {}

  /**
   * Creates a new courier
   * @param data - The courier data to create
   * @returns The created courier
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createCourierSchema))
  async create(@Body() data: CreateCourier): Promise<Response<CourierDTO>> {
    return { data: toCourierDTO(await this.service.create(data)) };
  }

  /**
   * Retrieves paginated list of dispatchRuns claimed by a courier
   * @param request - The HTTP request object
   * @param id - The courier ID
   * @param page - Pagination parameters
   * @returns Paginated list of claimed dispatchRuns
   */
  @Get("/claims")
  async getClaims(
    @Req() request: Request,
    @Query("courierId", ParseIntPipe) id: number,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<DispatchRunDTO>> {
    const { data, nextPage } = await this.service.getClaims({ id, page });

    return {
      data: data.map(toDispatchRunDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }

  /**
   * Retrieves a courier by their ID
   * @param id - The courier ID
   * @returns The courier data
   * @throws Error when courier is not found
   */
  @Get("/:id")
  async getById(@Param("id", ParseIntPipe) id: number): Promise<Response<CourierDTO>> {
    const data = await this.service.getById(id);
    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    return { data: toCourierDTO(data) };
  }

  /**
   * Retrieves a paginated list of couriers
   * @param request - The HTTP request object
   * @param page - Pagination parameters
   * @returns Paginated list of couriers
   */
  @Get()
  async get(
    @Req() request: Request,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<CourierDTO>> {
    const { data, nextPage } = await this.service.get({ page });

    return {
      data: data.map(toCourierDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }
}
