package io.pasx.test.report

import gg.jte.ContentType
import gg.jte.TemplateEngine
import gg.jte.output.StringOutput
import gg.jte.resolve.DirectoryCodeResolver
import org.asciidoctor.Asciidoctor
import org.asciidoctor.Options
import org.asciidoctor.SafeMode
import org.slf4j.LoggerFactory
import java.io.File

/**
 * Takes a list of [UseCase] and transforms it into an AsciiDoc report.
 */
class OverviewToAdocReportTransformer(private val codeResolver: DirectoryCodeResolver, private val pqmDoorProperties: PQMDoorProperties) {

    fun transform(useCases: List<UseCase>, file: File) {

        val templateEngine = TemplateEngine.create(codeResolver, ContentType.Plain)
        val output = StringOutput()
        templateEngine.render(
            "overview_test_report_adoc.kte",
            mapOf("useCases" to useCases, "pqmDoorProperties" to pqmDoorProperties),
            output
        )

        file.writer().use { it.write(output.toString()) }
        generateHtmlFromAdoc(file)
    }

    private fun generateHtmlFromAdoc(adocFile: File) {
        val asciidoctor = Asciidoctor.Factory.create()
        val options = Options.builder()
            .backend("html5")
            .safe(SafeMode.UNSAFE)
            .toFile(File(adocFile.parent, adocFile.name.replace(".adoc", ".html")))
            .build()
        asciidoctor.convertFile(adocFile, options)
    }

}