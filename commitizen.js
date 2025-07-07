var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/* eslint-disable @typescript-eslint/no-var-requires */
var custom = require('@digitalroute/cz-conventional-changelog-for-jira/configurable');
var defaultTypes = require('@digitalroute/cz-conventional-changelog-for-jira/types');
// Create custom types from default types
var customTypes = __assign(__assign({}, defaultTypes), { WIP: {
        description: 'Work In Progress',
        title: 'WIP',
    }, style: {
        description: 'Style only changes',
        title: 'style',
    }, chore: {
        description: 'chore',
        title: 'chore',
    }, revert: {
        description: 'revert',
        title: 'revert',
    } });
delete customTypes.build;
delete customTypes.ci;
module.exports = custom({
    types: __assign({}, customTypes),
    jiraMode: true,
    skipScope: false,
    jiraLocation: 'pre-description',
    jiraAppend: ':',
    exclamationMark: true,
});
