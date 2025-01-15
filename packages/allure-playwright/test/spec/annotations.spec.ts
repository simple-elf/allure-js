import { expect, it } from "vitest";
import { LabelName } from "allure-js-commons";
import { runPlaywrightInlineTest } from "../utils.js";

it("should support skip annotation", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "sample.test.js": `
      import { test } from '@playwright/test';

      test('test full report', {
        annotation: {
          type: "skip",
          description: "skipped via skip annotation",
        },
      }, async () => {
      });
      `,
  });

  expect(tests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "test full report",
        status: "skipped",
        statusDetails: expect.objectContaining({
          message: "skipped via skip annotation",
        }),
      }),
    ]),
  );
});

it("should support fixme annotation", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "sample.test.js": `
      import { test } from '@playwright/test';

      test('test full report', {
        annotation: {
          type: "fixme",
          description: "skipped via fixme annotation",
        },
      }, async () => {
      });
      `,
  });

  expect(tests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "test full report",
        status: "skipped",
        statusDetails: expect.objectContaining({
          message: "skipped via fixme annotation",
        }),
      }),
    ]),
  );
});

it("should support allure metadata in playwright annotation", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "sample.test.js": `
      import { test } from '@playwright/test';
      import { LabelName } from 'allure-js-commons';

      test('test full report', {
        annotation: [
          { type: "fixme", description: "skipped via fixme annotation"},
          { type: "skip", description: "skipped via skip annotation"},
          { type: LabelName.ALLURE_ID, description: "12345"},
          { type: LabelName.EPIC, description: "Smoke"},

        ],
      }, async () => {
      });
      `,
  });

  expect(tests).toHaveLength(1);
  expect(tests[0].labels).not.toContainEqual({ name: "fixme", value: "skipped via fixme annotation" });
  expect(tests[0].labels).not.toContainEqual({ name: "skip", value: "skipped via skip annotation" });
  expect(tests[0].labels).toContainEqual({ name: LabelName.ALLURE_ID, value: "12345" });
  expect(tests[0].labels).toContainEqual({ name: LabelName.EPIC, value: "Smoke" });
  // TODO add all labels from labels.spec.ts

  // TODO add label on test.describe level, like suites tags

});
