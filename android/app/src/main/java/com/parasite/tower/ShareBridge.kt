package com.parasite.tower

import android.content.Context
import android.content.Intent
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

class ShareBridge(private val ctx: Context) {

    @JavascriptInterface
    fun shareImage(dataUrl: String, text: String?) {
        try {
            val payload = if (dataUrl.startsWith("data:")) dataUrl.substringAfter(",") else dataUrl
            val bytes = Base64.decode(payload, Base64.DEFAULT)
            val dir = File(ctx.cacheDir, "share").apply { mkdirs() }
            // 清理旧文件
            dir.listFiles()?.forEach { f ->
                if (System.currentTimeMillis() - f.lastModified() > 60_000) f.delete()
            }
            val file = File(dir, "poster_${System.currentTimeMillis()}.png")
            FileOutputStream(file).use { it.write(bytes) }

            val authority = "${ctx.packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(ctx, authority, file)

            val send = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                if (!text.isNullOrEmpty()) putExtra(Intent.EXTRA_TEXT, text)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(send, "分享海报").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            ctx.startActivity(chooser)
        } catch (e: Exception) {
            Log.e("PT-SHARE", "shareImage failed: ${e.message}", e)
        }
    }
}
