/*
 * This file is part of a Körber Pharma Software GmbH project.
 *
 * Copyright (c)
 *    Körber Pharma Software GmbH
 *    All rights reserved.
 *
 * This source file may be managed in different Java package structures,
 * depending on actual usage of the source file by the Copyright holders:
 *
 * for Werum:  com.werum.* or any other Körber Pharma Software owned Internet domain
 *
 * Any use of this file as part of a software system by none Copyright holders
 * is subject to license terms.
 */

import { BASE_URL_ORDER_EXECUTION, BASE_URL_ORDER_REVIEW_ACTUAL_VALUE_HISTORY } from '../utils/baseURLs';
import { pageFixture } from '../utils/pageFixture';

import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

When(
  'Order execution is opened and {string} is displayed',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (id: string) {
    await pageFixture.page.goto(
      BASE_URL_ORDER_EXECUTION +
        '/orders/VT000132/BO1?filter=executable&containerKey=VT000132%23BO1&stepKey=01JBH7H2B4FWGTJ7DF3Q4CYDRG',
    );

    const cbfItem = await pageFixture.page.waitForSelector('.list-item');
    await cbfItem.click();
  },
);

Then('the {string} is executed', async (activityName: string) => {
  const actvityWrapper = pageFixture.page.locator('.activity-wrapper').nth(0);
  const actName = actvityWrapper.locator('.basic-function-step__title-text');
  expect(await actName.textContent()).toBe(activityName);
  const activityExecuted = actvityWrapper.locator('.activity-summary');
  await expect(activityExecuted).toBeVisible();
});

Then('the actual value of {string} is {string}', async function (_, value) {
  const actualValue = pageFixture.page.locator('#summary-actual-value');
  expect(await actualValue.textContent()).toContain(value);
});

Then(
  'the status of {string} is blocked',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (activityId: string) {
    const status = pageFixture.page.locator('.list-item__content--FORMULA_BLOCKED');
    await expect(status).toBeVisible();
  },
);

Then('the exception of {string} is {string}', async function (_, exceptionType: string) {
  const exception = pageFixture.page.locator('.exception__type');
  expect(await exception.textContent()).toBe(exceptionType);
});

Then(
  'the exception is documented in the value history of {string}',

  async function (activityId: string) {
    const instanceKey = pageFixture.page.url().match(/[?&]stepKey=([^&]+)/)?.[1];
    const menu = pageFixture.page.locator('.menu-container__btn').nth(3);
    await menu.click();
    // simulate clicking on the value history as the actual click is not redirecting to the value history
    await pageFixture.page.goto(`${BASE_URL_ORDER_REVIEW_ACTUAL_VALUE_HISTORY}/execution/${instanceKey}/${activityId}`);
    //    );
  },
);

Then(
  'the executed by is {string} with date and time in the value history of {string}',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (userId: string, activityId: string) {
    const executedByCell = pageFixture.page.locator('.table__row .table__row-cell').nth(2);
    expect(await executedByCell.textContent()).toContain(`(${userId})`);
  },
);
