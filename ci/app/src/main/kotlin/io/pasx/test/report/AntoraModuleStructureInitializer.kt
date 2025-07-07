package io.pasx.test.report

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator
import com.fasterxml.jackson.module.kotlin.KotlinModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.file.Paths
import java.util.*
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

/**
 * Initializes the file and folder structure of the Antora module for the test report static page.
 * Also creates the _nav.adoc_ file
 */
class AntoraModuleStructureInitializer(private val pqmDoorProperties: PQMDoorProperties) {

    /**
    .antora-root-dir
    ├── modules
    │   ├── ROOT
    │   │   ├── images
    │   │   ├──  ├── screenshots
    │   │   ├──  ├── videos
    │   │   ├── pages
    │   │   │   ├── index.adoc <- OverView page
    │   │   │   ├── uc_abc
    │   │   │   │   ├── index.adoc <- lists all the MAs for the UC and presents the test results, also has the screenshots and potentially videos embedded
    │   │   │   ├── uc_abcd
    │   │   │   │   ├── index.adoc <- lists all the MAs for the UC and presents the test results, also has the screenshots and potentially videos embedded
    │   │   ├── nav.doc <- Naviation bar
     */
    fun initializeModuleSkeleton(targetDir: File): Files {
        assert(targetDir.exists()) { "Target directory must exist" }
        assert(targetDir.isDirectory) { "Target directory must be a directory" }
        targetDir.listFiles()?.let { assert(it.isEmpty()) { "Target directory must be empty" } }
        initializeGitDir(targetDir)
        val antoraModuleName = UUID.randomUUID().toString()

        val antoraRoot = File(targetDir, antoraModuleName)
        antoraRoot.mkdir()

        val antoraModuleYaml = antoraRoot.resolve("antora.yml")
        antoraModuleYaml.createNewFile()
        initializeAntoraModuleYaml(antoraModuleYaml)

        val antoraPlaybookYaml = targetDir.resolve("antora-playbook.yml")
        antoraPlaybookYaml.createNewFile()
        initializeAntoraPlaybook(antoraPlaybookYaml, targetDir, antoraModuleName)

        val modulesDir = File(antoraRoot, "modules")
        modulesDir.mkdir()
        val rootDir = File(modulesDir, "ROOT")
        rootDir.mkdir()
        val attachmentsDir = File(rootDir, "images")
        val pagesDir = File(rootDir, "pages")
        attachmentsDir.mkdir()
        pagesDir.mkdir()
        val screenshotsDir = File(attachmentsDir, "screenshots")
        screenshotsDir.mkdir()
        val videosDir = File(attachmentsDir, "videos")
        videosDir.mkdir()
        return Files(pagesDir, screenshotsDir, videosDir, antoraRoot, rootDir)
    }

    private fun initializeGitDir(targetDir: File) {
        val start = ProcessBuilder().directory(targetDir).command("git", "init").start()
        if (start.waitFor() != 0) {
            throw RuntimeException("Git Error")
        }
    }

    private fun initializeAntoraPlaybook(antoraPlaybookYaml: File, targetDir: File, antoraModuleName: String) {
        val antoraPlaybookDescriptor = AntoraPlaybookDescriptor(
            site = AntoraPlaybookSiteDescriptor(
                title = "Quality Report",
                start_page = "fat::index.adoc"
            ),
            content = AntoraPlaybookContentDescriptor(
                sources = listOf(
                    AntoraPlaybookContentSourcesDescriptor(
                        url = "../${targetDir.name}",
                        start_path = antoraModuleName
                    )
                )
            )
        )

        val mapper = ObjectMapper(
            YAMLFactory.builder().configure(YAMLGenerator.Feature.WRITE_DOC_START_MARKER, false)
                .configure(YAMLGenerator.Feature.MINIMIZE_QUOTES, true).build()
        ).apply {
            registerModules(listOf(KotlinModule.Builder().build()))
        }
        mapper.writeValue(antoraPlaybookYaml, antoraPlaybookDescriptor)
    }

    private fun initializeAntoraModuleYaml(antoraModuleYaml: File) {
        val componentVersionDescriptor = AntoraComponentVersionDescriptor(
            title = "Test Report",
            version = pqmDoorProperties.reportVersion,
            name = "fat",
            nav = listOf(
                "modules/ROOT/nav.adoc"
            )
        )

        val mapper = ObjectMapper(
            YAMLFactory.builder().configure(YAMLGenerator.Feature.WRITE_DOC_START_MARKER, false)
                .build()
        ).apply {
            registerModules(listOf(KotlinModule.Builder().build()))
        }
        mapper.writeValue(antoraModuleYaml, componentVersionDescriptor)
    }

    private fun findFileInResources(pattern: String, extension: String = "zip"): File {
        val resourcePath = Paths.get( "src", "main", "resources").toFile()

        val files = resourcePath.listFiles { _, name ->
            name.contains(pattern) && name.endsWith(".$extension") || name == "$pattern.$extension"
        }
        if (files != null) {
            return files.first()
        } else {
            throw RuntimeException("Could not find $pattern")
        }
    }

