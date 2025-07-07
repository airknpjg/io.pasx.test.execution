package io.pasx.test.report.model

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class Step(
    val result: Result,
    val line: Int = 0,
    val name: String = "",
    val match: Match = Match(emptyList(), ""),
    val keyword: String
)

data class Result(
    val duration: Long?,
    val status: String
)

data class Match(
    val arguments: List<Argument> = emptyList(),
    val location: String = ""
)

data class Argument(
    @JsonProperty("val") val value: String,
    val offset: Int
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class Scenario(
    val start_timestamp: String = "",
    val line: Int = 0,
    val name: String = "",
    val description: String = "",
    val id: String = "",
    val type: String = "",
    val keyword: String = "",
    val steps: List<Step> = emptyList(),
    val tags: List<Tag> = emptyList(),
    var videoLink: String = "",
    var screenshotLinks: List<String> = emptyList()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class Tag(
    val name: String
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class Feature(
    val line: Int,
    val elements: List<Scenario>,
    val name: String,
    val description: String,
    val id: String,
    val keyword: String,
    val uri: String,
    val tags: List<Tag>
)