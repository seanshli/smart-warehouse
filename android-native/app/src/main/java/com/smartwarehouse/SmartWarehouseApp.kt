package com.smartwarehouse

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SmartWarehouseApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize any app-level dependencies here
    }
}
