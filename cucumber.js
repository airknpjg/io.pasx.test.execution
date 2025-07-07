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

module.exports = {
  default: {
    formatOptions: {
      snippetInterface: 'async-await',
    },
    dryRun: false,
    requireModule: ['ts-node/register'],
    failFast: false,
    order: 'defined',
    retry: 0,
    format: ['json:./ci/build/module-test/test-results/e2eTest/junit/report.json', 'html:./src/report-e2e.html'],
    require: ['src/steps/**/*.ts', 'src/utils/hooks.ts'],
    paths: ['src/features/**/*.feature'],
  },
};
