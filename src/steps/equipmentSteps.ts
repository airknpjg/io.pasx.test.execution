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

import {
  confirmWithCredentials,
  getMainVaadinCurrentFrame,
  reachVaadinWidget,
  uploadFileViaChooser,
} from '../steps/vaadinSteps';
import { BASE_URL_ORDER_EXECUTION } from '../utils/baseURLs';
import { pageFixture } from '../utils/pageFixture';

import { clickOnButton, goToHomepage, highlightElement, submitDialogBox } from './prepareSteps';

import { Given, Then, When } from '@cucumber/cucumber';
import { expect, Frame } from '@playwright/test';

Given('the EQ BF {string} was executed with the id {string}', async (bfId: string, value: string) => {
  await pageFixture.page.getByText(bfId).click();
  const ActualValueSummaryItem = await pageFixture.page.getByText('Actual value').locator('..');
  expect(ActualValueSummaryItem.locator('.item-value-text')).toContainText(value);
});

Given('an equipment {string} that is allocated to the order {string}', async (eqId: string, orderId: string) => {
  const savedUrl = pageFixture.page.url();

  const vaadinFrame = await reachVaadinWidget('equipmentlog');
  await vaadinFrame.getByText('Apply').click();

  const tableEntry = vaadinFrame.getByText(eqId).first().locator('..');

  const tableEntryText = await tableEntry.textContent();
  expect(tableEntryText).toContain('Allocation by BF');

  await tableEntry.click({ clickCount: 2 });

  // Show the Transitions tab
  await vaadinFrame.locator('#allocation_group').click();

  const allocationDetailsElement = vaadinFrame
    .locator('#Allocation_headerLabel')
    .locator('..')
    .locator('..')
    .locator('..')
    .locator('..');
  const isEquipmentAllocated = await allocationDetailsElement.locator('#equipmentlog_allocated input').isChecked();
  const sfoAllocatedId = await allocationDetailsElement
    .locator('input#equipmentlog_allocatedTriggerContext_orderId')
    .inputValue();

  await highlightElement(allocationDetailsElement, vaadinFrame);
  expect(isEquipmentAllocated).toBe(true);
  expect(sfoAllocatedId).toBe(orderId);

  await vaadinFrame.locator('.v-window-closebox').click();

  await pageFixture.page.goto(savedUrl);
});

When('the user navigates to an SFO containing one Equipment Check BF {string}', async function (idType: string) {
  if (idType === 'scan') {
    await pageFixture.page.goto(
      BASE_URL_ORDER_EXECUTION +
        '/orders/VT000122/BO1?filter=executable&containerKey=VT000122%23BO1&stepKey=01JBH7H2B4FWGTJ7DF3Q4CYDRG',
    );
    // This is a temporary way of finding the element to click. It only works if we have a
    // single element with the class name, and a more robust way of finding the element should be
    // implemented in the future.
    const listElement = pageFixture.page.locator(`.list-item`);
    await listElement.waitFor();
    await listElement.click();
  }
  if (idType === 'formula') {
    await pageFixture.page.goto(
      BASE_URL_ORDER_EXECUTION +
        '/orders/VT000123/BO1?filter=executable&containerKey=VT000123%23BO1&stepKey=01JBH7H2EPJP63D1RW8G9H56NN',
    );
    // This is a temporary way of finding the element to click. It only works if we have a
    // single element with the class name, and a more robust way of finding the element should be
    // implemented in the future.
    const listElement = pageFixture.page.locator(`.list-item`);
    await listElement.waitFor();
    await listElement.click();
  }
  if (idType === 'attributive') {
    await pageFixture.page.goto(
      BASE_URL_ORDER_EXECUTION +
        '/orders/VT000124/BO1?filter=executable&containerKey=VT000124%23BO1&stepKey=01JBH7H2P0GVQMSGBSDY7WJ5Y6',
    );
    // This is a temporary way of finding the element to click. It only works if we have a
    // single element with the class name, and a more robust way of finding the element should be
    // implemented in the future.
    const listElement = pageFixture.page.locator(`.list-item`);
    await listElement.waitFor();
    await listElement.click();
  }
});

When('the field {string} is updated to {string}', async (field: string, value: string) => {
  await identifyEquipment(field, value);
});

When('the user executes the EQ BF {string} with the id {string}', async (bfId: string, barcode: string) => {
  await pageFixture.page.getByText(bfId).click();
  await identifyEquipment('Identify Equipment', barcode, true);
  await clickOnButton('Submit');
});

