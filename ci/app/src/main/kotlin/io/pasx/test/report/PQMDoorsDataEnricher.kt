package io.pasx.test.report
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.body
import org.springframework.web.util.UriComponentsBuilder
import javax.xml.parsers.DocumentBuilderFactory
import org.w3c.dom.Document
import org.w3c.dom.Element
import org.xml.sax.InputSource
import java.io.StringReader

/**
 * Adds information from Doors to the data model of the [TraceabilityEntityExtractor].
 */
class PQMDoorsDataEnricher(private val pqmDoorProperties: PQMDoorProperties, private val restTemplate: RestTemplate) {

    companion object {
        val logger: Logger = LoggerFactory.getLogger(Init::class.java)
    }

    fun enrichData() {
        val uri = UriComponentsBuilder.fromHttpUrl("${pqmDoorProperties.systemDomain}/qm/j_security_check")
            .queryParam("j_username", pqmDoorProperties.user)
            .queryParam("j_password", pqmDoorProperties.password)
            .build()
            .toUri()
        val authStatus = restTemplate.getForEntity(
            uri,
            String::class.java
        )
        if (authStatus.statusCode.isError) {
            throw RuntimeException("Error during authentication to PQM Doors, got status ${authStatus.statusCode}")
        }
    }

    fun retrievePQMDoorsData(): Pair<List<XmlElements>, List<XmlElements>> {
        val configProjectArea = pqmDoorProperties.projectArea.replace(" ","+")
        val configChildTestPlan = pqmDoorProperties.childTestPlan.replace(" ","+")
        val globalConfig = pqmDoorProperties.globalConfig
        val link = "/qm/service/com.ibm.rqm.integration.service.IIntegrationService/resources/$configProjectArea/testplan?oslc_config.context=$globalConfig&fields=/content/testplan[title=\"$configChildTestPlan\"]/requirementset"
        logger.info("link $link")
        var responseEntity = restTemplate.getForEntity(link, String::class.java)
        var xmlContent = responseEntity.body
    logger.info("XML ${xmlContent.toString()}")
        val maCollectionURI = parseXmlMaCollectionLink(xmlContent.toString()).substringAfterLast("/")
    logger.info("maCollectionURI $maCollectionURI")
    logger.info("Start: Get MA list")
        responseEntity = restTemplate.getForEntity("/rm/publish/text?oslc_config.context=$globalConfig&collectionURI=$maCollectionURI&size=1000", String::class.java)
    logger.info("End: Get MA list")
        xmlContent = responseEntity.body
        val (maXmlElements, useCasesFromMA) = parseMitigationActionXml(xmlContent.toString())
    logger.info("xmlElements for MA list: $maXmlElements")
    logger.info("useCasesFromMA: $useCasesFromMA")

        val joinedURIs = useCasesFromMA.joinToString(",") { it.uri }
        val pqmDoorsUseCasesLink = "/rm/publish/text?resourceURI=$joinedURIs&oslc_config.context=$globalConfig&size=1000&nolinks=true"
    logger.info("pqmDoorsUseCasesLink: $pqmDoorsUseCasesLink")
        logger.info("Start: Get UC list")
        responseEntity = restTemplate.getForEntity(pqmDoorsUseCasesLink, String::class.java)
        logger.info("End: Get UC list")
        xmlContent = responseEntity.body
        val ucXmlElements = parseUseCaseXml(xmlContent.toString())
        logger.info("xmlElements for UC list: $ucXmlElements")
        return Pair(maXmlElements, ucXmlElements)
    }

    fun mapPQMDoorsDataToReportData(ucXmlElements: List<XmlElements>, maXmlElements: List<XmlElements>, useCases: List<UseCase>) {
        for (useCase in useCases) {
            val description = ucXmlElements.find { it.title == useCase.name }?.description
            val link = ucXmlElements.find { it.title == useCase.name }?.link
            useCase.description = description?.trim().toString()
            useCase.link = link.toString()
            logger.info("PQM UC des of ${useCase.name}: ${useCase.description}")
            for (mitigationAction in useCase.mitigationActions) {
                val description = maXmlElements.find { it.title == mitigationAction.name }?.description
                val link = maXmlElements.find { it.title == mitigationAction.name }?.link
                mitigationAction.description = description?.trim().toString()
                mitigationAction.link = link.toString()
                logger.info("PQM MA des of ${mitigationAction.name}: ${mitigationAction.description}")
            }
        }
    }

