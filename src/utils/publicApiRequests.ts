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

import { API_EQUIPMENT_LOG, API_EQUIPMENT_STATE_DIGRAM, X_API_KEY } from './baseURLs';
import { getAuthorizationHeader } from './createSimulationMO';

import { BrowserContext } from '@playwright/test';
import axios from 'axios';

const getPublicApi = async (context: BrowserContext, url: string, params?: NonNullable<object>) => {
  return await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthorizationHeader(context),
      'x-api-key': X_API_KEY,
    },
    params,
  });
};

export const getEquipmentStateDiagram = async (context: BrowserContext, stateDiagramId?: string) => {
  const url = stateDiagramId ? `${API_EQUIPMENT_STATE_DIGRAM}/${stateDiagramId}` : API_EQUIPMENT_STATE_DIGRAM;

  await getPublicApi(context, url)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      if (stateDiagramId) {
        throw new Error(`Failed to fetch equipment state diagram for ID: ${stateDiagramId}\n` + error);
      } else {
        throw new Error(`Failed to fetch all equipment state diagrams.\n` + error);
      }
    });
};

export const getEquipmentLog = async (context: BrowserContext, params?: NonNullable<object>) => {
  return await getPublicApi(context, `${API_EQUIPMENT_LOG}`, params)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      throw new Error(`Failed to fetch equipment logs.\n` + error);
    });
};