When('the user {string} aborts the order {string}', async (bfId: string, orderId: string) => {
  await goToHomepage();
  const orderElement = pageFixture.page.getByTestId(orderId);
  await orderElement.scrollIntoViewIfNeeded();
  await orderElement.getByTestId('orderContextMenu').click();
  await pageFixture.page.getByText('Abort SFO').click();
  await submitDialogBox('Shop floor order abort', '101');
});

Then(
  'the equipment identification {string} is displayed in the screen as valid {string}',
  async function (value: string, type: string) {
    if (type === 'scan') {
      const equipmentId = pageFixture.page.locator('#equipmentId');
      await equipmentId.waitFor();
      await equipmentId.press('Enter');
    }

    if (type === 'attributive') {
      const attributiveButtons = pageFixture.page.locator('.attributive__buttons');
      await expect(attributiveButtons).toBeVisible();
    } else {
      const successIcon = pageFixture.page.locator('.pasx-i-success-outlined');

      await successIcon.waitFor();
      await expect(successIcon).toBeVisible();
    }
  },
);

Then(
  'the equipment identification {string} shows the {string} message {string}',
  async function (eqId: string, message: string, text: string) {
    const equipmentId = pageFixture.page.locator('#equipmentId');
    await equipmentId.waitFor();
    await equipmentId.press('Enter');

    const errorMessage = pageFixture.page.locator('.p-message-text');
    await errorMessage.waitFor({ state: 'visible' });
    await expect(errorMessage).toContainText(text);
  },
);

Then('the equipment {string} is allocated to the order {string}', async function (eqId: string, orderId: string) {
  const vaadinFrame = await reachVaadinWidget('equipmentlog');

  await vaadinFrame.getByText('Apply').click();

  const tableEntry = vaadinFrame.getByText(eqId).first().locator('..');

  const tableEntryText = await tableEntry.textContent();
  expect(tableEntryText).toContain('Allocation by BF');

  await tableEntry.click({ clickCount: 2 });

  // Show the Transitions tab
  await vaadinFrame.locator('#allocation_group').click();
  const allocationDetailsElement = vaadinFrame
    .locator('#Allocation_headerLabel')
    .locator('..')
    .locator('..')
    .locator('..')
    .locator('..');

  const isEquipmentAllocated = await allocationDetailsElement.locator('#equipmentlog_allocated input').isChecked();
  const sfoAllocatedId = await allocationDetailsElement
    .locator('input#equipmentlog_allocatedTriggerContext_orderId')
    .inputValue();

  await highlightElement(allocationDetailsElement, vaadinFrame);
  expect(isEquipmentAllocated).toBe(true);
  expect(sfoAllocatedId).toBe(orderId);
});

Then(
  'the equipment {string} is not allocated to the order {string} with the state {string}',
  async function (eqId: string, orderId: string, sfoEndType: string) {
    const vaadinFrame = await reachVaadinWidget('equipmentlog');

    const closeButton = vaadinFrame.locator('.v-window-closebox');
    if (await closeButton?.isVisible()) {
      await closeButton.click();
    }

    const tableEntry = vaadinFrame.getByText(eqId).first().locator('..');

    const tableEntryText = await tableEntry.textContent();
    expect(tableEntryText).toContain(sfoEndType);
    expect(tableEntryText).not.toContain('Allocated');
    expect(tableEntryText).not.toContain(orderId);

    await tableEntry.click({ clickCount: 2 });

    // Show the Transitions tab
    await vaadinFrame.locator('#allocation_group').click();

    const allocationDetailsElement = vaadinFrame
      .locator('#Allocation_headerLabel')
      .locator('..')
      .locator('..')
      .locator('..')
      .locator('..');
    const isEquipmentAllocated = await allocationDetailsElement.locator('#equipmentlog_allocated input').isChecked();

    await highlightElement(allocationDetailsElement, vaadinFrame);
    expect(isEquipmentAllocated).toBe(false);
  },
);

