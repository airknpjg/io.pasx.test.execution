package io.pasx.test.report

import com.fasterxml.jackson.databind.ObjectMapper
import gg.jte.resolve.DirectoryCodeResolver
import org.apache.hc.client5.http.classic.HttpClient
import org.apache.hc.client5.http.impl.DefaultRedirectStrategy
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory
import org.apache.hc.core5.ssl.SSLContexts
import org.apache.hc.core5.ssl.TrustStrategy
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.RestTemplate
import java.io.File
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext


@SpringBootApplication
class App

fun main(args: Array<String>) {
    runApplication<App>(*args)
}

class Init(
    private val traceabilityEntityExtractor: TraceabilityEntityExtractor,
    private val antoraModuleStructureInitializer: AntoraModuleStructureInitializer,
    private val useCaseToAdocReportTransformer: UseCaseToAdocReportTransformer,
    private val overviewToAdocReportTransformer: OverviewToAdocReportTransformer,
    private val navigationGenerator: NavigationGenerator
) : CommandLineRunner {

    companion object {
        private val log = LoggerFactory.getLogger(Init::class.java)
    }

    override fun run(vararg args: String?) {
        val targetDir = File("build/test-report")
        targetDir.mkdirs()
        log.info("Initializing Antora module structure in $targetDir")
        val files = antoraModuleStructureInitializer.initializeModuleSkeleton(targetDir)
        // Create UC test report pages
        val useCases = traceabilityEntityExtractor.extractFromCucumberReport()
        traceabilityEntityExtractor.enrichUseCasesWithPQMData(useCases)
        // Extract the videos and screenshots then add the attachment link to useCases
        antoraModuleStructureInitializer.extractZipFiles(files, useCases)
        // antoraModuleStructureInitializer.normalizeFileNames(files.screenshotsDir)
        // antoraModuleStructureInitializer.normalizeFileNames(files.videosDir)
        navigationGenerator.generateNavigationFromUseCases(useCases, files.moduleRoot)
        useCases.forEach {
            log.info("IT : $it")
            log.info("IT mitigationActions : ${it.mitigationActions}")
            val ucDir = File(files.pagesDir, it.name)
            ucDir.mkdirs()
            val ucTestReportFile = File(ucDir, "index.adoc")
            ucTestReportFile.createNewFile()
            useCaseToAdocReportTransformer.transform(it, ucTestReportFile)
        }
        // Create Overview test report page
        val overviewTestReportFile = File(files.pagesDir, "index.adoc")
        overviewTestReportFile.createNewFile()
        log.info("useCases: $useCases")
        overviewToAdocReportTransformer.transform(useCases, overviewTestReportFile)
    }

}


@Configuration
@EnableConfigurationProperties(PQMDoorProperties::class)
class AppConfiguration(private val pqmDoorProperties: PQMDoorProperties) {

    @Bean
    fun directoryCodeResolver() =
        DirectoryCodeResolver(ClassPathResource("templates").file.toPath())

    @Bean
    fun traceabilityEntityExtractor(
        objectMapper: ObjectMapper,
        pqmDoorsDataEnricher: PQMDoorsDataEnricher
    ) =
        TraceabilityEntityExtractor(objectMapper, pqmDoorsDataEnricher)

    @Bean
    fun antoraModuleStructureInitializer(pqmDoorProperties: PQMDoorProperties) =
        AntoraModuleStructureInitializer(pqmDoorProperties)

    @Bean
    fun pqmDoorsDataEnricher(pqmDoorProperties: PQMDoorProperties, restTemplate: RestTemplate) =
        PQMDoorsDataEnricher(pqmDoorProperties, restTemplate)

    @Bean
    fun useCaseToAdocReportTransformer(
        codeResolver: DirectoryCodeResolver,
        pqmDoorsDataEnricher: PQMDoorsDataEnricher
    ) =
        UseCaseToAdocReportTransformer(codeResolver, pqmDoorsDataEnricher)

    @Bean
    fun overviewToAdocReportTransformer(
        codeResolver: DirectoryCodeResolver,
        pqmDoorProperties: PQMDoorProperties
    ) =
        OverviewToAdocReportTransformer(codeResolver, pqmDoorProperties)

    @Bean
    fun init(
        traceabilityEntityExtractor: TraceabilityEntityExtractor,
        antoraModuleStructureInitializer: AntoraModuleStructureInitializer,
        useCaseToAdocReportTransformer: UseCaseToAdocReportTransformer,
        overviewToAdocReportTransformer: OverviewToAdocReportTransformer,
        navigationGenerator: NavigationGenerator
    ) = Init(
        traceabilityEntityExtractor,
        antoraModuleStructureInitializer,
        useCaseToAdocReportTransformer,
        overviewToAdocReportTransformer,
        navigationGenerator
    )

    @Bean
    fun navigationGenerator(codeResolver: DirectoryCodeResolver) = NavigationGenerator(codeResolver)

    @Bean
    fun restTemplate(): RestTemplate {

        val acceptingTrustStrategy =
            TrustStrategy { _: Array<X509Certificate?>?, _: String? -> true }

        val sslContext: SSLContext =
            SSLContexts.custom()
                .loadTrustMaterial(null, acceptingTrustStrategy)
                .build()


        val httpClient: HttpClient = HttpClientBuilder.create()
            .setConnectionManager(
                PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(SSLConnectionSocketFactory(sslContext))
                    .build()
            )
            .setConnectionManagerShared(true)
            .build()

        val requestFactoryHttp = HttpComponentsClientHttpRequestFactory()
        requestFactoryHttp.httpClient = httpClient
        val restTemplate = RestTemplateBuilder()
            .rootUri(pqmDoorProperties.systemDomain)
            .build()
        restTemplate.requestFactory = requestFactoryHttp
        return restTemplate
    }

}