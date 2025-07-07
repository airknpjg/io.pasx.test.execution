package io.pasx.test.report

fun String.removeInvalidFileNameCharacters(): String {
    return this.replace(Regex("[\\\\/:*?\"<>|]"), "")
}