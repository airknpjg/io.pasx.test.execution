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

import { BASE_URL_ORDER_REVIEW_UI } from '../utils/baseURLs';
import { pageFixture } from '../utils/pageFixture';

import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

When('the user selects the started order {string}', async function (orderId: string) {
  // locate the order element and click on it
  const orderElement = pageFixture.page.getByTestId(orderId);
  await orderElement.scrollIntoViewIfNeeded();
  const orderContextMenu = orderElement.getByTestId('orderContextMenu');
  await orderContextMenu.click();

  // select abort option from context menu
  const abortOption = pageFixture.page.locator('#menu .p-menu-item').first();
  await abortOption.waitFor();
  await abortOption.click();

  // wait for the abort dialog to appear
  const abortDialog = pageFixture.page.locator('.p-dialog');
  await abortDialog.waitFor();
  await expect(abortDialog).toBeVisible();
});

When(
  'submit the abort with reason {string} and signing user {string}',
  async function (reason: string, userId: string) {
    // write the reason and sign the dialog
    const abortDialog = pageFixture.page.locator('.p-dialog');
    await abortDialog.locator('.p-textarea').fill(reason);

    // click the submit button
    const submitButton = abortDialog.locator('.modal__content-actions .p-button');
    await submitButton.click();

    // wait for signature
    const signatureDialog = pageFixture.page.locator('.signature__auth-form');
    await signatureDialog.waitFor();

    // fill the user id and password
    await signatureDialog.locator('#userId').fill(userId);
    await signatureDialog.locator('input[type=password]').fill('wltdemo');

    // final submit
    await submitButton.waitFor();
    await submitButton.click();
  },
);

Then('the order {string} is aborted', async function (orderId: string) {
  const toastMessage = await pageFixture.page.locator(`.p-toast-top-center .p-toast-message`).all();
  await expect(toastMessage[0]).toBeVisible();
  await expect(toastMessage[0]).toHaveText(`The shop floor order "${orderId}" was aborted.`);
});

Then('the {string} is in status aborted in OR app', async function (orderId: string) {
  await pageFixture.page.goto(`${BASE_URL_ORDER_REVIEW_UI}/orders/${orderId}`);
  // locate bo__header element and check the status
  const boHeader = await pageFixture.page.locator('.bo__header .value').all();
  await boHeader[4].waitFor();
  await expect(boHeader[4]).toHaveText('Aborted');
});

Then(
  'the exception {string} is documented in {string} in OR app',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (exceptionText: string, orderId: string) {
    // navigate to the order details page
    await pageFixture.page.goto(BASE_URL_ORDER_REVIEW_UI + '/orders/VT000141/exceptions?filterByToAcknowledge=true');

    const cardRow = await pageFixture.page.locator('.card__row').all();
    await cardRow[0].waitFor();
    const cardExceptionHeaderElements = await cardRow[0].locator('.row__item').all();
    await cardExceptionHeaderElements[1].waitFor();
    await expect(cardExceptionHeaderElements[1].locator('.row__value')).toHaveText(exceptionText);
  },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then('the comment {string} is documented in {string} in OR app', async function (reason: string, orderId: string) {
  const cardRow = await pageFixture.page.locator('.card__row').all();
  await cardRow[0].waitFor();
  await cardRow[0].click();

  // check for exceptions history table
  const historyTable = await pageFixture.page.locator('.exception-history-table').all();
  await historyTable[0].waitFor();
  await expect(historyTable[0]).toBeVisible();

  // check the comment
  const commentElement = await historyTable[0].locator('.table__row').all();
  await commentElement[0].waitFor();
  const commentCell = await commentElement[0].locator('.table__row-cell').all();
  await commentCell[3].waitFor();
  await expect(commentCell[3].locator('.table__row-cell-value')).toHaveText(reason);
});

Then(
  'the signing user {string} with date and time is documented in {string} in OR app',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (userId: string, orderId: string) {
    // check the executed by
    const rowElement = await pageFixture.page.locator('.exception-history-table .table__row').all();
    await rowElement[0].waitFor();
    const execCell = await rowElement[0].locator('.table__row-cell').all();

    // get date in the format MM/DD/YYYY format
    const currentDate = new Date();
    const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate
      .getDate()
      .toString()
      .padStart(2, '0')}/${currentDate.getFullYear()}`;

    const regex = new RegExp(
      `Confirm exception \\(Identification\\): ${formattedDate} .* UTC - User${userId} \\(${userId}\\)`,
    );
    await expect(execCell[4].locator('.table__row-cell-value')).toHaveText(regex);
  },
);
