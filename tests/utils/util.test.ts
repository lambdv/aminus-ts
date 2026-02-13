import { assertEquals } from "@/utils/util";
import { StatTable } from "@/core/stat";

class TestObj {
  value: number;
  constructor(v: number) {
    this.value = v;
  }
  equals(other: any): boolean {
    return other instanceof TestObj && this.value === other.value;
  }
}

describe("assertEquals", () => {
  it("passes for equal numbers", () => {
    expect(() => assertEquals(1, 1)).not.toThrow();
  });

  it("throws for unequal numbers", () => {
    expect(() => assertEquals(1, 2)).toThrow(
      "Expected 1 (number) but was 2 (number)",
    );
  });

  it("passes for equal strings", () => {
    expect(() => assertEquals("hello", "hello")).not.toThrow();
  });

  it("throws for unequal strings", () => {
    expect(() => assertEquals("hello", "world")).toThrow(
      "Expected hello (string) but was world (string)",
    );
  });

  it("passes for same object reference", () => {
    const obj = { a: 1 };
    expect(() => assertEquals(obj, obj)).not.toThrow();
  });

  it("throws for different object references", () => {
    expect(() => assertEquals({ a: 1 }, { a: 1 })).toThrow();
  });

  it("passes for null", () => {
    expect(() => assertEquals(null, null)).not.toThrow();
  });

  it("throws for null vs undefined", () => {
    expect(() => assertEquals(null, undefined)).toThrow(
      "Expected null (object) but was undefined (undefined)",
    );
  });

  it("passes for undefined", () => {
    expect(() => assertEquals(undefined, undefined)).not.toThrow();
  });

  it("throws for different types", () => {
    expect(() => assertEquals(1, "1")).toThrow(
      "Expected 1 (number) but was 1 (string)",
    );
  });

  it("passes for custom objects with equals method returning true", () => {
    const obj1 = new TestObj(5);
    const obj2 = new TestObj(5);
    expect(() => assertEquals(obj1, obj2)).not.toThrow();
  });

  it("throws for custom objects with equals method returning false", () => {
    const obj1 = new TestObj(5);
    const obj2 = new TestObj(6);
    expect(() => assertEquals(obj1, obj2)).toThrow();
  });

  it("throws for StatTable instances (no equals method)", () => {
    const st1 = new StatTable();
    const st2 = new StatTable();
    expect(() => assertEquals(st1, st2)).toThrow();
  });

  it("passes for same StatTable reference", () => {
    const st = new StatTable();
    expect(() => assertEquals(st, st)).not.toThrow();
  });

  it("passes for arrays with same reference", () => {
    const arr = [1, 2, 3];
    expect(() => assertEquals(arr, arr)).not.toThrow();
  });

  it("throws for different arrays", () => {
    expect(() => assertEquals([1, 2], [1, 2])).toThrow();
  });

  it("passes for boolean true", () => {
    expect(() => assertEquals(true, true)).not.toThrow();
  });

  it("throws for boolean true vs false", () => {
    expect(() => assertEquals(true, false)).toThrow(
      "Expected true (boolean) but was false (boolean)",
    );
  });
});
