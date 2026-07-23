import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, toCsv } from "@/lib/utils/csv";

test("CSV escaping quotes values and neutralizes formulas", () => {
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("+SUM(A1:A2)"), '"\'+SUM(A1:A2)"');
});

test("CSV output has deterministic headers and CRLF", () => {
  const output = toCsv([{ Name: "Alex", Count: 1 }, { Name: "Sam", Count: 2 }]);
  assert(output.startsWith('"Name","Count"\r\n'));
  assert(output.endsWith("\r\n"));
});
