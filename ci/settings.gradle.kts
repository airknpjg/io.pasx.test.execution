rootProject.name = "io.pasx.webui.orderexecution.fat"

gradle.projectsLoaded {
    rootProject.allprojects {
        group = "io.pasx.webui.orderexecution.fat"
    }
}

pluginManagement {
    repositories {
        mavenLocal()
        maven {
            url = uri("https://pasxregistry.jfrog.io/artifactory/pvd-maven")
            name = "jfrog"
            credentials {
                username = providers.gradleProperty("jfrog.username").getOrElse("undefined")
                password = providers.gradleProperty("jfrog.token").getOrElse("undefined")
            }
        }
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositories {
        mavenLocal()
        mavenCentral()
        maven {
            url = uri("https://pasxregistry.jfrog.io/artifactory/pvd-maven")
            name = "jfrog"
            credentials {
                username = providers.gradleProperty("jfrog.username").getOrElse("undefined")
                password = providers.gradleProperty("jfrog.token").getOrElse("undefined")
            }
        }
    }
}

include("app")