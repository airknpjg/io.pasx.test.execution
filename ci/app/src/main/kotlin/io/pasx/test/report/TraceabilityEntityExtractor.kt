package io.pasx.test.report

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import io.pasx.test.report.model.Feature
import io.pasx.test.report.model.Scenario
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import kotlin.text.replace

class TraceabilityEntityExtractor(private val mapper: ObjectMapper, private val pqmDoorsDataEnricher: PQMDoorsDataEnricher) {

    companion object {
        private val log = LoggerFactory.getLogger(Init::class.java)
    }

    fun extractFromCucumberReport(): List<UseCase> {
        // will come as a method parameter later
        val sourceFile = ClassPathResource("report.json").file
        val features: List<Feature> = mapper.readValue<List<Feature>>(sourceFile)

        // Build a mapping of UC -> MA(s) -> Scenario
        // Tags on the feature MUST only be Use Cases
        val listOfUseCases = features.flatMap { feature ->
            feature.tags.filter { tag -> tag.name.startsWith("@UC_") }
        }

        val ucToMa = mutableMapOf<String, Map<String, List<Scenario>>>()

        listOfUseCases.forEach { uc ->
            val maToScenario = mutableMapOf<String, List<Scenario>>()
            features.filter { it.tags.contains(uc) }.forEach { feature ->
                feature.elements.forEach { elem ->
                    elem.tags.filterNot { it.name == uc.name }.forEach { ma ->
                        maToScenario.compute(ma.name.removePrefix("@")) { _, v ->
                            v?.plus(elem) ?: mutableListOf(elem)
                        }

                    }
                }
            }
            ucToMa[uc.name.removePrefix("@")] = maToScenario
        }

        return ucToMa.map { entry ->
            UseCase(entry.key, "", "", entry.value.map { maEntry ->
                val results = convertMAStructure(maEntry.key, entry.key)
                log.info("maEntry.key = ${maEntry.key}, entry.key = ${entry.key}, results = $results")
                MitigationAction(maEntry.key, results, "", "", maEntry.value)
            }.toMutableSet())
        }
    }

    private fun convertMAStructure(mitigationAction: String, useCase: String): String {
        // Example ma=UC_PDA_MO_Insert_Data, useCase=UC_PDA_MO
        // Regex has to check that MA starts with useCase_ and capture the description
        val regex = Regex("""${Regex.escape(useCase)}_(.+)""")
        val matchResult = regex.matchEntire(mitigationAction)
        var maName = ""
        if (matchResult != null) {
            val maDescription = matchResult.groupValues[1].replace("_"," ")
            maName = "$useCase - (G) $maDescription"
        }
        return maName
    }

    fun enrichUseCasesWithPQMData(useCases: List<UseCase>) {
        pqmDoorsDataEnricher.enrichData()
        val (mitigationsActionXmlElements, useCasesXmlElements) = pqmDoorsDataEnricher.retrievePQMDoorsData()
        pqmDoorsDataEnricher.mapPQMDoorsDataToReportData(useCasesXmlElements, mitigationsActionXmlElements, useCases)
        log.info("Data enrichment completed.")
    }

}


data class UseCase(val name: String, var description: String, var link: String, val mitigationActions: Set<MitigationAction>)

data class MitigationAction(val tag: String, val name: String, var description: String, var link: String, val scenarios: List<Scenario>)

