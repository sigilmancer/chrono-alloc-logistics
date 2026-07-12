import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { nextLink, PaginationPage } from "../shared/pagination";
import { type Page, PaginatedResponse, type Response } from "../shared/shared.types";
import { toDepotDTO } from "./depots.mapper";
import { type CreateDepot, DepotDTO } from "./depots.schemas";
import { DepotsService } from "./depots.service";

@Controller("depots")
export class DepotsController {
  constructor(private readonly service: DepotsService) {}

  /**
   * Creates a new depot
   * @param data - The depot data to create
   * @returns The created depot
   */
  @Post()
  async create(@Body() data: CreateDepot): Promise<Response<DepotDTO>> {
    return { data: toDepotDTO(await this.service.create(data)) };
  }

  /**
   * Retrieves a depot by its ID
   * @param id - The depot ID
   * @returns The depot data
   * @throws Error when depot is not found
   */
  @Get("/:id")
  async getById(@Param("id", ParseIntPipe) id: number): Promise<Response<DepotDTO>> {
    const data = await this.service.getById(id);
    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    return { data: toDepotDTO(data) };
  }

  /**
   * Retrieves a paginated list of depots
   * @param request - The HTTP request object
   * @param page - Pagination parameters
   * @returns Paginated list of depots
   */
  @Get()
  async get(
    @Req() request: Request,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<DepotDTO>> {
    const { data, nextPage } = await this.service.get({ page });

    return {
      data: data.map(toDepotDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }
}
