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

import { BASE_URL_VAADIN } from '../utils/baseURLs';
import { pageFixture } from '../utils/pageFixture';

import { clickOnButton, highlightElement } from './prepareSteps';

import { Given } from '@cucumber/cucumber';
import { expect, Frame, Locator, Page } from '@playwright/test';
import path from 'path';

/*
  !REMARKS: In Vaadin, the locator() method, much like the querySelector() method in JavaScript,
  ! does not accurately find elements in the DOM tree, often returning null or undefined.
  ! This is because the Vaadin app works with embedded iframes, which are not always visible to
  ! queries until they are interacted with.
  To ensure that the elements are found correctly, a workaround was used with the getByText() method
  and then reaching the parent element with locator("..")
*/

Given(
  'State diagram {string} has status {string} as initial state',
  async function (stateDiagramId: string, initialState: string) {
    // Prepare to reach the correct vaadin page
    await reachVaadinWidget('statediagram').then(async vaadinFrame => {
      // Search for the correct state diagram entry and click on it
      const stateDiagramTableEntry = vaadinFrame.getByText(stateDiagramId).first();
      await stateDiagramTableEntry.click({ clickCount: 2 });

      // Show the Transitions tab
      await vaadinFrame.getByText('Transitions').locator('..').click();

      const initialStateEntry = vaadinFrame.getByText(initialState).locator('..');
      // initialStateEntry.click({position: { x: 0, y: 0 }});
      await highlightElement(initialStateEntry, vaadinFrame);
      expect(initialStateEntry).toBeDefined();
    });
  },
);

Given(
  'transition {string} from status {string} to {string} with trigger {string}',
  async function (transition: string, initialState: string, targetState: string, trigger: string) {
    //! GIVEN STATEMENT dependent on 'State diagram {string} has status {string} as initial state'
    const vaadinFrame = getMainVaadinFrame('statediagram');
    //Initial state entry builder
    const initialStateEntryBuilder = await stateDiagramDetails_TransitionsTable_InitialState_EntryBuilder(
      vaadinFrame,
      initialState,
    );

    //Find the correct transition entry
    const transitionEntryIndex = initialStateEntryBuilder.transitionIDs.findIndex(entry => entry.value === transition);
    expect(transitionEntryIndex).toBeGreaterThan(-1);

    // Check if the target state matches
    await highlightElement(initialStateEntryBuilder.targetStates[transitionEntryIndex].parentElement, vaadinFrame);
    expect(initialStateEntryBuilder.targetStates[transitionEntryIndex].value).toContain(targetState);

    // Check if the correct trigger exists
    await initialStateEntryBuilder.transitionTriggers[transitionEntryIndex].element.click();
    const triggerText = vaadinFrame.getByText(trigger);
    expect(triggerText).toBeDefined();
  },
);

//
// Utility functions
//

/**
 * Get the main vaadin frame
 * @param widgetId - The frame to be reached through the widget id.
 * @returns the frame to be accessed
 */
export const getMainVaadinFrame = (widgetId: string) => {
  return pageFixture.page.frame({ url: new RegExp(`.*!${widgetId}`) })!;
};

export const getMainVaadinCurrentFrame = async (widgetId: string): Promise<Frame> => {
  const timeoutMs = 10000; // 10 seconds
  const intervalMs = 500; // check every 500ms

  for (let elapsed = 0; elapsed < timeoutMs; elapsed += intervalMs) {
    const frame = pageFixture.page.frame({ url: new RegExp(`#!${widgetId}([/?#]|$)`) });
    if (frame) return frame;
    await pageFixture.page.waitForTimeout(intervalMs);
  }

  throw new Error(`Frame with widgetId '${widgetId}' not found within ${timeoutMs}ms`);
};

/**
 * Transitions table entry builder for the given initial state in the state diagram vaadin widget
 * @param vaadinView - The vaadin view to be reached
 * @param initialState - The initial state to find
 * @returns the entry builder object with the target states, transition IDs and transition triggers
 */
