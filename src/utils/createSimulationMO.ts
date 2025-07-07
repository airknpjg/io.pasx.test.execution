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

import { BASE_URL_ORC_MANUFACTURING_ORDER } from './baseURLs';

import axios, { AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import { BrowserContext } from 'playwright';

/**
 * Creates an ESP by making a POST request to the specified endpoint.
 * The request body is read from an XML file.
 *
 * @param context - The Playwright BrowserContext.
 * @param equipmentId - The ID of the equipment.
 * @param fileName - The name of the .xml file (must be in the "../data" folder).
 */
export async function createSimulationMO(
  context: BrowserContext,
  equipmentId: string,
  fileName: string,
): Promise<string | undefined> {
  console.log(`Read from file ${fileName}`);
  const fileContent = readFile(fileName);
  // Define the API endpoint
  const apiUrl = `${BASE_URL_ORC_MANUFACTURING_ORDER}/${equipmentId}`;
  console.log(`apiUrl ${apiUrl}`);
  return await postSimulationMO(apiUrl, fileContent, context);
}

/**
 * Creates a SFO by making a POST request to the specified endpoint.
 * The request body is read from an XML file.
 *
 * @param context - The Playwright BrowserContext.
 * @param fileName - The name of the .xml file (must be in the "../data" folder).
 */
export async function createMBRBasedSimulationMO(
  context: BrowserContext,
  fileName: string,
): Promise<string | undefined> {
  const fileContent = readFile(fileName);

  // Define the API endpoint
  const apiUrl = `${BASE_URL_ORC_MANUFACTURING_ORDER}`;
  return await postSimulationMO(apiUrl, fileContent, context);
}

function readFile(fileName: string) {
  const filePath = path.resolve(__dirname, '../data', fileName);

  // Check if the file exists and has a .xml extension
  if (!fs.existsSync(filePath) || path.extname(fileName) !== '.xml') {
    throw new Error(`File ${fileName} does not exist or is not a .xml file in the ../data/ folder.`);
  }

  // Read the file content
  return fs.readFileSync(filePath, 'utf-8');
}

async function postSimulationMO(apiUrl: string, fileContent: string, context: BrowserContext) {
  try {
    // Make the POST request
    const response = await axios.post(apiUrl, fileContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': await getAuthorizationHeader(context),
      },
    });
    console.log(`Response Data: ${response.data}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error details:');
      console.error(`Status: ${axiosError.response?.status}`);
      console.error(`Status Text: ${axiosError.response?.statusText}`);
      console.error(`Response Data: ${JSON.stringify(axiosError.response?.data, null, 2)}`);
      console.error(`Request Headers: ${JSON.stringify(axiosError.config?.headers, null, 2)}`);
      console.error(`Request Data: ${axiosError.config?.data}`);
    } else {
      console.error(`Unexpected error: ${(error as Error).message}`);
    }

    return undefined;
  }
}

/**
 * Retrieves the authorization header from the storage state of the given context.
 * This is used to authenticate the request to the API.
 * @param context - The Playwright BrowserContext.
 */
export async function getAuthorizationHeader(context: BrowserContext): Promise<string> {
  // Get the storage state from the context
  const storageState = await context.storageState();

  // Find the "we-user" item in local storage
  const localStorageItem = storageState.origins[0].localStorage.find(item => item.name === 'we-user')?.value;

  if (localStorageItem) {
    const parsedItem = JSON.parse(localStorageItem);
    if (parsedItem.token) {
      return `Bearer ${parsedItem.token}`;
    }
  }

  throw new Error('Authorization token not found in storage state.');
}
