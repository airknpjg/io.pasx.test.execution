dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("../gradle/libs.versions.toml"))
        }
    }
    repositoriesMode = RepositoriesMode.PREFER_SETTINGS
    repositories {
        mavenLocal()
        maven {
            url = uri("https://pasxregistry.jfrog.io/artifactory/pvd-maven/")
            name = "pvd-maven"
            credentials {
                username = System.getenv("JFROG_USERNAME") ?: providers.gradleProperty("jfrog.username").getOrElse("")
                password = System.getenv("JFROG_PASSWORD") ?: providers.gradleProperty("jfrog.token").getOrElse("")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
