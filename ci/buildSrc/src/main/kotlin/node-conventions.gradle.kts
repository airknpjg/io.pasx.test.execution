plugins {
    id("io.pasx.build.plugins.npm-service")
    `jvm-test-suite`
    //id("io.pasx.build.plugins.i18n")
}

group = "io.pasx.webui.orderexecution"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
        vendor.set(JvmVendorSpec.ADOPTIUM)
    }
}