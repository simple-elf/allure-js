import { expect, it } from "vitest";
import { Stage, Status } from "allure-js-commons";
import { runPlaywrightInlineTest } from "../utils.js";

it("reports test steps", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "a.test.js": `
      import { test, expect } from '@playwright/test';

      test('should pass', async ({}) => {
        await test.step('outer step 1', async () => {
          await test.step('inner step 1.1', async () => {
          });
          await test.step('inner step 1.2', async () => {
          });
        });
        await test.step('outer step 2', async () => {
          await test.step('inner step 2.1', async () => {
          });
          await test.step('inner step 2.2', async () => {
          });
        });
      });
    `,
    "playwright.config.js": `
       module.exports = {
         reporter: [
           [
             require.resolve("allure-playwright"),
             {
               resultsDir: "./allure-results",
               detail: false,
             },
           ],
           ["dot"],
         ],
         projects: [
           {
             name: "project",
           },
         ],
       };
    `,
  });

  expect(tests).toHaveLength(1);
  expect(tests).toEqual([
    expect.objectContaining({
      name: "should pass",
      status: Status.PASSED,
      stage: Stage.FINISHED,
      steps: [
        expect.objectContaining({
          name: "outer step 1",
          status: Status.PASSED,
          stage: Stage.FINISHED,
          steps: [
            expect.objectContaining({ name: "inner step 1.1", status: Status.PASSED, stage: Stage.FINISHED }),
            expect.objectContaining({ name: "inner step 1.2", status: Status.PASSED, stage: Stage.FINISHED }),
          ],
        }),
        expect.objectContaining({
          name: "outer step 2",
          status: Status.PASSED,
          stage: Stage.FINISHED,
          steps: [
            expect.objectContaining({ name: "inner step 2.1", status: Status.PASSED, stage: Stage.FINISHED }),
            expect.objectContaining({ name: "inner step 2.2", status: Status.PASSED, stage: Stage.FINISHED }),
          ],
        }),
      ],
    }),
  ]);
});

it("reports failed test steps", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "a.test.ts": `
      import { test, expect } from '@playwright/test';

      test('should pass', async ({}) => {
        await test.step('outer step 1', async () => {
          await test.step('inner step 1.1', async () => {
          });
          await test.step('inner step 1.2', async () => {
          });
        });
        await test.step('outer step 2', async () => {
          await test.step('inner step 2.1', async () => {
            expect(true).toBe(false);
          });
          await test.step('inner step 2.2', async () => {
          });
        });
      });
    `,
    "playwright.config.js": `
       module.exports = {
         reporter: [
           [
             require.resolve("allure-playwright"),
             {
               resultsDir: "./allure-results",
               detail: false,
             },
           ],
           ["dot"],
         ],
         projects: [
           {
             name: "project",
           },
         ],
       };
    `,
  });

  expect(tests).toHaveLength(1);
  expect(tests).toEqual([
    expect.objectContaining({
      name: "should pass",
      status: Status.FAILED,
      stage: Stage.FINISHED,
      steps: [
        expect.objectContaining({
          name: "outer step 1",
          status: Status.PASSED,
          stage: Stage.FINISHED,
          steps: [
            expect.objectContaining({ name: "inner step 1.1", status: Status.PASSED, stage: Stage.FINISHED }),
            expect.objectContaining({ name: "inner step 1.2", status: Status.PASSED, stage: Stage.FINISHED }),
          ],
        }),
        expect.objectContaining({
          name: "outer step 2",
          status: Status.FAILED,
          stage: Stage.FINISHED,
          steps: [
            expect.objectContaining({
              name: "inner step 2.1",
              status: Status.FAILED,
              stage: Stage.FINISHED,
              statusDetails: expect.objectContaining({
                message: expect.stringContaining("expect(received).toBe(expected)"),
                trace: expect.any(String),
              }),
            }),
          ],
        }),
      ],
    }),
  ]);
});

it("should support steps with names longer then 50 chars", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "a.test.js": `
      import { test, expect } from '@playwright/test';

      test('a test', async ({}) => {
        await test.step('Check email input field and submit button on password recovery window', async () => {
        });
      });
    `,
    "playwright.config.js": `
       module.exports = {
         reporter: [
           [
             require.resolve("allure-playwright"),
             {
               resultsDir: "./allure-results",
               detail: false,
             },
           ],
           ["dot"],
         ],
         projects: [
           {
             name: "project",
           },
         ],
       };
    `,
  });

  expect(tests).toHaveLength(1);
  expect(tests).toEqual([
    expect.objectContaining({
      name: "a test",
      status: Status.PASSED,
      steps: [
        expect.objectContaining({
          name: "Check email input field and submit button on password recovery window",
          status: Status.PASSED,
        }),
      ],
    }),
  ]);
});

