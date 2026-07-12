import { Injectable } from "@nestjs/common";
import { DispatchRun, type Courier } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Page, PaginatedData } from "../shared/shared.types";
import { CreateCourier } from "./courier.schemas";

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCourier): Promise<Courier> {
    return await this.prisma.courier.create({ data });
  }

  async getById(id: number): Promise<Courier | null> {
    return await this.prisma.courier.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page }): Promise<PaginatedData<Courier>> {
    const { page } = parameters;
    const databaseQueryParameters = queryParameters({ page });

    const couriers = await this.prisma.courier.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.courier,
    });

    return { data: couriers, nextPage };
  }

  async getClaims(parameters: { id: number; page: Page }): Promise<PaginatedData<DispatchRun>> {
    const { page } = parameters;

    const { where, ...queryParams } = queryParameters({ page });

    const claims = await this.prisma.dispatchRun.findMany({
      ...queryParams,
      where: { ...where, courierId: parameters.id },
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.dispatchRun,
    });

    return { data: claims, nextPage };
  }
}
