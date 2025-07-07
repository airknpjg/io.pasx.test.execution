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

import { BASE_URL_ORDER_EXECUTION } from '../utils/baseURLs';
import { createSimulationMO } from '../utils/createSimulationMO';
import { pageFixture } from '../utils/pageFixture';

import { Given, When } from '@cucumber/cucumber';
import { expect, Frame, Locator, Page } from '@playwright/test';

Given('the user {string} logged in into the Order Execution', async function (userId: string) {
  await pageFixture.page.goto(BASE_URL_ORDER_EXECUTION + '/login');

  await pageFixture.page.locator('#userId').fill(userId);
  await pageFixture.page.locator('.p-password-input').fill('wltdemo');
  await pageFixture.page.locator('#terminal').fill('AUTOEXEC');

  await pageFixture.page.locator('button[aria-label="Sign in"]').click();
  await pageFixture.page.waitForURL(BASE_URL_ORDER_EXECUTION + '/?status=STARTED&pu=BLEND01');
});

Given('a terminal {string} which is linked to production unit {string}', async function (terminal: string, pu: string) {
  const puElement = pageFixture.page.getByTestId(pu);
  await puElement.waitFor();
  await expect(puElement).toBeVisible();
});

Given(
  'an {string} order {string} created for equipment {string} and production unit {string}',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (specType: string, orderId: string, eq: string, pu: string) {
    await goToHomepage();
    const orderElement = pageFixture.page.getByTestId(orderId);
    await orderElement.waitFor();
    await orderElement.scrollIntoViewIfNeeded();
    await expect(orderElement.locator('.sfo-list__item-priority-0 .sfo-list__item-title-tag')).toContainText(specType);
    await expect(orderElement.locator('.sfo-list__item-priority-0 .sfo-list__item-description')).toContainText(eq);
    await orderElement.waitFor();
    expect(orderElement.isVisible()).toBeTruthy();
  },
);

When('the user opens the order {string}', async function (orderId: string) {
  // locate the order element and click on it
  await pageFixture.page.getByTestId(orderId).click();
});

Given('an opened order {string}', async function (orderId: string) {
  // locate the order element and click on it
  await pageFixture.page.getByTestId(orderId).click();
  await pageFixture.page.locator('.sfo-executor__steps-header-left-area').getByText('All').click();
});

Given(
  'an {string} order created for equipment {string} and production unit {string} with file {string}',
  async function (specType: string, eq: string, pu: string, fileName: string) {
    this.parameters.orderId = await createSimulationMO(pageFixture.page.context(), eq, fileName);
    await goToHomepage();
    await pageFixture.page.waitForTimeout(2000);
    const orderElement = pageFixture.page.getByTestId(this.parameters.orderId);
    await orderElement.scrollIntoViewIfNeeded();
    await expect(orderElement.locator('.sfo-list__item-priority-0 .sfo-list__item-title-tag')).toContainText(specType);
    await expect(orderElement.locator('.sfo-list__item-priority-0 .sfo-list__item-description')).toContainText(eq);
    expect(orderElement.isVisible()).toBeTruthy();
  },
);

export const clickOnButton = async (ariaLabel: string, element?: Locator) => {
  let button: Locator;
  if (element) {
    button = element.locator(`button[aria-label="${ariaLabel}"]`);
  } else {
    button = pageFixture.page.locator(`button[aria-label="${ariaLabel}"]`);
  }
  await button.waitFor();
  await button.click();
};

export const goToHomepage = async () => {
  await pageFixture.page.goto(BASE_URL_ORDER_EXECUTION + '/?status=STARTED&pu=BLEND01');
};

export const submitDialogBox = async (dialogBoxName: string, userId: string) => {
  const dialogBox = pageFixture.page.locator('.p-dialog');
  await expect(dialogBox.locator('.modal__header')).toContainText(dialogBoxName);

  await dialogBox.locator('.modal__content-reason').fill('reason');
  await dialogBox.locator('button[type="submit"]').click();

  await dialogBox.locator('#userId').fill(userId);
  await dialogBox.locator('#password input').fill('wltdemo');
  await dialogBox.locator('button[type="submit"]').click();
};

export const highlightElement = async (element: Locator, frame?: Frame | Page) => {
  const elementHandle = await element.elementHandle();

  if (!frame) {
    frame = pageFixture.page;
  }

  if (elementHandle) {
    await frame.evaluate(el => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.highlightElement(el);
    }, elementHandle);
  } else {
    throw new Error('Element not found');
  }
};