Given('a BF EQ Check {string} is selected in the order execution', async function (bfId: string) {
  // locate the order id / BO number combination
  const basicOperation = 'BO1';
  const orderElement = pageFixture.page
    .getByTestId(this.parameters.orderId)
    .filter({ hasText: basicOperation })
    .first();
  await orderElement.scrollIntoViewIfNeeded();
  await expect(orderElement.locator('.sfo-list__item-priority-2 .sfo-list__item-description')).toContainText(
    basicOperation,
  );
  await orderElement.click();
  // open the context menu of the order
  const bfElement = pageFixture.page.locator(
    `//span[@class='list-item__content-title-id' and contains(text(), "${bfId}")]`,
  );
  await bfElement.click();
});

// KJ : to ensure the test will use the right bf in the right BO
Given('a BF EQ Check {string} is selected for {string} in the order execution', async function (bfId: string, b0Id: string) {
  // locate the order id / BO number combination
  const basicOperation = b0Id;
  //const basicOperation = 'BO1';
  const orderElement = pageFixture.page
    .getByTestId(this.parameters.orderId)
    .filter({ hasText: basicOperation })
    .first();
  await orderElement.scrollIntoViewIfNeeded();
  await expect(orderElement.locator('.sfo-list__item-priority-2 .sfo-list__item-description')).toContainText(
    basicOperation,
  );
  await orderElement.click();
  // open the context menu of the order
  const bfElement = pageFixture.page.locator(
    `//span[@class='list-item__content-title-id' and contains(text(), "${bfId}")]`,
  );
  await bfElement.click();
});

Given(
  'a master equipment {string} is an assembly of the following child equipments',
  async function (masterEquipment: string, dataTable) {
    const childEquipmentList: string[] = dataTable
      .raw()
      .slice(1)
      .map((row: string[]) => row[0]);
    await reachVaadinWidget('assembly');
    const assemblyFrame = await getMainVaadinCurrentFrame('assembly');
    await filterById(assemblyFrame, 'Equipment ID', masterEquipment);
    const masterEquipmentIDCell = assemblyFrame.locator(`//table//tr//td[contains(text(), '${masterEquipment}')]`);
    await masterEquipmentIDCell.click();
    const assemblyButton = assemblyFrame.locator(
      `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'Assembly')]`,
    );
    await assemblyButton.click();
    const masterEquipmentIDTextField = assemblyFrame.locator(`//input[contains(@id, 'master-equipment-scan')]`);
    await masterEquipmentIDTextField.fill(masterEquipment);
    await masterEquipmentIDTextField.press('Enter');
    await confirmWithCredentials(assemblyFrame, '101', 'wltdemo', 'Confirm');
    for (const childEquipment of childEquipmentList) {
      const equipmentToInstallTextField = assemblyFrame.locator(`//input[contains(@id, 'equipment-to-install-scan')]`);
      await equipmentToInstallTextField.fill(childEquipment);
      await masterEquipmentIDTextField.press('Enter');
      await confirmWithCredentials(assemblyFrame, '101', 'wltdemo', 'Confirm');
    }
    const confirmButton = assemblyFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Confirm')]`);
    await confirmButton.click();
    await confirmWithCredentials(assemblyFrame, '101', 'wltdemo', 'Confirm');
    await confirmWithCredentials(assemblyFrame, '102', 'wltdemo', 'Confirm');
    const closeButton = assemblyFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Close')]`);
    await closeButton.click();
  },
);

