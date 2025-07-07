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

import { BASE_URL_PUBLIC_API, X_API_KEY } from './baseURLs';
import { getAuthorizationHeader } from './createSimulationMO';
import { pageFixture } from './pageFixture';

import {
  After,
  AfterAll,
  AfterStep,
  Before,
  BeforeAll,
  IWorldOptions,
  setDefaultTimeout,
  setWorldConstructor,
  World,
} from '@cucumber/cucumber';
import { Browser, BrowserContext, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Custom World for Cucumber
 * This is used to share data between steps.
 */
class CustomFATWorld extends World {
  private sharedData: object;

  constructor(options: IWorldOptions) {
    super(options);
    this.sharedData = {};
  }
}
setWorldConstructor(CustomFATWorld);

const highlightElementScript = `
  window.highlightElement = function(element) {
    element.style.border = '2px solid red';
    setTimeout(() => {
      element.style.border = '';
    }, 2000);
  }

  document.addEventListener('click', function(event) {
    if (event.target) {
      window.highlightElement(event.target);
    }
  }, true);

  document.addEventListener('input', function(event) {
    if (event.target) {
      window.highlightElement(event.target);
    }
  }, true);
`;

let browser: Browser;
let context: BrowserContext;

setDefaultTimeout(60 * 1000);

/**
 * Before all hooks
 */
BeforeAll(async function () {
  console.log(`BeforeAll running`);

  browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: [
      '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  // Delete video and screenshots folders
  deleteDirectory('./src/video');
  deleteDirectory('./src/screenshots');
});

/**
 * Before hook
 */
Before(async function ({ pickle }) {
  console.log(`Before running`);
  const storageState = this.parameters.storage;
  const ucTag = pickle.tags.find(tag => tag.name != '@FAT')?.name.replace('@', '') || 'FAT';
  context = await browser.newContext({
    ignoreHTTPSErrors: true,
    timezoneId: 'UTC',
    storageState,
    recordVideo: { dir: `./src/video/${ucTag}` },
  });
  pageFixture.page = await context.newPage();
  await pageFixture.page.addInitScript(highlightElementScript);

  // Set specific headers on public API requests
  await pageFixture.page.route(BASE_URL_PUBLIC_API + '/**', async (route, request) => {
    const headers = {
      ...request.headers(),
      'x-api-key': X_API_KEY,
      'Content-Type': 'application/json',
      'Authorization': await getAuthorizationHeader(pageFixture.page.context()),
    };
    await route.continue({ headers });
  });
});

/**
 * After step hook
 */
AfterStep(async function ({ pickle, result }) {
  // screenshots
  const stepName = `${pickle.name}-${result.status}-${new Date().getTime()}`;
  const ucTag = pickle.tags.find(tag => tag.name != '@FAT')?.name.replace('@', '') || 'FAT';
  const img = await pageFixture.page.screenshot({
    path: `./src/screenshots/${ucTag}/${pickle.name}/${stepName}.png`,
    type: 'png',
  });
  this.attach(img, 'image/png');
});

/**
 * After hook
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
After(async function ({ pickle, result }) {
  // Reset orderId
  pageFixture.previousOrderId = `${this.parameters.orderId}`;
  this.parameters.orderId = undefined;
  // close the pageFixture.page
  await pageFixture.page.close();
  // rename the video file
  const ucTag = pickle.tags.find(tag => tag.name != '@FAT')?.name.replace('@', '') || 'FAT';
  const videoPath = await pageFixture.page.video()!.path();
  const newVideoPath = path.join(`./src/video/${ucTag}/`, `${pickle.name}.webm`);
  fs.renameSync(videoPath, newVideoPath);
  await context.close();
});

/**
 * After all hooks
 */
AfterAll(async function () {
  await browser.close();
});

function deleteDirectory(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
}
