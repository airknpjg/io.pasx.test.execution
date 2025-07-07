package io.pasx.test.report

import gg.jte.ContentType
import gg.jte.TemplateEngine
import gg.jte.output.StringOutput
import gg.jte.resolve.DirectoryCodeResolver
import org.slf4j.LoggerFactory
import java.io.File
import org.asciidoctor.Asciidoctor // test
import org.asciidoctor.Options // test
import org.asciidoctor.SafeMode // test

/**
 * Takes a single [UseCase] and transforms it into an AsciiDoc report.
 */
class UseCaseToAdocReportTransformer(
    private val codeResolver: DirectoryCodeResolver,
    pqmDoorsDataEnricher: PQMDoorsDataEnricher
) {

    companion object {
        private val log = LoggerFactory.getLogger(UseCaseToAdocReportTransformer::class.java)
    }

    fun transform(useCase: UseCase, file: File) {

        val templateEngine = TemplateEngine.create(codeResolver, ContentType.Plain)
        val output = StringOutput()
        templateEngine.render(
            "uc_test_report_adoc.kte",
            useCase,
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