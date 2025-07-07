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

import { hostname } from 'os';

const CURRENT_HOSTNAME = 'pasx.atlantis-staging.labs.werum.net';
const BASE_URL = `https://${CURRENT_HOSTNAME}`;

export const BASE_URL_ORDER_EXECUTION = `${BASE_URL}/orderexecution`;
export const BASE_URL_VAADIN = `${BASE_URL}/pasx`;

export const BASE_URL_ORDER_REVIEW = `${BASE_URL}/orderreview`;
export const BASE_URL_ORDER_REVIEW_UI = `${BASE_URL_ORDER_REVIEW}/ui/index.html#`;
export const BASE_URL_ORDER_REVIEW_ACTUAL_VALUE_HISTORY = `${BASE_URL_ORDER_REVIEW}/ui/sections/index.html/#`;

export const BASE_URL_ORC_MANUFACTURING_ORDER = `http://${CURRENT_HOSTNAME}/central/externalapi/v1/orc/manufacturing-orders/create-simulation-mo`;

// Public API URLs
export const BASE_URL_PUBLIC_API = `${BASE_URL}/central/api`;

export const X_API_KEY = 'pasx';
export const API_EQUIPMENT_STATE_DIGRAM = `${BASE_URL_PUBLIC_API}/v1/equipment-state-diagrams`;
export const API_EQUIPMENT_LOG = `${BASE_URL_PUBLIC_API}/v1/equipment-log`;
