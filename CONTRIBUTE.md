# Contributing Guide

Hi! We're really excited that you are interested in contributing to Order Execution FAT. Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Development Setup](./README.md)
- [Commit Message Convention](#commit-message-convention)
- [Guidelines](#guidelines)
- [Project Structure](#project-structure)
- [Code Documentation](#code-documentation)
- [Testing](#testing)

## Commit Message Convention

Commit messages should follow the [conventional commits convention](https://www.conventionalcommits.org/en/v1.0.0/) plus the set of rules below.

### Describe what the commit does, not what you did

Use the imperative present tense: "change" not "changed" nor "changes"

### Use Jira task IDs

If your work has a related UserStory/Task or Bug in Jira, add it to the commit message according to the conventional commits convention.

The result should be something like:

> **feat: PVD-12345: change app header**

### Don't Commit Half-Done Work

You should only commit code when a logical component is completed. Split a feature‘s implementation into logical chunks that can be completed quickly so that you can commit often. If you‘re tempted to commit just because you need a clean working copy (to check out a branch, pull in changes, etc.) consider using Git‘s «Stash» feature instead.

### Commit Often

Committing often keeps your commits small and, again, helps you commit only related changes. Moreover, it allows you to share your code more frequently with others. That way it‘s easier for everyone to integrate changes regularly and avoid having merge conflicts. Having large commits and sharing them infrequently, in contrast, makes it hard to solve conflicts.

### Commit Related Changes

A commit should be a wrapper for related changes. For example, fixing two different bugs should produce two separate commits. Small commits make it easier for other developers to understand the changes and roll them back if something went wrong. With tools like the staging area and the ability to stage only parts of a file, Git makes it easy to create very granular commits.

## Guidelines

### Tech Discussion Guidelines

- Technical discussions should be made inside cluster channel.

- Prior to technical overall approval, the issue should be migrated to Jira and prioritized accordingly.

### Pull Request Guidelines

- The master branch is a candidate for release anytime. All development should
  be done in dedicated branches.
- You should split the pull request into smaller ones whenever possible.
- You can make pull requests from dedicated branches to other dedicated
  branches, in order to improve splitting and dependency handling.
- Checkout a topic branch from a relevant branch, e.g. master, and merge back
  against that branch.
- It's OK to have multiple small commits as you work on the PR. You should however,
  squash them before merging.
- Before breaking compatibility or removing some feature, be sure that all
  projects that may depend on, to have a change for that breaking change, so no one
  is caught on surprise
- A pull request is ready to be merged once it has two maintainers (different teams) thumbs ups and no unresolved discussion

Being pull request on the core of our development process it is of utmost
importance to make them efficient. They must serve both the creator and the
reviewer in different ways:

- small scope - having the smallest scope possible enables the review to be
  focused as well, turning it quick
- detailed context - providing the reviewers with enough context is key for
  an informed review and for getting the most valuable feedback from reviewers.
  Context is not only the reason for the change but can also detail most important
  changes and even suggest a reviewing order or approach.

#### Efficiency

Using an adequate template will help you to provide the most relevant
information to the reviewers. None of the template sections is mandatory, but
they work as a reminder for you to consider adding information. Check the
available templates in order to understand which best fits your changes.

In order to improve speed and effective code reviews you can check this
[Code Review Checklist](https://confluence.werum.net/display/PVD/Code+Review+Checklist).

### Guide to Writing Tests

1. Organize Your Test Files
   - Place data `.xml` files in the `src/data` directory.
     - Use a clear naming convention for data files (e.g., `UC_OE_DecisionCorrection.xml`).
   - Place specification `.feature` files in the `src/features` directory.
     - Use a clear naming convention for feature files (e.g., `UC_OE_DecisionCorrection.feature`).
   - Place step definition `.ts` files in the `src/steps` directory.
     - Use a clear naming convention for step definition files (e.g., `UC_OE_DecisionCorrectionSteps.ts`).
   - Use the `src/utils` directory for reusable utilities and helpers.
2. Writing Gherkin Feature Files
   - Use the `.feature` extension for Gherkin files.
   - Follow the structure: Feature, Background, and Scenario.
   - Use tags (@tag) to categorize and filter scenarios based on MA's.
   - Write clear and concise steps using Given, When, and Then.
   - Example:
    ```gherkin
    @UC_OE_DecisionCorrection
    Feature: UC_OE_DecisionCorrection
      The OE app allows correcting executed decisions and shifting to an alternative branch.
    
      Background:
        Given the user "101" logged in into the Order Execution
        And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    
      @UC_OE_DecisionCorrection_-_(G)_Correct_decision
      Scenario: Correct decision
        Given an ESP created for "EQ1" and "PU1" with file "UC_OE_DecisionCorrection.xml"
        When the decision "DEC1" is executed with "DESC1"
        Then the "ATT1" from "CBF1" is voided
    ```

3. Writing Step Definitions
   - Use the `src/steps` directory for step definitions.
   - Use descriptive names for step definition files.
   - Use Given, When, and Then from @cucumber/cucumber.
   - Use Playwright for browser interactions.
   - Write reusable and modular step definitions.
   - Use meaningful variable names in step parameters.
   - Example:
   ```javascript
    import { Given, When, Then } from '@cucumber/cucumber';
    import { expect } from '@playwright/test';
    import { pageFixture } from '../utils/pageFixture';
    
    Given('an ESP created for {string} and {string} with file {string}', async function (equipment, pu, fileName) {
      this.parameters.orderId = await createSimulationMO(pageFixture.page.context(), equipment, fileName);
      const orderElement = pageFixture.page.getByTestId(this.parameters.orderId);
      await orderElement.waitFor();
      await orderElement.click();
    });
   
    When('the decision {string} is executed with {string}', async function (decision: string, decisionValue: string) {
      const execButton = pageFixture.page.locator('button.p-togglebutton', { hasText: 'Executable' });
      await execButton.waitFor();
      await execButton.click();
    
      const decisionElement = pageFixture.page.locator('.list-item', { hasText: decision });
      await decisionElement.waitFor();
      await decisionElement.click();
    
      const branch = pageFixture.page.locator('.radio', { hasText: decisionValue });
      await branch.waitFor();
      await branch.click();
    
      const submitButton = pageFixture.page.locator('button[type="submit"]');
      await submitButton.click();
    });
   
    Then('the {string} from {string} is voided', async function (activity: string, cbf: string) {
      const voidedItem = pageFixture.page.locator('.list-item__content--VOIDED', { hasText: cbf });
      await voidedItem.waitFor();
      await voidedItem.click();

      const voidedActivity = voidedItem.locator('.list-item__content-main--VOIDED', { hasText: activity });
      await voidedActivity.waitFor();
      await voidedActivity.click();

      await expect(voidedActivity).toBeVisible();
    });
    ```
   
4. Writing Utility Functions
   - Keep Scenarios Atomic: Each scenario should test one specific behavior.
   - Avoid Hardcoding: Use variables in steps to make them reusable.
   - Use Assertions: Validate expected outcomes using Playwright's expect.
   - Follow Naming Conventions: Use descriptive names for features, scenarios, and steps.

5. Debugging and Logging
   - Use Playwright's page.screenshot() and console.log() for debugging.
   - Capture screenshots or logs on test failures for better traceability.

6. Running Tests
   - Use npm scripts to run tests locally.
   - Use the command `npm run test` to execute all tests.
   - Use the command `npm run test -- --tags @UC_OE_DecisionCorrection` to run specific tests based on tags.

7. Error Handling
   - Use try-catch blocks for critical steps.
   - Add meaningful error messages for failed assertions.

8. Reusable Utilities
   - Create helper functions in the `src/utils` directory for common actions (e.g., login, navigation).
   - Example Utility:
   ```javascript
        export async function loginUser(userId: string) {
        const loginField = pageFixture.page.locator('#userId');
        await loginField.fill(userId);
        const submitButton = pageFixture.page.locator('button[type="submit"]');
        await submitButton.click();
    }
    ``` 
9. Prerequisites
- These are conditions that must be met for the test instructions to be executed. If this is not part of what must be shown according to the MA, but is only a basic condition for executing the test steps afterwards, it can be shown in a separate “Prerequisites” area.


```gherkin
@UC_OE_EQ_Deallocate
Feature: An EQ is deallocated from an order.

    Prerequisites:
      An ESP order created for equiment "BC2000N01" and production unit "BLEND01"
      An Equipment Check BF "BFEQCH1" with Implicit allocation set as true and "BCONT2000" as Equipment item
      Followed by Equipment Check BF "BFEQCH2" with "BCONT2000" as Equipment item

    Background:
      Given the user "101" logged in into the Order Execution
      And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
      And State diagram "Cleaning after usage" has status "Not cleaned major" as initial state
      And transition "Allocating" from status "Not cleaned major" to "Allocated" with trigger "Allocation by BF"
      And transition "Deallocating Minor" from status "Allocated" to "Not cleaned minor" with trigger "SFO aborted"
      And an "ESP" order "VT000142" created for equipment "BC2000N01" and production unit "BLEND01"
```


10. Non-visible creation
- Sometimes we have to perform actions for our tests that are on dialogs or views that we cannot currently test. In this case, however, what happens must still be documented in the test. In this case, the pblic API can be used for the prerequisites or, where this is not possible, an SQL script. For steps that are in test processing, only the external API may be used.
However, it must be clearly recognizable how the data was created.

```gherkin
@UC_OE_EQ_Deallocate
Feature: An EQ is deallocated from an order.

    Prerequisites:
      An ESP order created for equiment "BC2000N01" and production unit "BLEND01" create by sql script
      
    Background:
      Given State diagram "Cleaning after usage" has status "Not cleaned major" as initial state greate by public API
      And transition "Allocating" from status "Not cleaned major" to "Allocated" with trigger "Allocation by BF" greate by public API

 ```
- To prove that the external API is being used, we need to create a log file that is stored together with videos and movies. Here is stored which command was sent to the API at what time (date/time) and also the response of the API and the corresponding time (date/time)
- Note: If possible, the public Api should be used instead of an SQL script. This sorts in the maintenance that significantly less effort must be made when it comes to changing the table structure in the product.
What is supported by the API can be found at https://bitbucket.werum.net/projects/PUT/repos/com.werum.pasx.api.documentation/browse/specification/src/main/resources/pasx-api.yaml#558-564[public API]

## Writing MAs
MAs represent a certain behavior used in PAS-X that can be used to map something. However, such a behavior is not exactly a test. A behavior consists of features and scenarios.

the difference is well explained in a article from automationpanda
[quote, In BDD What Should Be A Feature, https://automationpanda.com/2017/10/19/in-bdd-what-should-be-a-feature/]
____
* A behavior is an operation with inputs, actions, and expected outcomes.
* A scenario is the specification of a behavior using formal steps and examples.
* A feature is a desired product functionality often involving multiple behaviors.

____

If you follow this, an MA should be written in such a way that several scenarios can be tested independently of each other. But you should also try to write an MA that only represents one behavior at a time and not try to combine everything into one MA.

Important:
A change to an MA, or making an MA more accurate, should always result in a task existing to check that the previous associated tests still cover the MA

11. Wording of teststeps
    For better readability, test steps should be written in a standardised way to ensure better reusability and to make it easier to search for a suitable step.
    Here we recommend subject verb(in the present tense) object.

As an example:

Use
```gherkin
the order review is locked manually
```
instead of
  ```gherkin
perform manual lock on the order review
```

## Collaboration between testers and developers
There are cases where testers will be able to create the test steps on their own, but for more complex topics there will always be collaboration between testers and developers. Here it is really important that they work together. Creating tests is a living step.  The testers are responsible for ensuring that the MA is fulfilled with their test steps and the developers make sure that the quality and feasibility of the tests is also ensured with the tests. For this reason, things that are the responsibility of others should not be changed without discussion and agreement.   
If possible, the tester should change things in the Feature Files and the developer should change things in the steps.

## Project Structure

```
.
├── src
│   ├── features
│   ├── steps
│   └── utils
.
```

- `features`: contains tests specification files.

- `steps`: contains step definitions for the tests.

- `utils`: contains utility functions and helpers for the tests.

## Code Documentation

In order to ensure the maintainability of our code base, we highly encourage code documentation.
Always assume that you might come back to the block of code that you're writing only after a few years later. Please be kind to future you and others.
To be consistent in our code documentation, [TSDoc](https://tsdoc.org/) specification should be followed.
If you do not know the specification well, please check out the TSDoc specification, it is very similar to JSDoc and ESlint plugin is in place to support you.

## Testing

The `e2e-test` workflow in the `.github/workflows/e2e-test.yaml` file is designed to automate the end-to-end (e2e) testing process for the project. Here's a step-by-step explanation of how it works:

1. **Spin up FAT SUT Cluster**:
  - Runs a Gradle command to start the System Under Test (SUT) and deploy the FAT suite.

2. **Load Test Data**:
  - Runs a Gradle command to publish RabbitMQ messages, which are used as test data.

3. **Run e2e FAT Tests**:
  - Executes the e2e tests using a npm script.

4. **Archive Test Artifacts**:
  - Archives various test artifacts (JSON test report, Cucumber report, test screenshots, and test videos) using the `actions/upload-artifact@v4` action. These artifacts are archived regardless of whether the tests succeed or fail.

The `./ci/sut` folder contains scripts and configurations related to setting up and managing the System Under Test (SUT). This includes:
- Scripts to start and stop the SUT.
- Configuration files for the SUT environment.
- Any other necessary resources to ensure the SUT is correctly set up for testing.

Running the e2e tests locally requires the following steps:

1. **Start the SUT**:
```bash
  ./gradlew startSUT deploySuite-fat-suite publishRabbitmqMessages --info
```

2. **Run the e2e tests**:
```bash
  npm run test
```

3. **Stop the SUT**:
```bash
  ./gradlew stopSUT
```

To have data to test, you need to grab rabbitmq events using `./ci/sut/get-rabbitmq-events.sh` script.
```bash
  ./ci/sut/get-rabbitmq-events.sh <queue-name> <output-file>
```
Once the file is generated, you can use it as input for the tests. Just organize `./ci/sut/loadTestData/rabbitmq-events` folder.

Regarding the e2e tests, the project uses [Playwright](https://playwright.dev/) and the tests are written in Gherkin syntax.

## Summary of the reviews from the SOP

It is very important to ensure that reviews of a test implementation (ts file) are not allowed before a review of a test definition (feature file) has taken place. Either they may be reviewed simultaneously by a single person or the test definition (feature file) may be reviewed first and then the test implementation (ts file).

When the entire implementation is completed, an aprovel review must be carried out before the creation can be finalised.

---

If you still have any doubts regarding contributing to Order Execution FAT, please contact the [Maintainers](./README.md#maintainers).

---

Order Execution WebUI™