    private fun extractZipFile(sourceFile: File, targetDir: File): List<String> {
        val buffer = ByteArray(1024)
        val zipInputStream = ZipInputStream(FileInputStream(sourceFile))
        var zipEntry: ZipEntry? = zipInputStream.nextEntry
        val attachmentList: MutableList<String> = mutableListOf()

        while (zipEntry != null) {
            val newFile = File(targetDir, zipEntry.name)
            if (zipEntry.isDirectory) {
                newFile.mkdirs()
            } else {
                newFile.parentFile.mkdirs()
                val fileOutputStream = FileOutputStream(newFile)
                var len: Int
                while (zipInputStream.read(buffer).also { len = it } > 0) {
                    fileOutputStream.write(buffer, 0, len)
                }
                fileOutputStream.close()
                val modifiedPath = newFile.absolutePath.replaceFirst("^.*images".toRegex(), "../../images")
                    .replace("\\", "/")
                attachmentList.add(modifiedPath)
            }
            zipEntry = zipInputStream.nextEntry
        }
        zipInputStream.closeEntry()
        zipInputStream.close()
        return attachmentList
    }

    fun extractZipFiles(targetDir: Files, useCases: List<UseCase>) {
        val videoZipFile = findFileInResources("test-videos")
        val screenshotZipFile = findFileInResources("test-screenshots")
        val videoList = extractZipFile(videoZipFile, targetDir.videosDir)
        addAttachmentLinkToMapping(videoList, useCases)
        val screenshotList = extractZipFile(screenshotZipFile, targetDir.screenshotsDir)
        addAttachmentLinkToMapping(screenshotList, useCases)
    }

    fun normalizeFileNames(dir: File) {
        dir.listFiles()?.filter { it.isFile }
            ?.forEach { file -> file.renameTo(File(file.absolutePath.replace(" ", "-"))) }
        dir.listFiles()?.filter { it.isDirectory }?.forEach { normalizeFileNames(it) }
    }

    private fun addAttachmentLinkToMapping(filesPath: List<String>?, useCases: List<UseCase>) {
        if (filesPath != null) {
            for (filePath in filesPath) {
                val videoRegex = Regex("""\.\./\.\./images/videos/([^/]+)/([^/]+)\.webm""")
                val screenshotRegex = Regex("""\.\./\.\./images/screenshots/([^/]+)/([^/]+)/([^/]+)\.png""")

                val videoMatch = videoRegex.find(filePath)
                val screenshotMatch = screenshotRegex.find(filePath)

                if (videoMatch != null) {
                    val useCaseName = videoMatch.groups[1]?.value
                    val scenarioName = videoMatch.groups[2]?.value

                    useCases.find { it.name == useCaseName }?.mitigationActions?.forEach { mitigationAction ->
                        mitigationAction.scenarios.find { it.name.contains(scenarioName ?: "") }?.let { scenario ->
                            scenario.videoLink = filePath
                        }
                    }
                } else if (screenshotMatch != null) {
                    val useCaseName = screenshotMatch.groups[1]?.value
                    val scenarioName = screenshotMatch.groups[2]?.value
                    val scenarioNameWithDynamic = screenshotMatch.groups[3]?.value
                    // The naming of screenshot is in format "scenarioName - Result status - Dynamic ID.png"
                    // To be analyzed for the method to mapping this with test steps
                    useCases.find { it.name == useCaseName }?.mitigationActions?.forEach { mitigationAction ->
                        mitigationAction.scenarios.find { it.name.contains(scenarioName ?: "") }?.let { scenario ->
                            scenario.screenshotLinks += filePath
                        }
                    }
                } else {
                    println("No match found for file: $filePath")
                }
            }
        }
    }
}

data class Files(
    val pagesDir: File,
    val screenshotsDir: File,
    val videosDir: File,
    val antoraRoot: File,
    val moduleRoot: File
)

data class AntoraComponentVersionDescriptor(
    val name: String,
    val version: String,
    val title: String,
    val nav: List<String>
)

data class AntoraPlaybookDescriptor(
    val site: AntoraPlaybookSiteDescriptor,
    val content: AntoraPlaybookContentDescriptor,
    val ui: AntoraPlaybookUiDescriptor = AntoraPlaybookUiDescriptor(
        bundle = AntoraPlaybookUiBundleDescriptor(
            url = "https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/HEAD/raw/build/ui-bundle.zip?job=bundle-stable",
            snapshot = true
        )
    ),
    val antora: AntoraPlaybookAntoraDescriptor = AntoraPlaybookAntoraDescriptor(
        extensions = listOf(
            mapOf("require" to "@antora/lunr-extension")
        )
    )
)

data class AntoraPlaybookSiteDescriptor(val title: String, val start_page: String)

data class AntoraPlaybookContentDescriptor(val sources: List<AntoraPlaybookContentSourcesDescriptor>)

data class AntoraPlaybookAntoraDescriptor(val extensions: List<Map<String, *>>)

data class AntoraPlaybookContentSourcesDescriptor(val url: String, val start_path: String)

data class AntoraPlaybookUiDescriptor(val bundle: AntoraPlaybookUiBundleDescriptor)

data class AntoraPlaybookUiBundleDescriptor(val url: String, val snapshot: Boolean)