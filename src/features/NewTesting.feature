@UC_OE_EQ_BFCheck
Feature: EQ Check BF

  Prerequisites:
  o Equipment 'IBC50N01', 'IBC50N02' is imported
  o State diagram 'Cleaning after usage' is imported


  Background:
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"

  @UC_OE_EQ_BFCheckMan_Allocation
  @TM_UC_TST_EXECUTE-01
  Scenario: Allocation in another context
    Given the status of EQ "IBC50N02" is manually changed by transition "Allocating" for state diagram "Cleaning after usage"
    And an "ESP" order created for equipment "IBC50N02" and production unit "BLEND01" with file "ESPKJCHKALC.xml"
    #Description : ESP has 1 EQ Check BF that set the implicit allocation and state check set to be state list with expected state 'Allocated'
    And a BF EQ Check "EQCHK1" is selected in the order execution
    When a equipment "IBC50N02" is identified
    Then the system shows allocated in another context error message
    And the user is not able to submit the BF



  @UC_OE_EQ_BFCheckMan_Reuse
  @TM_UC_TST_EXECUTE-02
  Scenario: Reuse Equipment
    Given an "ESP" order created for equipment "IBC50N01" and production unit "BLEND01" with file "ESPKJCHKREU.xml"
    And a BF EQ Check "EQCHK1" is selected for "REU1" in the order execution
    And a equipment "IBC50N01" is identified
    And a BF "EQCHK1" is executed
    Then the equipment "IBC50N01" is displayed as set value


  @UC_OE_EQ_BFCheckMan_CTCheck_Warning
  @TM_UC_TST_EXECUTE-03-01
  Scenario: Counter Check Warning 1
    Given a counter definition "Major cleaning" of EQ "IBC50N01" is manually changed to "4"
    And an "ESP" order created for equipment "IBC50N01" and production unit "BLEND01" with file "ESPKJCHKCNT.xml"
    And a BF EQ Check "EQCHK1" is selected for "CNT1" in the order execution
    When a equipment "IBC50N01" is identified
    Then the system shows counter exceeded error message

  @UC_OE_EQ_BFCheckMan_CTCheck_Warning
  @TM_UC_TST_EXECUTE-03-02
  Scenario: Counter Check Warning 2
    Given a counter definition "Major cleaning" of EQ "IBC50N01" is manually changed to "4"
    And an "ESP" order created for equipment "IBC50N01" and production unit "BLEND01" with file "ESPKJCHKCNT.xml"
    And a BF EQ Check "EQCHK1" is selected for "CNT1" in the order execution
    When a equipment "IBC50N01" is identified
    And a BF "EQCHK1" is executed
    Then the exception message is raised and status of BF becomes block
