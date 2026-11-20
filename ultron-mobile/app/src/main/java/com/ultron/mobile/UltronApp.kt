package com.ultron.mobile

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/** Application entry point; creates the Hilt dependency graph. */
@HiltAndroidApp
class UltronApp : Application()
