/* eslint-disable @typescript-eslint/no-var-requires */
const custom = require('@digitalroute/cz-conventional-changelog-for-jira/configurable');
const defaultTypes = require('@digitalroute/cz-conventional-changelog-for-jira/types');

// Create custom types from default types
const customTypes = {
  ...defaultTypes,
  WIP: {
    description: 'Work In Progress',
    title: 'WIP',
  },
  style: {
    description: 'Style only changes',
    title: 'style',
  },
  chore: {
    description: 'chore',
    title: 'chore',
  },
  revert: {
    description: 'revert',
    title: 'revert',
  },
};
delete customTypes.build;
delete customTypes.ci;

module.exports = custom({
  types: {
    ...customTypes,
  },
  jiraMode: true,
  skipScope: false,
  jiraLocation: 'pre-description',
  jiraAppend: ':',
  exclamationMark: true,
});
