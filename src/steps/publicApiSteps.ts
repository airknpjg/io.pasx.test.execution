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

import { API_EQUIPMENT_LOG, API_EQUIPMENT_STATE_DIGRAM } from '../utils/baseURLs';
import { pageFixture } from '../utils/pageFixture';

import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

const callOnJsonPage = async (url: string, params?: URLSearchParams) => {
  //Build the URL with query parameters
  if (params) {
    const queryString = params.toString();
    url += `?${queryString}`;
  }
  await pageFixture.page.goto(url);
  return JSON.parse((await pageFixture.page.textContent('body')) || '{}');
};

Given('an equipment {string} that is allocated to the current order', async function (eqId: string) {
  const currentOrderUrl = pageFixture.page.url();
  await allocatedToOrderValidator(true, eqId, 'ALLOCATION_WITH_BF', this.parameters);
  await pageFixture.page.goto(currentOrderUrl);
});

Then('the equipment {string} is allocated to the current order', async function (eqId: string) {
  await allocatedToOrderValidator(true, eqId, 'ALLOCATION_WITH_BF', this.parameters);
});

Then(
  'the equipment {string} is not allocated to the current order with the state {string}',
  async function (eqId: string, sfoEndType: string) {
    await allocatedToOrderValidator(false, eqId, sfoEndType, this.parameters);
  },
);

//
// Reusable methods
//

async function allocatedToOrderValidator(
  isAllocated: boolean,
  eqId: string,
  SFOActionTrigger: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any,
) {
  const jsonObjectResponse = await callOnJsonPage(API_EQUIPMENT_LOG, new URLSearchParams({ equipmentId: eqId }));
  //Scroll to the bottom of the page to show correct screenshot in report
  await pageFixture.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const eqLogEntries = jsonObjectResponse.equipmentLogEntries.reverse();

  expect(eqLogEntries).not.toEqual([]);
  expect(eqLogEntries[0].equipmentId).toBe(eqId);
  if (isAllocated) {
    expect(eqLogEntries[0].overallState).toBe('ALLOCATED');
    expect(eqLogEntries[0].action).toBe(SFOActionTrigger);
    expect(eqLogEntries[0].isAllocated).toBeTruthy();
    expect(eqLogEntries[0].allocationInfo.serviceOrderId).toBe(parameters.orderId);
  } else {
    expect(eqLogEntries[0].overallState).not.toBe('ALLOCATED');
    expect(eqLogEntries[0].action).toBe(SFOActionTrigger);
    expect(eqLogEntries[0].isAllocated).toBeFalsy();
  }
}
