import { Request } from "express";
import { MAX_SHARDS } from "./constants";
import {
  getPage,
  queryParameters,
  omitShard,
  getNextPage,
  nextLink,
} from "./pagination";
import type { Page } from "./shared.types";

describe("pagination helpers", () => {
  test("getPage returns defaults when missing", () => {
    const page = getPage();
    expect(page.num).toBe(1);
    expect(page.size).toBe(10);
    expect(page.shard).toBe(0);
  });

  test("queryParameters computes skip/take/where", () => {
    const page: Page = { num: 3, size: 10, shard: 2 };
    const res = queryParameters({ page });
    expect(res.take).toBe(10);
    expect(res.skip).toBe(20);
    expect(res.where).toHaveProperty("shard", 2);
  });

  test("omitShard removes the shard property", () => {
    const item = { id: 1, name: "x", shard: 5 };
    const out = omitShard(item);
    expect((out as any).shard).toBeUndefined();
    expect(out).toMatchObject({ id: 1, name: "x" });
  });

  test("nextLink constructs URL with updated params", () => {
    const mockReq = {
      protocol: "http",
      get: (_: string) => "example.com",
      originalUrl: "/items?page=1&foo=bar",
    } as unknown as Request;

    const nl = nextLink({
      nextPage: { num: 2, size: 10, shard: 0 },
      request: mockReq,
    });

    expect(nl).toBeDefined();
    // order of query params may vary; assert presence
    expect(nl).toContain("http://example.com/items");
    expect(nl).toContain("page=2");
    expect(nl).toContain("shard=0");
  });
});

describe("getNextPage behavior", () => {
  // Helper to create a mock collection whose count returns per page/shard map
  function makeCollection(countMap: Record<string, number>) {
    return {
      count: jest.fn().mockImplementation(({ skip, take, where }) => {
        const key = `${where.shard}:${Math.floor(skip / take) + 1}`;
        return Promise.resolve(countMap[key] ?? 0);
      }),
    };
  }

  test("returns next page in same shard when items remain", async () => {
    // current page 1 -> nextPage is page 2 in same shard
    const currentPage: Page = { num: 1, size: 10, shard: 0 };
    const counts = { "0:2": 5 }; // shard 0, page 2 has 5 items
    const collection = makeCollection(counts);

    const next = await getNextPage({ currentPage, collection });
    expect(next).toEqual({ num: 2, size: 10, shard: 0 });
    expect(collection.count).toHaveBeenCalled();
  });

  test("returns first page of next shard when current shard exhausted", async () => {
    const currentPage: Page = { num: 3, size: 10, shard: 1 }; // nextPage 4 in shard 1 -> none
    const counts = {
      "1:4": 0, // no items on page 4 of shard 1
      "2:1": 7, // shard 2, page 1 has items
    };
    const collection = makeCollection(counts);

    const next = await getNextPage({ currentPage, collection });
    expect(next).toEqual({ num: 1, size: 10, shard: 2 });
  });

  test("returns undefined when no more pages and shards exhausted", async () => {
    const currentPage: Page = { num: 1, size: 10, shard: MAX_SHARDS }; // at max shard
    const counts = {
      // next page in same shard (page 2) empty and next shard would be > MAX_SHARDS
      [`${MAX_SHARDS}:2`]: 0,
    };
    const collection = makeCollection(counts);

    const next = await getNextPage({ currentPage, collection });
    expect(next).toBeUndefined();
  });
});
