import { CouriersService } from "./courier.service";

describe("CouriersService (unit)", () => {
  const mockPrisma: any = {
    courier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dispatchRun: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("create delegates to prisma.courier.create", async () => {
    const svc = new CouriersService(mockPrisma as any);
    const input = { name: "Bob" };
    const created = { id: 1, name: "Bob", shard: 0 };
    mockPrisma.courier.create.mockResolvedValue(created);

    const r = await svc.create(input as any);
    expect(mockPrisma.courier.create).toHaveBeenCalledWith({ data: input });
    expect(r).toBe(created);
  });

  test("getById returns null when not found", async () => {
    const svc = new CouriersService(mockPrisma as any);
    mockPrisma.courier.findUnique.mockResolvedValue(null);

    const r = await svc.getById(123);
    expect(mockPrisma.courier.findUnique).toHaveBeenCalledWith({ where: { id: 123 } });
    expect(r).toBeNull();
  });

  test("get returns data and asks for next page", async () => {
    const svc = new CouriersService(mockPrisma as any);
    const page = { num: 1, size: 10, shard: 0 };
    const items = [{ id: 1, name: "A", shard: 0 }];
    mockPrisma.courier.findMany.mockResolvedValue(items);
    // Ensure count returns > 0 for next page check
    mockPrisma.courier.count.mockResolvedValue(5);

    const r = await svc.get({ page } as any);
    expect(mockPrisma.courier.findMany).toHaveBeenCalled();
    expect(r.data).toEqual(items);
    // nextPage should be defined because count > 0
    expect(r.nextPage).toBeDefined();
  });

  test("getClaims filters by courierId and returns dispatch runs", async () => {
    const svc = new CouriersService(mockPrisma as any);
    const page = { num: 1, size: 10, shard: 0 };
    const runs = [{ id: 10, courierId: 42, shard: 0 }];
    mockPrisma.dispatchRun.findMany.mockResolvedValue(runs);
    mockPrisma.dispatchRun.count.mockResolvedValue(0);

    const r = await svc.getClaims({ id: 42, page } as any);
    expect(mockPrisma.dispatchRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ courierId: 42 }) }),
    );
    expect(r.data).toEqual(runs);
  });
});
