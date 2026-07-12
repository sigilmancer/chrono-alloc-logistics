import {
  BadRequestException,
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
import { getPage, nextLink } from "../shared/pagination";
import { PaginatedResponse, type Response } from "../shared/shared.types";
import { toDispatchRunDTO } from "./dispatchRuns.mapper";
import {
  type CreateDispatchRun,
  createDispatchRunSchema,
  GetShiftsQuery,
  getShiftsQuerySchema,
  DispatchRunDTO,
} from "./dispatchRuns.schemas";
import { DispatchRunService } from "./dispatchRuns.service";

@Controller("dispatchRuns")
export class DispatchRunsController {
  constructor(private readonly service: DispatchRunService) {}

  /**
   * Creates a new dispatchRun
   * @param data - The dispatchRun data to create
   * @returns The created dispatchRun
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createDispatchRunSchema))
  async create(@Body() data: CreateDispatchRun): Promise<Response<DispatchRunDTO>> {
    return { data: toDispatchRunDTO(await this.service.create(data)) };
  }

  /**
   * API endpoint for frontend to get what's available to claim, esp those that just became Urgent.
   * @returns 
   */
  @Get("/marketplace")
  async getMarketplace(@Query("shard", ParseIntPipe) shard:number): Promise<Response<DispatchRunDTO[]>> {
    const data = await this.service.getMarketplace(shard);

    return { data: data.map(toDispatchRunDTO) };
  }

  /**
   * Retrieves a dispatchRun by its ID
   * @param id - The dispatchRun ID
   * @returns The dispatchRun data
   * @throws Error when dispatchRun is not found
   */
  @Get("/:id")
  async getById(@Param("id", ParseIntPipe) id: number,
@Query("shard", ParseIntPipe) shard:number,): Promise<Response<DispatchRunDTO>> {
    const data = await this.service.getByIdAndShard(id, shard);
    if (!data) {
      throw new Error(`ID ${id} not found in shard ${shard}.`);
    }

    return { data: toDispatchRunDTO(data) };
  }

  /**
   * Retrieves a paginated list of dispatchRuns with optional filtering.
   * @param request - The HTTP request object
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of dispatchRuns
   */
  @Get()
  @UsePipes(new ZodValidationPipe(getShiftsQuerySchema))
  async get(
    @Req() request: Request,
    @Query() query: GetShiftsQuery,
  ): Promise<PaginatedResponse<DispatchRunDTO>> {
    const page = getPage(query.page, query.shard);
    const filters = { courierId: query.courierId, jobType: query.jobType, location: query.location };
    const { data, nextPage } = await this.service.get({ page, filters });

    return {
      data: data.map(toDispatchRunDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }

    /**
   * Claims a dispatchRun for a courier
   * @param id - The dispatchRun ID to claim
   * @param courierId - The courier ID claiming the dispatchRun
   * @returns The updated dispatchRun data
   */
  @Post("/:id/claim")
  async claim(
    @Param("id", ParseIntPipe) id: number,
    @Body("courierId", ParseIntPipe) courierId: number,
  ): Promise<Response<DispatchRunDTO>> {
    return { data: toDispatchRunDTO(await this.service.claim(id, courierId)) };
  }

  /**
   * Claims an urgent dispatchRun from the marketplace (New Feature Route)
   * Enforces multi-tenant shard validation, fraud checks, and concurrency guards
   */
@Post(':id/claim-urgent')
async claimUrgent(
  @Param('id') id: string, 
  @Body('courierId') courierId: number, 
  @Body('shard') shard: number
) {
  //  FIXED: Return and await guarantee the runtime exception halts the request!
  return await this.service.claimUrgent(Number(id), courierId, shard);
}

  /**
   * Cancels a claimed dispatchRun
   * @param id - The dispatchRun ID to cancel
   * @returns The updated dispatchRun data
   * @throws Error when dispatchRun is not found or not claimed
   */
  @Post("/:id/cancel")
  async cancel(@Param("id", ParseIntPipe) id: number, @Body() body: {shard:number}): Promise<Response<DispatchRunDTO>> {
    const data = await this.service.getByIdAndShard(id, body.shard);

    if (!data) {
      throw new Error(`ID ${id} not found in shard ${body.shard}`);
    }

    if (!data.courierId) {
      throw new Error(`DispatchRun ${id} is not claimed.`);
    }

    return { data: toDispatchRunDTO(await this.service.cancel(id, data.courierId, body.shard)) };
  }
}
