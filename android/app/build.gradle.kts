import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val keystoreProperties = Properties()
val localPropsFile = rootProject.file("local.properties")
if (localPropsFile.exists()) {
    keystoreProperties.load(FileInputStream(localPropsFile))
}

android {
    namespace = "com.parasite.tower"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.parasite.tower"
        minSdk = 24
        targetSdk = 34
        versionCode = 6
        versionName = "1.3.1"
    }

    signingConfigs {
        create("release") {
            storeFile = file("${rootProject.projectDir}/parasite-tower.jks")
            storePassword = keystoreProperties.getProperty("KEYSTORE_PASSWORD", System.getenv("KEYSTORE_PASSWORD") ?: "")
            keyAlias = keystoreProperties.getProperty("KEY_ALIAS", System.getenv("KEY_ALIAS") ?: "parasite-tower")
            keyPassword = keystoreProperties.getProperty("KEY_PASSWORD", System.getenv("KEY_PASSWORD") ?: "")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }
}

android.applicationVariants.all {
    val variant = this
    variant.outputs.all {
        val output = this as com.android.build.gradle.internal.api.BaseVariantOutputImpl
        if (variant.buildType.name == "release") {
            output.outputFileName = "parasite-tower-release.apk"
        }
    }
}

val generateVersionJs by tasks.registering {
    val versionName = android.defaultConfig.versionName
    val versionCode = android.defaultConfig.versionCode
    val apiBase = (project.findProperty("PT_API_BASE") as String?)
        ?: System.getenv("PT_API_BASE")
        ?: "http://10.0.2.2:8080"
    val outFile = file("src/main/assets/version.js")
    inputs.property("versionName", versionName)
    inputs.property("versionCode", versionCode)
    inputs.property("apiBase", apiBase)
    outputs.file(outFile)
    doLast {
        outFile.parentFile.mkdirs()
        outFile.writeText(
            "window.PT_VERSION='v${versionName}';window.PT_VERSION_CODE=${versionCode};\n" +
            "window.PT_API_BASE='${apiBase}';\n" +
            "(function(){function _apply(){var el=document.querySelector('.ss-foot-ver');if(el)el.textContent=window.PT_VERSION;}\n" +
            "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_apply);else _apply();})();\n"
        )
    }
}

tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(generateVersionJs) }

val checkChangelogVersion by tasks.registering {
    val versionName = android.defaultConfig.versionName
    val changelog = file("${rootProject.projectDir}/../CHANGELOG.md")
    inputs.property("versionName", versionName)
    inputs.file(changelog)
    doLast {
        if (!changelog.exists()) throw GradleException("CHANGELOG.md not found at ${changelog.absolutePath}")
        val re = Regex("""^##\s*\[(\d+\.\d+\.\d+)\]""", RegexOption.MULTILINE)
        val top = re.find(changelog.readText())?.groupValues?.get(1)
            ?: throw GradleException("CHANGELOG.md: no '## [x.y.z]' header found")
        if (top != versionName) {
            throw GradleException(
                "Version mismatch: build.gradle.kts versionName=$versionName but CHANGELOG.md top entry=[$top]. " +
                "Update one of them so they match before building."
            )
        }
    }
}

tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(checkChangelogVersion) }

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.webkit:webkit:1.8.0")
}
