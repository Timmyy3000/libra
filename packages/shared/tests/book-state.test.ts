import { describe, expect, it } from "vitest";
import { buildBookStateSummaries } from "../src/book-state";

describe("buildBookStateSummaries", () => {
  it("attaches the latest workflow job to each book", () => {
    const summaries = buildBookStateSummaries({
      books: [
        {
          _id: "book_1",
          _creationTime: 100,
          title: "A Christmas Carol",
          author: "Charles Dickens",
          status: "uploaded",
          sourceFileType: "epub",
          characterCount: 0,
        },
      ],
      jobs: [
        {
          _id: "job_old",
          _creationTime: 110,
          entityId: "book_1",
          jobType: "discover_characters",
          status: "queued",
          step: "queued_for_discovery",
          progressCurrent: 0,
          progressTotal: 3,
        },
        {
          _id: "job_new",
          _creationTime: 120,
          entityId: "book_1",
          jobType: "discover_characters",
          status: "running",
          step: "extracting_text",
          progressCurrent: 1,
          progressTotal: 3,
        },
      ],
    });

    expect(summaries).toEqual([
      {
        id: "book_1",
        title: "A Christmas Carol",
        author: "Charles Dickens",
        status: "uploaded",
        sourceFileType: "epub",
        characterCount: 0,
        currentJob: {
          id: "job_new",
          jobType: "discover_characters",
          status: "running",
          step: "extracting_text",
          progressCurrent: 1,
          progressTotal: 3,
        },
      },
    ]);
  });

  it("returns books without a current job when none exist", () => {
    const summaries = buildBookStateSummaries({
      books: [
        {
          _id: "book_2",
          _creationTime: 200,
          title: "Dracula",
          author: "Bram Stoker",
          status: "characters_ready",
          sourceFileType: "pdf",
          characterCount: 12,
        },
      ],
      jobs: [],
    });

    expect(summaries).toEqual([
      {
        id: "book_2",
        title: "Dracula",
        author: "Bram Stoker",
        status: "characters_ready",
        sourceFileType: "pdf",
        characterCount: 12,
      },
    ]);
  });
});
