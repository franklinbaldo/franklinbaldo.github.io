import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recentBooks, type GoodreadsBook } from "../goodreads.ts";

// recentBooks is the only pure export of goodreads.ts -- fetchGoodreadsBooks
// itself does a live network fetch and is out of scope for a unit test.
// A regression in the sort/limit here shows up as the "recently read" widget
// on the homepage silently showing stale or wrongly-ordered books.

function book(overrides: Partial<GoodreadsBook> = {}): GoodreadsBook {
  return {
    title: "A Book",
    link: "https://goodreads.com/book",
    author_name: "An Author",
    book_image_url: "https://example.com/cover.jpg",
    user_rating: 5,
    user_read_at: "2024/01/01",
    book_published: "2020",
    ...overrides,
  };
}

describe("recentBooks", () => {
  it("sorts by user_read_at descending (most recent first)", () => {
    const books = [
      book({ title: "Oldest", user_read_at: "2022/01/01" }),
      book({ title: "Newest", user_read_at: "2024/06/15" }),
      book({ title: "Middle", user_read_at: "2023/03/10" }),
    ];
    const result = recentBooks(books, 10);
    assert.deepEqual(
      result.map((b) => b.title),
      ["Newest", "Middle", "Oldest"]
    );
  });

  it("defaults to the 3 most recent books", () => {
    const books = [1, 2, 3, 4, 5].map((i) =>
      book({ title: `Book ${i}`, user_read_at: `2024/01/0${i}` })
    );
    const result = recentBooks(books);
    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((b) => b.title),
      ["Book 5", "Book 4", "Book 3"]
    );
  });

  it("respects a custom limit n", () => {
    const books = [1, 2, 3].map((i) =>
      book({ title: `Book ${i}`, user_read_at: `2024/01/0${i}` })
    );
    assert.equal(recentBooks(books, 1).length, 1);
    assert.equal(recentBooks(books, 100).length, 3);
  });

  it("sorts books with a missing user_read_at to the end", () => {
    const books = [
      book({ title: "Undated", user_read_at: "" }),
      book({ title: "Dated", user_read_at: "2024/01/01" }),
    ];
    const result = recentBooks(books, 10);
    assert.deepEqual(
      result.map((b) => b.title),
      ["Dated", "Undated"]
    );
  });

  it("does not mutate the input array", () => {
    const books = [
      book({ title: "A", user_read_at: "2022/01/01" }),
      book({ title: "B", user_read_at: "2024/01/01" }),
    ];
    const originalOrder = books.map((b) => b.title);
    recentBooks(books, 10);
    assert.deepEqual(
      books.map((b) => b.title),
      originalOrder,
      "recentBooks must not reorder its input in place"
    );
  });

  it("returns an empty array for an empty input", () => {
    assert.deepEqual(recentBooks([], 3), []);
  });
});
