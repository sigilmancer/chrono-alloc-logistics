import { toCourierDTO } from "./courier.mapper";

describe("toCourierDTO", () => {
  test("omits shard from courier object", () => {
    const courier = {
      id: 123,
      name: "Alice",
      status: 0,
      createdAt: new Date(),
      shard: 7,
    } as any;

    const dto = toCourierDTO(courier);
    expect((dto as any).shard).toBeUndefined();
    expect(dto).toMatchObject({
      id: 123,
      name: "Alice",
      status: 0,
    });
  });
});