    private fun parseXmlMaCollectionLink(xmlContent: String): String {
        val factory = DocumentBuilderFactory.newInstance()
        factory.isNamespaceAware = true
        val builder = factory.newDocumentBuilder()
        val document: Document = builder.parse(InputSource(StringReader(xmlContent)))
        document.documentElement.normalize()

        val requirementSet = document.getElementsByTagNameNS("*", "requirementset").item(0) as Element
        val result = requirementSet.getAttribute("href").toString()
        return result
    }

    private fun parseMitigationActionXml(xmlContent: String): Pair<List<XmlElements>, List<UseCasesRelatedToMaCollection>> {
        val factory = DocumentBuilderFactory.newInstance()
        factory.isNamespaceAware = true
        val builder = factory.newDocumentBuilder()
        val document: Document = builder.parse(InputSource(StringReader(xmlContent)))
        document.documentElement.normalize()
        logger.info("xmlContent input: $xmlContent")
        val results = mutableListOf<XmlElements>()
        val nodeList = document.getElementsByTagNameNS("*", "artifact")
    logger.info("number of finding MA ${nodeList.length}")

        val useCasesFromMA = mutableListOf<UseCasesRelatedToMaCollection>()
        for (i in 0 until nodeList.length) {
            val node = nodeList.item(i) as Element
            val title = node.getElementsByTagNameNS("*", "title").item(0)?.textContent ?: ""
            logger.info("Check loop $title")
            val description = node.getElementsByTagNameNS("*", "richTextBody").item(0)?.textContent?.trim() ?: ""
            val aboutNode = node.getElementsByTagNameNS("*", "about").item(0)
            val link = aboutNode?.textContent ?: ""
            results.add(XmlElements(title, link, description))
            // Get use cases links
            val traceability = node.getElementsByTagNameNS("*", "traceability").item(0) as Element
            val linkElement = traceability.getElementsByTagNameNS("*", "Link").item(0) as Element
            val useCaseLink = linkElement.getElementsByTagNameNS("*", "relation").item(0)?.textContent ?: ""
            val contentLink = linkElement.getElementsByTagNameNS("*", "content").item(0) as Element
            val useCaseName = contentLink.getElementsByTagNameNS("*", "title").item(0)?.textContent ?: ""
            useCasesFromMA.add(UseCasesRelatedToMaCollection(useCaseName, useCaseLink.substringAfterLast("/")))
        }
    logger.info("MA size: ${results.size}")
    logger.info("useCasesFromMA size before: ${useCasesFromMA.size}")
        val useCasesFromMitigationAction = useCasesFromMA.toMutableSet()
    logger.info("useCasesFromMA size after: ${useCasesFromMitigationAction.size}")
        return return Pair(results, useCasesFromMitigationAction.toList())
    }

    private fun parseUseCaseXml(xmlContent: String): List<XmlElements> {
        val factory = DocumentBuilderFactory.newInstance()
        factory.isNamespaceAware = true
        val builder = factory.newDocumentBuilder()
        val document: Document = builder.parse(InputSource(StringReader(xmlContent)))
        document.documentElement.normalize()

        val results = mutableListOf<XmlElements>()
        val nodeList = document.getElementsByTagNameNS("*", "artifact")

        for (i in 0 until nodeList.length) {
            val node = nodeList.item(i) as Element
            val title = node.getElementsByTagNameNS("*", "title").item(0)?.textContent ?: ""
            val description = node.getElementsByTagNameNS("*", "richTextBody").item(0)?.textContent?.trim() ?: ""
            val aboutNode = node.getElementsByTagNameNS("*", "about").item(0)
            val link = aboutNode?.textContent ?: ""
            results.add(XmlElements(title, link, description))
        }
        return return results
    }

}

data class XmlElements(val title: String, val link: String, val description: String)

data class UseCasesRelatedToMaCollection(val useCase: String, val uri: String)
