import { Injectable, BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, type DispatchRun } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Filters, Page, PaginatedData } from "../shared/shared.types";
import { CreateDispatchRun } from "./dispatchRuns.schemas";

@Injectable()
export class DispatchRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDispatchRun): Promise<DispatchRun> {
    return await this.prisma.dispatchRun.create({
      data: data as Prisma.DispatchRunUncheckedCreateInput,
    });
  }

  /** Fetches a dispatchRun directly using both ID and Shard to prevent cluster-wide scans
   */
  async getByIdAndShard(id:number, shard:number): Promise<DispatchRun | null>{
    //use of findFirst because a composite cluster lookup requires filtering on non-unique shards
    return await this.prisma.dispatchRun.findFirst({
      where:{id, shard},
    });
  }

  //legacy fallback for internal framework calls
  async getById(id: number): Promise<DispatchRun | null> {
    return await this.prisma.dispatchRun.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page; filters: Filters }): Promise<PaginatedData<DispatchRun>> {
    const { page, filters } = parameters;

    const whereFilter = this.buildWhereFilter(filters);
    const databaseQueryParameters = queryParameters({ page, whereFilter });

    const dispatchRun = await this.prisma.dispatchRun.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.dispatchRun,
      whereFilter,
    });

    return { data: dispatchRun, nextPage };
  }

    async claim(id: number, courierId: number): Promise<DispatchRun> {
    return await this.prisma.dispatchRun.update({
      where: {
        id,
        courierId: null,
      },
      data: { courierId, cancelledAt: null },
    });
  }

  async claimUrgent(id: number, courierId: number, shard: number): Promise<DispatchRun> {
    //shard security guard: fetch courier to prevent cross-partition contamination
    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) throw new NotFoundException("Worker profile not found.");
    if (courier.shard !== shard) {
      throw new BadRequestException(`Shard mismatch. Worker is assigned to Shard ${courier.shard}.`);
    }

    try {
      return await this.prisma.dispatchRun.update({
        where: {
          id,
          shard,
          courierId: null,             //atomic race-condition guard
          isUrgent: true,             //ensures it is a true premium dispatchRun
          previousCourierId: { not: courierId } //anti-exploit rule
        },
        data: { courierId, cancelledAt: null }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        const dispatchRun = await this.getByIdAndShard(id, shard);
        if (!dispatchRun) throw new NotFoundException("DispatchRun not found.");
        if (dispatchRun.courierId !== null) throw new ConflictException("This dispatchRun has already been claimed.");
        if (dispatchRun.previousCourierId === courierId) {
          throw new BadRequestException("You cannot re-claim a dispatchRun you recently cancelled.");
        }
        if (!dispatchRun.isUrgent) throw new BadRequestException("This dispatchRun is not an urgent market dispatchRun.");
      }
      throw error;
    }
  }

  async cancel(id: number, courierId: number, shard: number): Promise<DispatchRun> {
    //fetch the target dispatchRun to inspect the start time
    const dispatchRun = await this.getByIdAndShard(id, shard);
    if (!dispatchRun) throw new NotFoundException("DispatchRun not found");

    const now = new Date();
    const timeDifferenceInMs = dispatchRun.startAt.getTime() - now.getTime();
    const minutesUntilShift = timeDifferenceInMs / (1000 * 60);

    //check if the cancellation falls inside the 30-minute urgency window
    const isInsideUrgencyWindow = minutesUntilShift <= 30 && minutesUntilShift > 0;

    try{
        return await this.prisma.dispatchRun.update({
          where: {
            id,
            shard,
            //courierId: { not: null },
            courierId,
          },
          data: {
            cancelledAt: now,
            courierId: null,
            //only elevate parameters if it is a true last-minute emergency
            previousCourierId: courierId,
            hourlyRate: isInsideUrgencyWindow ? 2600 : 1300,
            isUrgent: isInsideUrgencyWindow,
            },
          });
    }
    catch(error){
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      {
        throw new ConflictException("This cancellation has already been processed");
      }
      throw error;
    } 
  }

  private buildWhereFilter(filters: Filters): Prisma.DispatchRunWhereInput {
    const where: Prisma.DispatchRunWhereInput = {};

    //injects explicit shard isolation directly into generic grid filtering protocols
    if (typeof filters.shard === "number") {
      where.shard = filters.shard;
    }

    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    if (filters.location) {
      where.depot = { location: filters.location };
    }

    if (filters.courierId === null) {
      where.courierId = null;
    } else if (typeof filters.courierId === "number") {
      where.courierId = filters.courierId;
    }

    return where;
  }

  /**
   * Find dispatchRuns that have a courierId, have startAt in about 30mins time, reminderStatus is the default PENDING.
   * @returns 
   */
  async getDispatchRunForReminder(targetShard: number): Promise<DispatchRun[]>{
    const now = new Date();
    const in30mins = new Date(now.getTime() + 30 * 60 * 1000);
    return await this.prisma.dispatchRun.findMany({
      where:{
        shard: targetShard,
        courierId: {not: null},
        reminderStatus: "PENDING",
        startAt: {
         // gte: now.toISOString(), //greater than or equal to now
          lte: in30mins, //  //fetch everything less than or equal to the 30-minute threshold
        }, 
      },
      orderBy: { startAt: 'asc'}, //process the most imminent dispatchRuns first
      take: 100, //safe cursor batching limit to protect server memory bounds
    });
  }

  async updateReminderStatus(id: number, status: string, shard: number): Promise<DispatchRun> {
    return await this.prisma.dispatchRun.update({
      where: { id, shard },
      data: { reminderStatus: status},
    });
  }

    /**
   * Missing Marketplace Endpoint
   * Resolves available open unassigned dispatchRuns matching the requested shard target.
   */
  async getMarketplace(shard:number): Promise<DispatchRun[]> {
    return await this.prisma.dispatchRun.findMany({
      where:{
        shard,
        isUrgent:true,
        courierId:null, //ensure dispatchRun is actively open
      },
      orderBy: {startAt: "asc"},
      take: 50, //keeps it efficient and safe
    });
  }
}
