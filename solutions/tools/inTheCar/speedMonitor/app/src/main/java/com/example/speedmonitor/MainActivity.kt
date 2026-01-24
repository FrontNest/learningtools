package com.example.speedmonitor

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var tvTime: TextView
    private lateinit var tvSpeed: TextView
    private lateinit var tvRoad: TextView
    private val client = OkHttpClient()
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        tvTime = findViewById(R.id.tvTime)
        tvSpeed = findViewById(R.id.tvSpeed)
        tvRoad = findViewById(R.id.tvRoad)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        startClock()
        startLocationUpdates()
    }

    private fun startClock() {
        coroutineScope.launch {
            while (true) {
                val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
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
        tvSpeed.text = "Sebesség: %.1f km/h".format(speedKmh)
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
                tvRoad.text = "Út: $road"
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        coroutineScope.cancel()
    }
}
