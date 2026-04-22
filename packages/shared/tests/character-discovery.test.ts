import { describe, expect, it } from "vitest";
import { deriveCharactersFromText } from "../src/character-discovery";

describe("deriveCharactersFromText", () => {
  it("extracts repeated proper-name characters from plain text", () => {
    const characters = deriveCharactersFromText(`
Alice walked into the room.
Bob waved at Alice.
Alice said hello to Bob.
The Mad Hatter interrupted Alice.
The Mad Hatter laughed.
`);

    expect(characters).toEqual([
      {
        name: "Alice",
        description: "Alice appears 4 times in the source text.",
        aliases: [],
        sampleLineCount: 4,
      },
      {
        name: "Bob",
        description: "Bob appears 2 times in the source text.",
        aliases: [],
        sampleLineCount: 2,
      },
      {
        name: "Mad Hatter",
        description: "Mad Hatter appears 2 times in the source text.",
        aliases: ["Hatter"],
        sampleLineCount: 2,
      },
    ]);
  });

  it("ignores common capitalized non-character words and one-off mentions", () => {
    const characters = deriveCharactersFromText(`
Chapter One opened on Monday.
London was cold.
Mary met Mary again.
Tuesday arrived.
`);

    expect(characters).toEqual([
      {
        name: "Mary",
        description: "Mary appears 2 times in the source text.",
        aliases: [],
        sampleLineCount: 2,
      },
    ]);
  });
});
