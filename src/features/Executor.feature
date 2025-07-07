@UC_TST_EXECUTE
Feature: Created to test execution

  Prerequisites:
  o text01
  o text02

#  Background:

  @UC_TST_EXECUTE_-_(G)_test_01
  @TM_UC_TST_EXECUTE-01
  Scenario: Verify something
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    And a counter "Major cleaning" of EQ "EQA_OEEQCheckManTT1" is manually changed to "1"
    #And an "ESP" order created for equipment "EQA_OEEQCheckManT1" and production unit "BLEND01" with file "ESP_TM_UC_OE_EQ_BFCheckMan-02.xml"

  @UC_TST_EXECUTE_-_(G)_test_02
  @TM_UC_TST_EXECUTE-02
  Scenario: Verify something 02
    Given the following equipments are created with file "EQM_TM_UC_OE_BFCheckMan-0T.xml"

  @UC_TST_EXECUTE_-_(G)_test_03
  @TM_UC_TST_EXECUTE-03
  Scenario: Verify something 03
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    And the following equipments are created with file "EQM_TM_UC_OE_BFCheckMan-0T.xml"
      |Equipment         |
      |EQA_OEEQCheckManT5|
      |EQB_OEEQCheckManT5|
    And an "ESP" order created for equipment "EQB_OEEQCheckManT5" and production unit "BLEND01" with file "ESP_TM_UC_OE_EQ_BFCheckMan-06.xml"
    And a BF EQ Check "EQCHK1" is selected in the order execution
    And a equipment "EQB_OEEQCheckManT5" is identified
    And a BF "EQCHK1" is executed
    Then the following information are contained in actual value history
      |Search field|Data               |Value                                      |
      |Actual value|Execution status   |Blocked                                    |
      |Actual value|Actual value       |Equipment does not match required equipment|
      |History     |Execution timestamp|<Current date>                             |
      |History     |Logged in user     |101                                        |

  @UC_TST_EXECUTE_-_(G)_test_04
  @TM_UC_TST_EXECUTE-04
  Scenario: Verify something 04
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    And the following equipments are created with file "EQM_TM_UC_OE_BFCheckMan-M1.zip"
     |Equipment ID       |Equipment type      |
      |EQA_OEEQCheckManT01|EQTA_OEEQCheckManT01|
    And an "ESP" order created for equipment "EQA_OEEQCheckManT01" and production unit "BLEND01" with file "ESP_TM_UC_OE_EQ_BFCheckMan-M1.xml"
    And a BF EQ Check "EQCHK1" is selected in the order execution
    When a equipment "EQA_OEEQCheckManT01" is identified
    Then the following information are contained in actual value history
      |Search field|Data               |Value                                      |
      |Actual value|Execution status   |Blocked                                    |
      |Actual value|Actual value       |Equipment does not match required equipment|
      |History     |Execution timestamp|<Current date>                             |
      |History     |Logged in user     |101                                        |

  @UC_TST_EXECUTE_-_(G)_test_05
  @TM_UC_TST_EXECUTE-05
  Scenario: Verify something 05
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    And the following equipments are created with file "EQM_TM_UC_OE_BFCheckMan-M2.zip"
      |Equipment ID       |Equipment type      |State Diagram      |
      |EQA_OEEQCheckManT25|EQTA_OEEQCheckManT25|SDA_OEEQCheckManT25|
    And the status of EQ "EQA_OEEQCheckManT25" is manually changed by transition "Start major cleaning" for state diagram "SDA_OEEQCheckManT25"
    And the status of EQ "EQA_OEEQCheckManT25" is manually changed by transition "End major cleaning" for state diagram "SDA_OEEQCheckManT25"
    And an "ESP" order created for equipment "EQA_OEEQCheckManT25" and production unit "BLEND01" with file "ESP_TM_UC_OE_EQ_BFCheckMan-M2.xml"
    And a BF EQ Check "EQCHK1" is selected in the order execution
    When a equipment "EQA_OEEQCheckManT25" is identified
    And a BF "EQCHK1" is executed
    Then the following information are contained in actual value history
      |Search field|Data     |Value              |
      |Actual value|Equipment|EQA_OEEQCheckManT25|

  @UC_TST_EXECUTE_-_(G)_test_06
  @TM_UC_TST_EXECUTE-06
  Scenario: Verify something 06
    Given the user "101" logged in into the Order Execution
    And a terminal "AUTOEXEC" which is linked to production unit "BLEND01"
    And the status of EQ "EQA_OEEQCheckManT4" is manually changed by transition "End major cleaning" for state diagram "Cleaning after usage"



