package io.pasx.test.report

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Description

// see resources/application.properties
@ConfigurationProperties(prefix = "pqm.doors")
data class PQMDoorProperties(
    @get:Description("The user to used to authenticate in PQM DOORS")
    val user: String,
    @get:Description("The password to used to authenticate in PQM DOORS")
    val password: String,
    @get:Description("The project area in PQM DOORS")
    val projectArea: String,
    @get:Description("The child test plan or test specification in PQM DOORS")
    val childTestPlan: String,
    @get:Description("The PAS-X MES version, for which the test report will be generated")
    val reportVersion: String,
    @get:Description("The global config")
    val globalConfig: String,
    @get:Description("The domain link of PQM system")
    val systemDomain: String
)