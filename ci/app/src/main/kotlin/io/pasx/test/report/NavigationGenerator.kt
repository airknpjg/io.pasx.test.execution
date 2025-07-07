package io.pasx.test.report

import gg.jte.ContentType
import gg.jte.TemplateEngine
import gg.jte.output.StringOutput
import gg.jte.resolve.DirectoryCodeResolver
import org.asciidoctor.Asciidoctor
import org.asciidoctor.Options
import org.asciidoctor.SafeMode
import java.io.File

/**
 * Generates the nav.adoc file for the antora module displaying the Test Reports
 */
class NavigationGenerator(private val codeResolver: DirectoryCodeResolver) {

    fun generateNavigationFromUseCases(useCases: List<UseCase>, antoraRoot: File) {

        val templateEngine = TemplateEngine.create(codeResolver, ContentType.Plain)
        val output = StringOutput()
        templateEngine.render(
            "nav_adoc.kte",
            mapOf("useCases" to useCases),
            output
        )
        val navigationFile = antoraRoot.resolve("nav.adoc")
        navigationFile.createNewFile()
        navigationFile.writer().use { it.write(output.toString()) }
        generateHtmlFromAdoc(navigationFile)
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