Given(
  'the status of EQ {string} is manually changed by transition {string} for state diagram {string}',
  { timeout: 180 * 1000 },
  async function (equipmentID: string, transition: string, stateDiagram: string) {
    await reachVaadinWidget('equipmentmonitor');
    const equipmentMonitorFrame = await getMainVaadinCurrentFrame('equipmentmonitor');
    await filterById(equipmentMonitorFrame, 'Equipment ID', equipmentID);
    const rowLocator = equipmentMonitorFrame.locator(`//table//tr[contains(@class, 'table-row')][1]`);
    expect(rowLocator).not.toBeNull();
    if (rowLocator != null) {
      await rowLocator.click();
      const exceptionalChangeButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'ExceptionalChange')]`,
      );
      await exceptionalChangeButton.click();
      const changeStateButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'action-name') and contains(text(),'Change state')]`,
      );
      await changeStateButton.click();
      const selectedStateDiagramButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'action-name') and contains(text(),'${stateDiagram}')]`,
      );
      await selectedStateDiagramButton.click();
      const selectedTransitionButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'transition-id') and contains(text(),'${transition}')]`,
      );
      await selectedTransitionButton.click();
      const commentTextField = equipmentMonitorFrame.locator(`//textarea[contains(@class,'comment')]`);
      await commentTextField.fill(`Change equipment state`);
      const confirmButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Confirm')]`,
      );
      await confirmButton.click();
      await confirmWithCredentials(equipmentMonitorFrame, '101', 'wltdemo', 'Confirm');
      await confirmWithCredentials(equipmentMonitorFrame, '102', 'wltdemo', 'Confirm');
      const closeButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Close')]`,
      );
      await closeButton.waitFor();
      await closeButton.click();
      const refreshButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'Refresh')]`,
      );
      await refreshButton.click();
      await pageFixture.page.waitForTimeout(2000);
    }
  },
);

Given(
  'a counter {string} of EQ {string} is manually changed to {string}',
  { timeout: 180 * 1000 },
  async function (equipmentID: string, counterName: string, newCounterValue: string) {
    await reachVaadinWidget('equipmentmonitor');
    const equipmentMonitorFrame = await getMainVaadinCurrentFrame('equipmentmonitor');
    console.log(`equipmentMonitorFrame check ${equipmentMonitorFrame.url()}`);
    await filterById(equipmentMonitorFrame, 'Equipment ID', equipmentID);
    const rowLocator = equipmentMonitorFrame.locator(`//table//tr[contains(@class, 'table-row')][1]`);
    expect(rowLocator).not.toBeNull();
    if (rowLocator != null) {
      await rowLocator.click();
      const exceptionalChangeButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'ExceptionalChange')]`,
      );
      await exceptionalChangeButton.click();
      const changeCounterButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'action-name') and contains(text(),'Change counter')]`,
      );
      await changeCounterButton.click();
      const counterNameTextFields = equipmentMonitorFrame.locator(
        `//div[contains(@class,'exceptional-counter-change')]//div[contains(@class,'v-label-counter-id-label')]`,
      );
      const counterNameTextContents: string[] = await counterNameTextFields.allTextContents();
      const targetIndex = counterNameTextContents.findIndex(text => text.includes(counterName));
      if (targetIndex !== -1) {
        const newCounterTextFields = equipmentMonitorFrame.locator(
          `//div[contains(@class,'exceptional-counter-change')]//input[contains(@class,'counter-new-value')]`,
        );
        await newCounterTextFields.nth(targetIndex).fill(newCounterValue);
      } else {
        console.error("No counter name containing 'Major' was found.");
      }
      const nextButton = equipmentMonitorFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Next')]`);
      await nextButton.click();
      const commentTextField = equipmentMonitorFrame.locator(`//textarea[contains(@class,'comment')]`);
      await commentTextField.fill(`Change equipment counter`);
      const confirmButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Confirm')]`,
      );
      await confirmButton.click();
      await confirmWithCredentials(equipmentMonitorFrame, '101', 'wltdemo', 'Confirm');
      await confirmWithCredentials(equipmentMonitorFrame, '102', 'wltdemo', 'Confirm');
      const closeButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Close')]`,
      );
      await closeButton.waitFor();
      await closeButton.click();
      const refreshButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'Refresh')]`,
      );
      await refreshButton.click();
      await pageFixture.page.waitForTimeout(2000);
    }
  },
);

Given(
  'a counter definition {string} of EQ {string} is manually changed to {string}',
  { timeout: 180 * 1000 },
  async function (counterName: string, equipmentID: string, newCounterValue: string) {
    await reachVaadinWidget('equipmentmonitor');
    const equipmentMonitorFrame = await getMainVaadinCurrentFrame('equipmentmonitor');
    console.log(`equipmentMonitorFrame check ${equipmentMonitorFrame.url()}`);
    await filterById(equipmentMonitorFrame, 'Equipment ID', equipmentID);
    const rowLocator = equipmentMonitorFrame.locator(`//table//tr[contains(@class, 'table-row')][1]`);
    expect(rowLocator).not.toBeNull();
    if (rowLocator != null) {
      await rowLocator.click();
      const exceptionalChangeButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'ExceptionalChange')]`,
      );
      await exceptionalChangeButton.click();
      const changeCounterButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'action-name') and contains(text(),'Change counter')]`,
      );
      await changeCounterButton.click();
      const counterNameTextFields = equipmentMonitorFrame.locator(
        `//div[contains(@class,'exceptional-counter-change')]//div[contains(@class,'v-label-counter-id-label')]`,
      );
      const counterNameTextContents: string[] = await counterNameTextFields.allTextContents();
      const targetIndex = counterNameTextContents.findIndex(text => text.includes(counterName));
      if (targetIndex !== -1) {
        const newCounterTextFields = equipmentMonitorFrame.locator(
          `//div[contains(@class,'exceptional-counter-change')]//input[contains(@class,'counter-new-value')]`,
        );
        await newCounterTextFields.nth(targetIndex).fill(newCounterValue);
      } else {
        console.error("No counter name containing 'Major' was found.");
      }
      const nextButton = equipmentMonitorFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Next')]`);
      await nextButton.click();
      const commentTextField = equipmentMonitorFrame.locator(`//textarea[contains(@class,'comment')]`);
      await commentTextField.fill(`Change equipment counter`);
      const confirmButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Confirm')]`,
      );
      await confirmButton.click();
      await confirmWithCredentials(equipmentMonitorFrame, '101', 'wltdemo', 'Confirm');
      await confirmWithCredentials(equipmentMonitorFrame, '102', 'wltdemo', 'Confirm');
      const closeButton = equipmentMonitorFrame.locator(
        `//*[contains(@class,'v-button') and contains(text(),'Close')]`,
      );
      await closeButton.waitFor();
      await closeButton.click();
      const refreshButton = equipmentMonitorFrame.locator(
        `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'Refresh')]`,
      );
      await refreshButton.click();
      await pageFixture.page.waitForTimeout(2000);
    }
  },
);


