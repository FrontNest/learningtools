package com.example.speedmonitor
import android.content.Context
import android.location.LocationManager
import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

// CameraX imports
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.core.CameraSelector
import androidx.camera.video.VideoCapture
import androidx.camera.video.Recording
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.MediaStoreOutputOptions

import android.database.sqlite.SQLiteDatabase
// Road adatosztály a lekérdezéshez
data class Road(
    val name: String?,
    val highway: String?,
    val maxspeed: String?,
    val lon: Double,
    val lat: Double
)

// Adatbázis másolása assets-ből, ha még nincs a belső storage-ban
fun copyDatabaseIfNeeded(context: Context, dbName: String) {
    val dbPath = context.getDatabasePath(dbName)
    if (!dbPath.exists()) {
        dbPath.parentFile?.mkdirs()
        context.assets.open(dbName).use { input ->
            dbPath.outputStream().use { output ->
                input.copyTo(output)
            }
        }
    }
}

// Legközelebbi útszakasz lekérdezése
fun getNearestRoad(lat: Double, lon: Double, db: SQLiteDatabase): Road? {
    val sql = """
        SELECT name, highway, maxspeed, lon, lat,
        ((lat-?) * (lat-?) + (lon-?) * (lon-?)) AS dist
        FROM roads
        WHERE lat IS NOT NULL AND lon IS NOT NULL
        ORDER BY dist ASC
        LIMIT 1
    """.trimIndent()
    val cursor = db.rawQuery(sql, arrayOf(lat, lat, lon, lon).map { it.toString() }.toTypedArray())
    val road = if (cursor.moveToFirst()) {
        Road(
            name = cursor.getString(0),
            highway = cursor.getString(1),
            maxspeed = cursor.getString(2),
            lon = cursor.getDouble(3),
            lat = cursor.getDouble(4)
        )
    } else null
    cursor.close()
    return road
}

// Magyar KRESZ szerinti sebességhatár fallback logika
fun getDefaultMaxspeed(highway: String?): Int {
    return when (highway) {
        "motorway" -> 130
        "trunk" -> 110
        "primary", "secondary" -> 90
        "residential" -> 50
        "living_street" -> 20
        else -> 50 // általános alapértelmezett
    }
}

class MainActivity : AppCompatActivity() {

    private var isRecording = false
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private lateinit var previewView: androidx.camera.view.PreviewView
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var tvTime: TextView
    private lateinit var tvSpeed: TextView
    private lateinit var tvAddress: TextView
    private lateinit var tvVideoStatus: TextView
    private lateinit var tvMaxspeed: TextView
    private lateinit var tvOsmLicense: TextView
    private lateinit var tvAppLicense: TextView
    private val client = OkHttpClient()
    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    private var roadsDb: SQLiteDatabase? = null
 
    companion object {
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        tvTime = findViewById(R.id.tvTime)
        tvSpeed = findViewById(R.id.tvSpeed)
        tvAddress = findViewById(R.id.tvAddress)
        tvVideoStatus = findViewById(R.id.tvVideoStatus)
        tvMaxspeed = findViewById(R.id.tvMaxspeed)
        tvOsmLicense = findViewById(R.id.tvOsmLicense)
        tvAppLicense = findViewById(R.id.tvAppLicense)
        previewView = findViewById(R.id.previewView)
        previewView.keepScreenOn = true
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        startClock()
        requestLocationPermissionFirst()
        // Keep screen on while app is running
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Adatbázis másolása és megnyitása
        copyDatabaseIfNeeded(this, "roads.sqlite")
        roadsDb = SQLiteDatabase.openDatabase(
            getDatabasePath("roads.sqlite").absolutePath,
            null,
            SQLiteDatabase.OPEN_READONLY
        )
    }

