import { Injectable } from "@nestjs/common";
import { type Depot } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Page, PaginatedData } from "../shared/shared.types";
import { CreateDepot } from "./depots.schemas";

@Injectable()
export class DepotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDepot): Promise<Depot> {
    return await this.prisma.depot.create({ data });
  }

  async getById(id: number): Promise<Depot | null> {
    return await this.prisma.depot.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page }): Promise<PaginatedData<Depot>> {
    const { page } = parameters;
    const databaseQueryParameters = queryParameters({ page });

    const depots = await this.prisma.depot.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.depot,
    });

    return { data: depots, nextPage };
  }
}