Given(
  'the following equipments are created with file {string}',
  { timeout: 600 * 1000 },
  async function (fileName: string, dataTable) {
    await importXmlFile(fileName);

    const equipmentList = await getColumnDataFromFeatureTable('Equipment ID', dataTable);
    const equipmentTypeList = await getColumnDataFromFeatureTable('Equipment Type', dataTable);
    const stateDiagramList = await getColumnDataFromFeatureTable('State Diagram', dataTable);

    if (stateDiagramList) {
      await reachVaadinWidget('statediagram');
      const stateDiagramFrame = await getMainVaadinCurrentFrame('statediagram');
      for (const stateDiagram of stateDiagramList) {
        await filterById(stateDiagramFrame, 'ID', stateDiagram);
        await setEffective(stateDiagramFrame, stateDiagram, 'state diagram');
      }
    }

    if (equipmentTypeList) {
      await reachVaadinWidget('equipmenttype');
      const equipmentTypeFrame = await getMainVaadinCurrentFrame('equipmenttype');
      for (const equipmentType of equipmentTypeList) {
        await filterById(equipmentTypeFrame, 'ID', equipmentType);
        await setEffective(equipmentTypeFrame, equipmentType, 'equipment type');
      }
    }

    if (equipmentList) {
      await reachVaadinWidget('equipment');
      const equipmentFrame = await getMainVaadinCurrentFrame('equipment');
      for (const equipmentId of equipmentList) {
        await filterById(equipmentFrame, 'ID', equipmentId);
        await setEffective(equipmentFrame, equipmentId, 'equipment');
      }
    }
  },
);

When('an option with contains text {string} is selected', async (text: string) => {
  await identifyEquipment('Select option', text, true);
});

When('a equipment {string} is identified', async function (eqId: string) {
  // locate the order id / BO number combination
  await identifyEquipment('Identify Equipment', eqId, true);
  //await clickOnButton('Submit');
  await pageFixture.page.waitForTimeout(5000);
});


When('a BF {string} is executed', async function (bfId: string) {
  // locate the order id / BO number combination
  const bfElement = pageFixture.page.locator(
    `//span[@class='list-item__content-title-id' and contains(text(), "${bfId}")]`,
  );
  await bfElement.click();
  await clickOnButton('Submit');
  await pageFixture.page.waitForTimeout(5000);
});

Then('an order execution shows all filter', async function () {
  const toggleShowAllFilter = pageFixture.page.locator(`//button[@class='p-togglebutton p-component']`);
  const buttonPressed = await toggleShowAllFilter.getAttribute('aria-pressed');
  if (buttonPressed === 'false') {
    await toggleShowAllFilter.click();
  }
});

Then('the exception message is raised', async function () {
  const exception = pageFixture.page.locator(
    `//div[contains(@class, 'status-indicator-wrapper__status') and contains(@class,'TOLERANCE_BLOCKED')]`,
  );
  await exception.waitFor();
  expect(exception.isVisible());
});