it("should ignore route.continue() steps", async () => {
  const { tests } = await runPlaywrightInlineTest({
    "a.test.js": `
      import { test, expect } from '@playwright/test';

      test('a test', async ({ page }) => {
        await page.route('**/*', (route) => {
          route.continue();
        });
        await page.goto("https://allurereport.org");
      });
    `,
  });

  expect(tests).toHaveLength(1);
  const [tr] = tests;
  expect(tr.steps).not.toContainEqual(
    expect.objectContaining({
      name: "route.continue()",
    }),
  );
});

it("should attach attachments to correct steps in hooks and test steps", async () => {
  const { tests, attachments } = await runPlaywrightInlineTest({
    "a.test.js": `
      import { test, expect } from '@playwright/test';
      import { attachment } from 'allure-js-commons';

      const example = async (some) => {
        await test.info().attach("test", { body: some });
      };

      test.describe("Scratch", () => {
        test.beforeAll(async () => {
          await example("test1");
        });
        test.beforeEach(async () => {
          await example("test2");
        });
        test("testName", async () => {
          await test.step("test3", async () => {
            await example("test3");
          });
          await test.step("test4", async () => {
            await example("test4");
          });
        });
        test.afterAll(async () => {
          await example("test5");
        });
        test.afterEach(async () => {
          await example("test6");
        });
      });
    `,
  });

  expect(tests).toHaveLength(1);
  const [testResult] = tests;

  expect(testResult.steps).toHaveLength(4);
  const beforeHooksStep = testResult.steps[0];
  expect(beforeHooksStep.name).toBe("Before Hooks");
  expect(beforeHooksStep.steps).toHaveLength(2);

  const beforeAllStep = beforeHooksStep.steps[0];
  expect(beforeAllStep.name).toBe("beforeAll hook");
  expect(beforeAllStep.steps).toHaveLength(1);

  const beforeAllAttachmentStep = beforeAllStep.steps[0];
  expect(beforeAllAttachmentStep.name).toBe("test");
  expect(beforeAllAttachmentStep.attachments).toHaveLength(1);
  expect(beforeAllAttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const beforeEachStep = beforeHooksStep.steps[1];
  expect(beforeEachStep.name).toBe("beforeEach hook");
  expect(beforeEachStep.steps).toHaveLength(1);

  const beforeEachAttachmentStep = beforeEachStep.steps[0];
  expect(beforeEachAttachmentStep.name).toBe("test");
  expect(beforeEachAttachmentStep.attachments).toHaveLength(1);
  expect(beforeEachAttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const test3Step = testResult.steps[1];
  expect(test3Step.name).toBe("test3");
  expect(test3Step.steps).toHaveLength(1);

  const test3AttachmentStep = test3Step.steps[0];
  expect(test3AttachmentStep.name).toBe("test");
  expect(test3AttachmentStep.attachments).toHaveLength(1);
  expect(test3AttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const test4Step = testResult.steps[2];
  expect(test4Step.name).toBe("test4");
  expect(test4Step.steps).toHaveLength(1);

  const test4AttachmentStep = test4Step.steps[0];
  expect(test4AttachmentStep.name).toBe("test");
  expect(test4AttachmentStep.attachments).toHaveLength(1);
  expect(test4AttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const afterHooksStep = testResult.steps[3];
  expect(afterHooksStep.name).toBe("After Hooks");
  expect(afterHooksStep.steps).toHaveLength(2);

  const afterEachStep = afterHooksStep.steps[0];
  expect(afterEachStep.name).toBe("afterEach hook");
  expect(afterEachStep.steps).toHaveLength(1);

  const afterEachAttachmentStep = afterEachStep.steps[0];
  expect(afterEachAttachmentStep.name).toBe("test");
  expect(afterEachAttachmentStep.attachments).toHaveLength(1);
  expect(afterEachAttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const afterAllStep = afterHooksStep.steps[1];
  expect(afterAllStep.name).toBe("afterAll hook");
  expect(afterAllStep.steps).toHaveLength(1);

  const afterAllAttachmentStep = afterAllStep.steps[0];
  expect(afterAllAttachmentStep.name).toBe("test");
  expect(afterAllAttachmentStep.attachments).toHaveLength(1);
  expect(afterAllAttachmentStep.attachments[0]).toEqual(
    expect.objectContaining({
      name: "test",
      type: "text/plain",
    }),
  );

  const [attachment3] = tests[0].steps[1].steps[0].steps[0].attachments;
  const [attachment4] = tests[0].steps[2].steps[1].steps[0].attachments;

  expect(attachments).toHaveProperty(attachment3.source);
  expect(attachments).toHaveProperty(attachment4.source);
  expect(Buffer.from(attachments[attachment3.source] as string, "base64").toString()).toEqual("test3");
  expect(Buffer.from(attachments[attachment4.source] as string, "base64").toString()).toEqual("test4");
});