    // Új permission flow: először location, majd kamera, majd audio
    private fun requestLocationPermissionFirst() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startLocationUpdates()
            requestCameraPermission()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                LOCATION_PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun requestCameraPermission() {
        android.util.Log.d("CameraX", "requestCameraPermission called")
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startCameraPreviewAndThenAudio()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.CAMERA),
                2002
            )
        }
    }

    private fun startCameraPreviewAndThenAudio() {
        startCameraPreview {
            requestAudioPermission()
        }
    }

    private fun startCameraPreview(onPreviewStarted: (() -> Unit)? = null) {
        android.util.Log.d("CameraX", "startCameraPreview called")
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                android.util.Log.d("CameraX", "cameraProvider.get() succeeded")
                val preview = androidx.camera.core.Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                // Csak preview use case bindolása (ha még nincs video)
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview
                )
                android.util.Log.d("CameraX", "Camera preview started successfully")
                onPreviewStarted?.invoke()
            } catch (exc: Exception) {
                android.util.Log.e("CameraX", "Camera preview failed: ${exc.message}", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startCameraPreviewAndVideo(onPreviewAndVideoStarted: (() -> Unit)? = null) {
        android.util.Log.d("CameraX", "startCameraPreviewAndVideo called")
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                android.util.Log.d("CameraX", "cameraProvider.get() succeeded (preview+video)")
                val preview = androidx.camera.core.Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                val recorder = Recorder.Builder()
                    .setQualitySelector(QualitySelector.from(Quality.HD))
                    .build()
                videoCapture = VideoCapture.withOutput(recorder)
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    videoCapture
                )
                android.util.Log.d("CameraX", "Camera preview+video started successfully")
                onPreviewAndVideoStarted?.invoke()
            } catch (exc: Exception) {
                android.util.Log.e("CameraX", "Camera preview+video failed: ${exc.message}", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun requestAudioPermission() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startVideoRecording()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                2003
            )
        }
    }


    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            LOCATION_PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startLocationUpdates()
                    requestCameraPermission()
                } else {
                    // Ha "Don't ask again"-t választott, Settings-be irányítjuk
                    if (!ActivityCompat.shouldShowRequestPermissionRationale(
                            this,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        )
                    ) {
                        android.app.AlertDialog.Builder(this)
                            .setTitle("Helyhozzáférés szükséges")
                            .setMessage("Ez az alkalmazás csak helyhozzáféréssel működik. Engedélyezd a helyadatokat a Beállításokban!")
                            .setPositiveButton("Beállítások") { _, _ ->
                                val intent = android.content.Intent(
                                    android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                                )
                                intent.data = android.net.Uri.fromParts("package", packageName, null)
                                startActivity(intent)
                            }
                            .setNegativeButton("Kilépés") { _, _ -> finish() }
                            .setCancelable(false)
                            .show()
                    } else {
                        android.app.AlertDialog.Builder(this)
                            .setTitle("Helyhozzáférés szükséges")
                            .setMessage("Ez az alkalmazás csak helyhozzáféréssel működik. Kérlek, engedélyezd a helyadatokat!")
                            .setPositiveButton("OK") { _, _ -> requestLocationPermissionFirst() }
                            .setNegativeButton("Kilépés") { _, _ -> finish() }
                            .setCancelable(false)
                            .show()
                    }
                }
            }
            2002 -> { // Camera
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startCameraPreviewAndThenAudio()
                } else {
                    android.app.AlertDialog.Builder(this)
                        .setTitle("Kamera engedély szükséges")
                        .setMessage("A kamera engedélyezése nélkül nem tudod használni az alkalmazást.")
                        .setPositiveButton("OK") { _, _ -> requestCameraPermission() }
                        .setNegativeButton("Kilépés") { _, _ -> finish() }
                        .setCancelable(false)
                        .show()
                }
            }
            2003 -> { // Audio
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startVideoRecording()
                } else {
                    android.app.AlertDialog.Builder(this)
                        .setTitle("Hang engedély szükséges")
                        .setMessage("A hang engedélyezése nélkül nem tudod használni az alkalmazást.")
                        .setPositiveButton("OK") { _, _ -> requestAudioPermission() }
                        .setNegativeButton("Kilépés") { _, _ -> finish() }
                        .setCancelable(false)
                        .show()
                }
            }
        }
    }


    private fun startClock() {
        coroutineScope.launch {
            while (true) {
                val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
                tvTime.text = sdf.format(Date())
                delay(1000)
            }
        }
    }

    private fun startLocationUpdates() {
        // Check if location services are enabled
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        if (!isGpsEnabled && !isNetworkEnabled) {
            tvAddress.text = "Helyszolgáltatások ki vannak kapcsolva!"
            return
        }
        val locationRequest = LocationRequest.create().apply {
            interval = 2000
            fastestInterval = 1000
            priority = Priority.PRIORITY_HIGH_ACCURACY
        }
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                val location = locationResult.lastLocation ?: return
                updateSpeed(location)
                // updateRoadName(location) -- ezt most az OSM-ből jövő név helyett az adatbázis alapján írjuk ki

                // Legközelebbi útszakasz lekérdezése
                val db = roadsDb
                if (db != null) {
                    val road = getNearestRoad(location.latitude, location.longitude, db)
                    if (road != null) {
                        // Maxspeed fallback logika
                        val maxspeedValue = road.maxspeed?.toIntOrNull()
                            ?: getDefaultMaxspeed(road.highway)
                        lastMaxspeed = maxspeedValue
                        val maxspeedText = if (road.maxspeed.isNullOrBlank()) {
                            "Sebességhatár (KRESZ): $maxspeedValue"
                        } else {
                            "Sebességhatár: $maxspeedValue"
                        }
                        tvAddress.text = road.name ?: "(nincs utcanév)"
                        tvMaxspeed.text = maxspeedText
                    } else {
                        lastMaxspeed = null
                        tvAddress.text = "Nincs találat az adatbázisban."
                    }
                } else {
                    lastMaxspeed = null
                    tvAddress.text = "Adatbázis nem elérhető."
                }
            }
        }
        val fineGranted = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!fineGranted) {
            tvAddress.text = "Hely engedély szükséges!"
            return
        }
        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            tvAddress.text = "Hely engedély hiba!"
        }
    }

    private var lastMaxspeed: Int? = null

    private fun updateSpeed(location: Location) {
        val speedKmh = location.speed * 3.6
        tvSpeed.text = "%.0f".format(speedKmh)

        // A legutóbbi maxspeed-et használjuk, ha van
        val maxspeed = lastMaxspeed
        if (maxspeed != null) {
            if (speedKmh >= maxspeed) {
                // Piros árnyék, vastagabb szöveg
                tvSpeed.setShadowLayer(6f, 0f, 0f, 0xFFFF0000.toInt())
                tvSpeed.setTextColor(0xFFFF0000.toInt())
            } else {
                // Normál árnyék, zöld szín
                tvSpeed.setShadowLayer(6f, 0f, 0f, 0xFF000000.toInt())
                tvSpeed.setTextColor(0xFF22FF00.toInt())
            }
        } else {
            // Ha nincs maxspeed, alap szín
            tvSpeed.setShadowLayer(6f, 0f, 0f, 0xFF000000.toInt())
            tvSpeed.setTextColor(0xFF767668.toInt())
        }

        // A videó státusz mindig látható, amíg a felvétel tart
        if (isRecording) {
            tvVideoStatus.text = "🔴 RECORDING"
        }
    }

    private fun startVideoRecording() {
        if (isRecording) return
        isRecording = true
        tvVideoStatus.text = "🔴 RECORDING"
        startCameraPreviewAndVideo {
            val name = "SPeedMonitorDascam_${System.currentTimeMillis()}.mp4"
            val contentValues = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, name)
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
                put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, "DCIM/Camera")
            }
            val outputOptions = MediaStoreOutputOptions.Builder(
                contentResolver,
                android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            )
                .setContentValues(contentValues)
                .build()
            val recordingPre = videoCapture?.output
                ?.prepareRecording(this, outputOptions)
            // withAudioEnabled() only if RECORD_AUDIO permission granted
            val hasAudio = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            recording = if (hasAudio) {
                recordingPre?.withAudioEnabled()?.start(ContextCompat.getMainExecutor(this)) { }
            } else {
                recordingPre?.start(ContextCompat.getMainExecutor(this)) { }
            }
        }
    }

    private fun stopVideoRecording() {
        if (!isRecording) return
        isRecording = false
        tvVideoStatus.text = ""
        try {
            recording?.stop()
            recording = null
        } catch (_: Exception) {}
    }

    private fun updateRoadName(location: Location) {
        coroutineScope.launch(Dispatchers.IO) {
            val url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1"
            val request = Request.Builder().url(url).header("User-Agent", "speedMonitorApp/1.0").build()
            val response = client.newCall(request).execute()
            val json = response.body?.string()
            val road = try {
                val obj = JSONObject(json)
                val address = obj.getJSONObject("address")
                address.optString("road", "Ismeretlen út")
            } catch (e: Exception) {
                "Ismeretlen út"
            }
            withContext(Dispatchers.Main) {
                tvAddress.text = road
            }
        }
    }

        override fun onPause() {
            super.onPause()
            stopVideoRecording()
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        coroutineScope.cancel()
        stopVideoRecording()
        // Adatbázis lezárása
        roadsDb?.close()
        // Allow screen to turn off again
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
}
