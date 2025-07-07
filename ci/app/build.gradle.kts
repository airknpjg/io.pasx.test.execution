plugins {
    alias(libs.plugins.kotlin.jvm)
    kotlin("plugin.spring") version "2.1.20"
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.7"
//    id("org.asciidoctor.jvm.convert") version "3.3.2"
}

extra["springShellVersion"] = "3.3.3"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-json")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.shell:spring-shell-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.apache.httpcomponents.client5:httpclient5")
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml")
    implementation("org.apache.httpcomponents.core5:httpcore5")
    implementation("org.asciidoctor:asciidoctorj:3.0.0") // AsciidoctorJ dependency
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    implementation("gg.jte:jte-kotlin:3.2.0")
    testImplementation(libs.junit.jupiter)
    testImplementation("org.springframework.shell:spring-shell-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.shell:spring-shell-dependencies:${property("springShellVersion")}")
    }
}

springBoot {
//    mainClass.set("io.pasx.test.report.AppKt")
    buildInfo()
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
