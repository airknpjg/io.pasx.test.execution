import io.pasx.build.common.tasks.BuildDockerImageTask
import io.pasx.build.plugins.sut.tasks.DeploySuitesServicesTask
import io.pasx.build.plugins.sut.tasks.StartClusterTask

plugins {
    id("node-conventions")
    alias(libs.plugins.io.pasx.build.plugins.sut)
    base
}


testing {
    suites {
        create<JvmTestSuite>("e2eTest") {
            targets {
                all {
                    testTask.configure {
                        onlyIf { false }
                    }
                }
            }
        }
    }
}

val jfrogUsername =
    System.getenv("JFROG_USERNAME") ?: providers.gradleProperty("jfrog.username").getOrElse("")
val jfrogPassword =
    System.getenv("JFROG_PASSWORD") ?: providers.gradleProperty("jfrog.token").getOrElse("")


sut {
    cluster {
        namespace = "fat"
    }

    registry {
        server = "pasxregistry.jfrog.io"
        username = jfrogUsername
        password = jfrogPassword
    }

    suites {
        register("fat-suite") {
            auxServices {
                rabbitMQ {
                    enabled = true
                    enabledPlugins = listOf("rabbitmq_stomp", "rabbitmq_management")
                }
                postgres {
                    enabled = false
                }
            }
            manifests {
                register("postgresDB") {
                    file = project.layout.projectDirectory.file("sut/central/postgres.yaml")
                    order = 0
                }
                register("centralDatabaseInstaller") {
                    file =
                        project.layout.projectDirectory.file("sut/central/central-database-installer.yaml")
                    order = 1
                    timeout = 15
                }
                // central test-db-installer removed; add again if needed
                register("executionDatabaseInstaller") {
                    file =
                        project.layout.projectDirectory.file("sut/execution/execution-database-installer.yaml")
                    order = 3
                }
                register("equipmentDatabaseInstaller") {
                    file =
                        project.layout.projectDirectory.file("sut/equipment/equipment-database-installer.yaml")
                    order = 4
                }
                register("orderreviewDatabaseInstaller") {
                    file =
                        project.layout.projectDirectory.file("sut/orderreview/orderreview-database-installer.yaml")
                    order = 5
                }
                register("wmsDatabaseInstaller") {
                    file =
                        project.layout.projectDirectory.file("sut/wms/wms-database-installer.yaml")
                    order = 6
                }
                register("centralService") {
                    file =
                        project.layout.projectDirectory.file("sut/central/central-service.yaml")
                    order = 7
                    timeout = 10
                }
                register("executionService") {
                    file =
                        project.layout.projectDirectory.file("sut/execution/execution-service.yaml")
                    order = 8
                    timeout = 15
                }
                register("equipmentService") {
                    file =
                        project.layout.projectDirectory.file("sut/equipment/equipment-service.yaml")
                    order = 9
                    timeout = 15
                }
                register("orderexecutionService") {
                    file =
                        project.layout.projectDirectory.file("sut/orderexecution/orderexecution-service.yaml")
                    order = 10
                }
                register("orderreviewService") {
                    file =
                        project.layout.projectDirectory.file("sut/orderreview/orderreview-service.yaml")
                    order = 11
                    timeout = 10
                }
                register("uiaService") {
                    file =
                        project.layout.projectDirectory.file("sut/uia/uia-service.yaml")
                    order = 12
                    timeout = 10
                }
                register("wmsService") {
                    file =
                        project.layout.projectDirectory.file("sut/wms/wms-service.yaml")
                    order = 13
                    timeout = 10
                }
                register("loadDBConfigMap") {
                    file = project.layout.projectDirectory.file("sut/loadTestData/test-data-cm.yaml")
                    order = 14  // Ensure ConfigMap is created before the job
                    timeout = 10
                }
                register("loadTestData") {
                    file =
                        project.layout.projectDirectory.file("sut/loadTestData/load-test-data.yaml")
                    order = 15
                    timeout = 10
                }
            }
        }
    }
}

tasks.withType(StartClusterTask::class.java).configureEach {
    dependsOn(tasks.withType(BuildDockerImageTask::class.java))
}

tasks.register<Exec>("publishRabbitmqMessages") {
    val scriptPath = "$projectDir/sut/loadTestData/publish-rabbitmq-events.sh"

    // Argument for the script: can be either a file or a directory path
    val inputPath = "$projectDir/sut/loadTestData/rabbitmq-events/"

    commandLine("bash", scriptPath, inputPath)

    // Make sure the script has execute permissions before running
    doFirst {
        file(scriptPath).setExecutable(true)
    }
}


val setupAntora = tasks.register("setupAntora") {
    val testReportDir = file("app/build/test-report")
    doLast {
        exec {
            workingDir = testReportDir
            commandLine("git", "init")
        }
        exec {
            workingDir = testReportDir
            commandLine("git", "add", "-A")
        }
        exec {
            workingDir = testReportDir
            commandLine("git", "commit", "-m", "\"Initial creation of test report\"")
        }
        exec {
            workingDir = testReportDir
            commandLine("sh", "-c", "echo '{}' > package.json")
        }
        exec {
            workingDir = testReportDir
            commandLine("npm", "i", "-D", "-E", "antora", "@antora/lunr-extension")
        }
    }
}

val buildReportSite = tasks.register<Exec>("buildReportSite") {
    workingDir = project.file("app/build/test-report")
    executable = "npx"
    commandLine(
        "npx",
        "antora",
        "antora-playbook.yml"
    )
    standardOutput = System.out
//    dependsOn(setupAntora)
}
