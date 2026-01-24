package com.example.speedmonitor


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

class MainActivity : AppCompatActivity() {
    private var isRecording = false
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var tvTime: TextView
    private lateinit var tvSpeed: TextView
    private lateinit var tvAddress: TextView
    private lateinit var tvVideoStatus: TextView
    private val client = OkHttpClient()
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        tvTime = findViewById(R.id.tvTime)
        tvSpeed = findViewById(R.id.tvSpeed)
        tvAddress = findViewById(R.id.tvAddress)
        tvVideoStatus = findViewById(R.id.tvVideoStatus)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        requestCameraAndAudioPermissions()
        startClock()
        startLocationUpdates()

    }

    private fun requestCameraAndAudioPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P) {
            permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
        val notGranted = permissions.filter {
            ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (notGranted.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, notGranted.toTypedArray(), 2)
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
        val locationRequest = LocationRequest.create().apply {
            interval = 2000
            fastestInterval = 1000
            priority = Priority.PRIORITY_HIGH_ACCURACY
        }
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                val location = locationResult.lastLocation ?: return
                updateSpeed(location)
                updateRoadName(location)
            }
        }
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1)
            return
        }
        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private fun updateSpeed(location: Location) {
        val speedKmh = location.speed * 3.6
        tvSpeed.text = "%.0f".format(speedKmh)
        // A sebesség értékétől függően állítja be a szöveg színét:
        val color = when {
            speedKmh < 30 -> 0xffebf709.toInt()
            speedKmh < 50 -> 0xfff7a409.toInt()
            speedKmh < 90 -> 0xfff75809.toInt()
            speedKmh < 110 -> 0xfff71109.toInt()
            speedKmh <= 140 -> 0xffff0000.toInt()
            else -> 0xffff0000.toInt()
        }
        tvSpeed.setTextColor(color)

        // Video recording logic
        if (speedKmh > 10 && !isRecording) {
            startVideoRecording()
        } else if (speedKmh <= 10 && isRecording) {
            stopVideoRecording()
        }
    }

    private fun startVideoRecording() {
        if (isRecording) return
        isRecording = true
        tvVideoStatus.text = "Video felvétel aktív"
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.HD))
                .build()
            videoCapture = VideoCapture.withOutput(recorder)
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    videoCapture
                )
                val name = "VID_${System.currentTimeMillis()}.mp4"
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
            } catch (exc: Exception) {
                tvVideoStatus.text = "Videó indítás hiba: ${exc.message}"
            }
        }, ContextCompat.getMainExecutor(this))
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

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        coroutineScope.cancel()
        stopVideoRecording()
    }
}