Then('the exception message is raised and status of BF becomes block', async function () {
  const exception = pageFixture.page.locator(
    `//div[contains(@class, 'status-indicator-wrapper__status') and contains(@class,'TOLERANCE_BLOCKED')]`,
  );
  await exception.waitFor();
  expect(exception.isVisible());
});

// KJ : to ensure the user is informed by the error message
Then('the system shows allocated in another context error message', async function () {
  const errorMsg = pageFixture.page.locator(
    `//div[@class='p-message-text' and @data-p='error']/div`
  );
  await errorMsg.waitFor(); // Wait for the element to appear

  const text = await errorMsg.textContent();
  expect(text).toContain('This equipment is already used in another context.');
});

// KJ : to ensure the user is informed by the error message
Then('the system shows counter exceeded error message', async function () {
  const errorMsg = pageFixture.page.locator(
    `//div[@class='p-message-text' and @data-p='error']/div[position()=1]`
  );
  await errorMsg.waitFor(); // Wait for the element to appear

  const text = await errorMsg.textContent();
  expect(text).toContain('the counter limit would be exceeded');
});

// KJ : to ensure the user cannot submit the eq bf
Then('the user is not able to submit the BF', async function () {
  const submitBtn = pageFixture.page.locator(
    `//button[@type= 'submit']`
  );
  const isDisabled = await submitBtn.getAttribute('data-p-disabled');
  expect(isDisabled).toBe('true');

});

Then('the following equipments are displayed as set value', async function (dataTable) {
  const equipmentIds: string[] = dataTable
    .raw()
    .slice(1)
    .map((row: string[]) => row[0]);
  await Promise.all(
    equipmentIds.map(async (setValue: string) => {
      const setValueElement = pageFixture.page.locator(
        `//li[contains(@class,'eq-set-value__list-item') and contains(text(),"${setValue}")]`,
      );
      await setValueElement.waitFor();
      expect(await setValueElement.isVisible()).toBeTruthy();
    }),
  );
});

// KJ : in case of there is 1 eq in set value
Then('the equipment {string} is displayed as set value', async function (equipmentId: string) {
  const setValueElement = pageFixture.page.locator(
    `//div[@class='eq-set-value__single' and contains(text(),"${equipmentId} - ")]`
  );
  await setValueElement.waitFor();
  expect(await setValueElement.isVisible()).toBeTruthy();
});


Then('the following information are contained in actual value history', async function (dataTable: any) {
  const searchFieldList = await getColumnDataFromFeatureTable('Search field', dataTable);
  const dataList = await getColumnDataFromFeatureTable('Data', dataTable);
  const valueList = await getColumnDataFromFeatureTable('Value', dataTable);
  if (searchFieldList && dataList && valueList) {
    for (let i = 0; i < searchFieldList.length; i++) {
      const searchField = searchFieldList[i];
      const data = dataList[i];
      const expectedValue = valueList[i];
      let field = '';
      if (searchField.includes('Actual')) {
        field = 'bf-actual-value';
      } else if (searchField.includes('Set')) {
        field = 'bf-set-value';
      }
      const valueElement = pageFixture.page.locator(
        `//div[contains(@class, '${field}')]//div[@class='label-values__column-label' and text()='${data}']/following-sibling::div[contains(@class,'label-values__column-value')]`,
      );
      const actualValue = await valueElement.textContent();
      expect(actualValue?.trim()).toBe(expectedValue);
    }
  }
});

// Actual value & Set value - Get value of specific header
// //*[@class='label-values__column' and contains(normalize-space(),'${Header}')]//div[contains(@class,'label-values__column-value')]
// //div[contains(@class, 'bf-set-value')]//div[contains(@class,'column-label') and normalize-space()='Equipment type']/following-sibling::div[contains(@class,'column-value')]
// //div[contains(@class,'set-value')]/div/div[@class='label-values__column-label' and contains(normalize-space(),'')]/following-sibling::div[contains(@class,'label-values__column-value')]
// //div[contains(@class, 'bf-actual-value')]//div[@class='label-values__column-label' and contains(normalize-space(),'')]/following-sibling::div[contains(@class,'label-values__column-value')]
// Find header
// //*[@class='label-values__column' and contains(normalize-space(),'${Header}')]

// History table - Get column value of specific action
// //tr[.//div[text()[contains(normalize-space(),'${Action}')]]]//div[normalize-space()='${Column}']/following-sibling::div[not(contains(@class,'table__row-cell-title'))]