const stateDiagramDetails_TransitionsTable_InitialState_EntryBuilder = async (
  vaadinView: Frame,
  initialState: string,
) => {
  type EntryValue = {
    value: string;
    element: Locator;
    parentElement: Locator;
  };

  const entryBuilder = {
    targetStates: [] as EntryValue[],
    transitionIDs: [] as EntryValue[],
    transitionTriggers: [] as EntryValue[],
  };

  // Show the Transitions details table
  const transitionTable = await vaadinView.locator('#statediagram_StatePackageDataGroup');
  // Find the initial state entry
  const transitionTableInitialStateEntryText = await transitionTable.getByText(initialState);
  await transitionTableInitialStateEntryText.scrollIntoViewIfNeeded();
  const transitionTableInitialStateEntry = transitionTableInitialStateEntryText
    .locator('..')
    .locator('..')
    .locator('..')
    .locator('..')
    .locator('..'); // Go up to the row of the table

  // Get available target states of the initial state entry (First column of the table)
  entryBuilder.targetStates = await Promise.all(
    (
      await transitionTableInitialStateEntry
        .locator('.v-filterselect-pasx-state-transition-row-target-state-combo input')
        .all()
    ).map(async element => ({
      value: await element.inputValue(), //Vaadin doesn't show the text in the input field html, so we need to get the inside value
      element: element,
      parentElement: await element.locator('..').locator('..').locator('..').locator('..').locator('..').locator('..'),
    })),
  );

  // Get all transtitions of the initial state entry (Second column of the table)
  entryBuilder.transitionIDs = await Promise.all(
    (await transitionTableInitialStateEntry.locator('input.v-textfield-pasx-row-transition-id-textfield').all()).map(
      async element => ({
        value: await element.inputValue(), //Vaadin doesn't show the text in the input field html, so we need to get the inside value
        element: element,
        parentElement: await element.locator('..').locator('..').locator('..').locator('..'),
      }),
    ),
  );

  // Get all transtition triggers of the initial state entry (sixth column of the table)
  entryBuilder.transitionTriggers = await Promise.all(
    (await transitionTableInitialStateEntry.locator('.pasx-sp-row-triggered-info').all()).map(async element => ({
      value: (await element.textContent()) || '', // will only show "x trigger(s)"
      element: element,
      parentElement: await element.locator('..').locator('..').locator('..'),
    })),
  );

  return entryBuilder;
};

/**
 * Open the vaadin widget with the given ID
 * @param widgetId - The widget ID to open in the vaadin app
 * returns the vaadin frame that was opened
 */
export const reachVaadinWidget = async (widgetId: string) => {
  // Check if the current page is the correct one
  // If not, it navigates to the correct page
  if (!pageFixture.page.url().includes(BASE_URL_VAADIN)) {
    await clickOnButton('Menu');
    await pageFixture.page.locator('.sidebar-content__navigation .tree-list > .node-tree:nth-child(2)').click();
    await pageFixture.page
      .locator(
        '.sidebar-content__navigation .tree-list > .node-tree:nth-child(2) > .node-tree__children > .node-tree:nth-child(2)',
      )
      .click();
    const pages = pageFixture.page.context().pages();
    const firstTab = pages[0];
    await firstTab.bringToFront();
  }
  await pageFixture.page.goto(BASE_URL_VAADIN + '/#' + widgetId);

  if (await pageFixture.page.locator('.pasx-logon-window').isVisible()) {
    // Check if the logon window is visible
    await pageFixture.page.locator('.pasx-logon-window #id').fill('101');
    await pageFixture.page.locator('.pasx-logon-window #password').fill('wltdemo');
    await pageFixture.page.locator('.pasx-logon-window #executeLogon').click();
  }
  await pageFixture.page.getByText('User101').waitFor(); // Wait for the user to be logged in, checking for his name in the footer

  return getMainVaadinFrame(widgetId);
};

export const closeVaadinWidget = async () => {
  const context = pageFixture.page.context();
  const pages = context.pages();

  if (pages.length > 1) {
    const secondTab = pages[1];
    await secondTab.close(); // Close the second tab
    const firstTab = pages[0];
    await firstTab.bringToFront(); // Bring the first tab to the front
    pageFixture.page = firstTab; // Update the shared page reference
    console.log('Closed second tab and returned to the first tab.');
  } else {
    console.log('Only one tab is open. No action taken.');
  }
};

export const uploadFileViaChooser = async (page: Page, buttonLocator: Locator, fileName: string): Promise<void> => {
  const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), buttonLocator.click()]);
  const filePath = path.resolve(__dirname, '../data', fileName);
  await fileChooser.setFiles(filePath);
};

export const confirmWithCredentials = async (
  frame: Frame,
  userId: string,
  password: string,
  buttonName: string,
): Promise<void> => {
  const userIDTextField = frame.locator(`//input[contains(@id,'UserId')]`);
  const passwordTextField = frame.locator(`//input[contains(@id,'Password')]`);
  const confirmButton = frame.locator(`//*[contains(@class,'v-button') and contains(text(),'${buttonName}')]`);

  await userIDTextField.fill(userId);
  await passwordTextField.fill(password);
  await confirmButton.click();
};
