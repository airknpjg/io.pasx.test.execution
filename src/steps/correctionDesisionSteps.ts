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

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given(
  '{string} has a decision {string} with decision type = user selection',
  async function (orderId: string, decisionName: string) {
    const puElement = pageFixture.page.getByTestId(orderId);
    await puElement.waitFor();
    await puElement.click();

    const header = pageFixture.page.locator('.sfo-execution-subheader');
    await header.waitFor();
    const orderIdElm = header.locator('.sfo-execution-subheader__wrapper-left-section--orderId');
    await orderIdElm.waitFor();
    await expect(orderIdElm).toHaveText(orderId);

    const decisionElement = pageFixture.page.locator('.list-item', { hasText: decisionName });
    await decisionElement.waitFor();
    await decisionElement.click();

    await expect(decisionElement).toContainText(decisionName);
  },
);

Given(
  '{string} has a branch {string} with description {string}',
  async function (decision: string, branch: string, description: string) {
    const branchElm = pageFixture.page.locator('.radio', { hasText: description });
    await branchElm.waitFor();

    await expect(branchElm).toBeVisible();
  },
);

When('the decision {string} is executed with {string}', async function (decision: string, decisionValue: string) {
  const execButton = pageFixture.page.locator('button.p-togglebutton', { hasText: 'Executable' });
  await execButton.waitFor();
  await execButton.click();

  const decisionElement = pageFixture.page.locator('.list-item', { hasText: decision });
  await decisionElement.waitFor();
  await decisionElement.click();

  const branch = pageFixture.page.locator('.radio', { hasText: decisionValue });
  await branch.waitFor();
  await branch.click();

  const submitButton = pageFixture.page.locator('button[type="submit"]');
  await submitButton.click();
});

When(
  'the {string} from {string} is executed with {string}',
  async function (activity: string, cbf: string, value: string) {
    const cbfElm = pageFixture.page.locator('.list-item', { hasText: cbf });
    await cbfElm.waitFor();
    await cbfElm.click();

    const activityElm = pageFixture.page.locator('.activity', { hasText: activity });
    await activityElm.waitFor();
    await activityElm.click();

    const att1ElmValue = activityElm.locator('.radio', { hasText: value });
    await att1ElmValue.click();

    const submitButton = activityElm.locator('button[type="submit"]');
    await submitButton.click();
  },
);

When(
  'the decision {string} is corrected with reason {string} and signing user {string}',
  async function (decisionName: string, reason: string, userId: string) {
    const allButton = pageFixture.page.locator('button.p-togglebutton', { hasText: 'All' });
    await allButton.waitFor();
    await allButton.click();

    const decisionButton = pageFixture.page.locator('.list-item__content--EXECUTED', { hasText: decisionName });
    await decisionButton.last().waitFor();
    await decisionButton.last().click();

    const executionPanelElm = pageFixture.page.locator('.sfo-executor__exec-panel');
    await executionPanelElm.waitFor();

    const decisionElm = executionPanelElm.locator('.execution-summary');
    await decisionElm.waitFor();
    await decisionElm.click();

    const correctionReasonElm = pageFixture.page.locator('button.p-button', { hasText: 'Correction' });
    await correctionReasonElm.waitFor();
    await correctionReasonElm.click();

    const correctionDialog = pageFixture.page.locator('.p-dialog');
    await correctionDialog.locator('.p-textarea').fill(reason);

    // click the submit button
    const submitButton = correctionDialog.locator('.modal__content-actions .p-button');
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

Then('the {string} from {string} is voided', async function (activity: string, cbf: string) {
  const voidedItem = pageFixture.page.locator('.list-item__content--VOIDED', { hasText: cbf });
  await voidedItem.waitFor();
  await voidedItem.click();

  const voidedActivity = voidedItem.locator('.list-item__content-main--VOIDED', { hasText: activity });
  await voidedActivity.waitFor();
  await voidedActivity.click();

  await expect(voidedActivity).toBeVisible();
});

Then(
  'the voiding of {string} from {string} is documented in the value history of {string}',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (activity: string, cbf: string, value: string) {
    const instanceKey = pageFixture.page.url().match(/[?&]stepKey=([^&]+)/)?.[1];

    await pageFixture.page.goto(`${BASE_URL_ORDER_REVIEW_ACTUAL_VALUE_HISTORY}/execution/${instanceKey}/${activity}`);

    const voidedActivity = pageFixture.page.locator('.table__row-cell-value', { hasText: 'Voided activity' });
    await voidedActivity.waitFor();
    await expect(voidedActivity).toBeVisible();
  },
);

Then(
  'the exception {string} is documented in value history of {string}',
  async function (exception: string, value: string) {
    await pageFixture.page.goto(
      `${BASE_URL_ORDER_EXECUTION}/orders/VT000126/BO1?filter=executable&containerKey=VT000126%23BO1`,
    );

    const execButton = pageFixture.page.locator('button.p-togglebutton', { hasText: 'Executable' });
    await execButton.waitFor();
    await execButton.click();

    const decisionElement = pageFixture.page.locator('.list-item', { hasText: value });
    await decisionElement.waitFor();
    await decisionElement.click();

    const instanceKey = pageFixture.page.url().match(/[?&]stepKey=([^&]+)/)?.[1];

    await pageFixture.page.goto(`${BASE_URL_ORDER_REVIEW_ACTUAL_VALUE_HISTORY}/execution/${instanceKey}`);

    const exceptionValue = pageFixture.page.locator('.table__row-cell-value', { hasText: `Exception "${exception}"` });
    await expect(exceptionValue).toBeVisible();
  },
);

Then(
  'the comment {string} is documented in value history of {string}',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (comment: string, value: string) {
    const commentValue = await pageFixture.page.getByText(comment).all();
    await expect(commentValue[0]).toBeVisible();
  },
);

Then(
  'the signing user {string} with date and time is documented in value history of {string}',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (user: string, value: string) {
    const executedByCell = pageFixture.page.locator('.table__row .table__row-cell').nth(2);
    expect(await executedByCell.textContent()).toContain(`(${user})`);
  },
);

async function activityDisplayCheck(activity1: string, activity2: string, cbfName: string) {
  const execButton = pageFixture.page.locator('button.p-togglebutton', { hasText: 'Executable' });
  await execButton.waitFor();
  await execButton.click();

  const elements = pageFixture.page.locator('.list-item', { hasText: cbfName });
  await elements.last().waitFor();
  await elements.last().click();

  const activity1Content = pageFixture.page.locator('.activity', { hasText: activity1 });
  const activity2Content = pageFixture.page.locator('.activity', { hasText: activity2 });

  await expect(activity1Content).toContainText('Select option');
  await expect(activity2Content).toContainText('Select date');
}

Then(
  'the {string} and {string} from {string} are displayed',
  async function (activity1: string, activity2: string, cbfName: string) {
    await activityDisplayCheck(activity1, activity2, cbfName);
  },
);

When(
  '{string} and {string} from {string} are displayed',
  async function (activity1: string, activity2: string, cbfName: string) {
    await activityDisplayCheck(activity1, activity2, cbfName);
  },
);

Then(
  'the {string} and {string} from {string} are not executed',
  async function (activity1: string, activity2: string, cbfName: string) {
    const elements = pageFixture.page.locator('.list-item', { hasText: cbfName });
    await elements.last().waitFor();
    await elements.last().click();

    const isChecked = await pageFixture.page.locator('input#VALUE1').isChecked();
    expect(isChecked).toBeFalsy();
  },
);