//
// Reusable methods
//

const identifyEquipment = async (field: string, value: string, identifyTrigger = false) => {
  if (field === 'Identify Equipment') {
    const equipmentId = pageFixture.page.locator('#equipmentId');
    await equipmentId.waitFor();
    await equipmentId.fill(`¿93${value}`);
    if (identifyTrigger) {
      await equipmentId.press('Enter');
    }
  }
  if (field === 'Select option') {
    const isTrueTextSelected = value === 'Equipment matches required equipment' ? 1 : 2;
    const radioButtons = pageFixture.page.locator(
      `.attributive__buttons div:nth-child(${isTrueTextSelected}) #attributiveId`,
    );
    await radioButtons.waitFor();
    await radioButtons.click();
  }
};

const getColumnDataFromFeatureTable = async function (header: string, dataTable: any): Promise<string[] | null> {
  const rawData = dataTable.raw();
  const headerRow = rawData[0].map((cell: string) => cell.trim());
  const index = headerRow.findIndex((cell: string) => cell.toLowerCase() === header.toLowerCase());
  return index !== -1 ? rawData.slice(1).map((row: string[]) => row[index]) : null;
};

const importXmlFile = async function (fileName: string) {
  await reachVaadinWidget('import').then(async vaadinFrame => {
    const importButton = vaadinFrame.locator(
      `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'Import')]`,
    );
    await importButton.click();
    const selectFileButton = vaadinFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Select file')]`);
    await uploadFileViaChooser(pageFixture.page, selectFileButton, fileName);
    const nextButton = vaadinFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Next')]`);
    await nextButton.click();
    const commentTextField = vaadinFrame.locator(`//textarea[contains(@class,'comment')]`);
    await commentTextField.fill(`import xml file`);
    const confirmButton = vaadinFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Confirm')]`);
    await confirmButton.click();
    await confirmWithCredentials(vaadinFrame, '101', 'wltdemo', 'Confirm');
    await confirmWithCredentials(vaadinFrame, '102', 'wltdemo', 'Confirm');
    const closeButton = vaadinFrame.locator(`//*[contains(@class,'v-button') and contains(text(),'Close')]`);
    await closeButton.waitFor();
    const successMessage = vaadinFrame.locator(`//*[contains(@class,'label-title') and contains(text(),'successful')]`);
    await expect(successMessage).toBeVisible();
    await closeButton.click();
  });
};

const filterById = async function (vaadinFrame: Frame, columnIDName: string, entityId: string) {
  const quickFilterIDButton = vaadinFrame.locator(
    `//*[contains(text(),'${columnIDName}')]/preceding-sibling::*[contains(@class,'filter-icon')] | //*[contains(text(),'${columnIDName}')]/following-sibling::*[contains(@class,'filter-icon')]`,
  );
  await quickFilterIDButton.click();
  const quickFilterIDTextField = vaadinFrame.locator(`//input[contains(@class, 'filter_field_value')]`);
  await quickFilterIDTextField.fill(entityId);
  await quickFilterIDTextField.press('Enter');
};

const setEffective = async function (vaadinFrame: Frame, entityId: string, entityLabel: string) {
  const rowLocator = vaadinFrame.locator(`//table//tr[contains(@class, 'has-data')][1]`);
  expect(rowLocator).not.toBeNull();
  const statusCell = vaadinFrame.locator(`//table//tr[1]//td[contains(@class,'lifecycleState')]`);
  const statusText = (await statusCell.textContent())?.trim();
  if (statusText === 'Draft') {
    await rowLocator.click();
    const approvalButton = vaadinFrame.locator(
      `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'APPROVAL')]`,
    );
    await approvalButton.click();
    await confirmWithCredentials(vaadinFrame, '101', 'wltdemo', 'OK');
    const effectiveButton = vaadinFrame.locator(
      `//button[contains(@id,'ApplicationToolbarCommandLocation') and contains(@id,'EFFECTIVE')]`,
    );
    await effectiveButton.click();
    await confirmWithCredentials(vaadinFrame, '102', 'wltdemo', 'OK');
    console.log(`Processed ${entityLabel}: ${entityId}`);
  } else {
    console.log(`Skipped ${entityLabel}: ${entityId} (Status: ${statusText})`);
  }
  await pageFixture.page.waitForTimeout(2000);
};
