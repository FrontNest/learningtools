import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.animation import FuncAnimation
import numpy as np
import threading
import time
import subprocess
import json
import os
import cv2
from collections import deque
from datetime import datetime
import sys

class MobileSpeedApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mobile Speed Monitor")
        
        # Detect if running on Android/Termux
        self.is_android = self.detect_android()
        
        # Configure for mobile
        if self.is_android:
            self.root.attributes('-zoomed', True)  # Maximize on Android
        else:
            self.root.geometry("400x800")  # Mobile-like dimensions for desktop
            
        self.root.configure(bg='#000000')
        
        # Speed data
        self.speed_history = deque(maxlen=200)
        self.time_history = deque(maxlen=200)
        self.current_speed = 0.0
        self.max_speed = 0.0
        self.gps_available = False
        
        # Recording settings
        self.auto_record_enabled = tk.BooleanVar()
        self.recording_threshold = 5.0
        self.stop_delay = 15
        self.is_recording = False
        self.below_threshold_start = None
        
        # Video recording
        self.video_writer = None
        self.camera = None
        self.recording_file = None
        
        # Monitoring
        self.is_monitoring = False
        
        self.setup_ui()
        self.check_permissions()
        
    def detect_android(self):
        """Detect if running on Android/Termux"""
        return (os.path.exists('/data/data/com.termux') or 
                'ANDROID_ROOT' in os.environ or
                'TERMUX_VERSION' in os.environ)
    
    def check_permissions(self):
        """Check and request necessary permissions"""
        if self.is_android:
            self.check_termux_permissions()
        else:
            # Desktop simulation
            self.gps_available = True
            
    def check_termux_permissions(self):
        """Check Termux:API permissions"""
        try:
            # Test location access
            result = subprocess.run(['which', 'termux-location'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                # Test actual location access
                location_result = subprocess.run(['termux-location'], 
                                               capture_output=True, text=True, timeout=5)
                
                if location_result.returncode == 0:
                    self.gps_available = True
                    self.show_permission_status("GPS: Available", "#00ff00")
                else:
                    self.show_permission_dialog()
            else:
                self.show_termux_api_dialog()
                
        except Exception as e:
            print(f"Permission check error: {e}")
            self.show_permission_dialog()
    
    def show_termux_api_dialog(self):
        """Show dialog for Termux:API installation"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Termux:API Required")
        dialog.geometry("350x200")
        dialog.configure(bg='#2a2a2a')
        
        tk.Label(dialog, 
                text="GPS Access Setup Required",
                font=('Arial', 14, 'bold'),
                fg='#ffffff', bg='#2a2a2a').pack(pady=10)
        
        instructions = """1. Install 'Termux:API' from Google Play Store
2. In Termux, run: pkg install termux-api
3. Restart this app"""
        
        tk.Label(dialog,
                text=instructions,
                font=('Arial', 10),
                fg='#ffffff', bg='#2a2a2a',
                justify=tk.LEFT).pack(pady=10, padx=20)
        
        tk.Button(dialog,
                 text="I've installed Termux:API",
                 command=lambda: [dialog.destroy(), self.check_permissions()],
                 bg='#4CAF50', fg='white').pack(pady=10)
    
    def show_permission_dialog(self):
        """Show permission request dialog"""
        dialog = tk.Toplevel(self.root)
        dialog.title("GPS Permission")
        dialog.geometry("300x150")
        dialog.configure(bg='#2a2a2a')
        
        tk.Label(dialog,
                text="GPS permission is required for speed monitoring",
                font=('Arial', 12),
                fg='#ffffff', bg='#2a2a2a',
                wraplength=250).pack(pady=20)
        
        tk.Button(dialog,
                 text="Grant Permission",
                 command=lambda: [dialog.destroy(), self.request_gps_permission()],
                 bg='#4CAF50', fg='white').pack(pady=10)
    
    def request_gps_permission(self):
        """Request GPS permission"""
        if self.is_android:
            try:
                # This will trigger Android's permission dialog
                result = subprocess.run(['termux-location'], 
                                      capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    self.gps_available = True
                    self.show_permission_status("GPS: Granted", "#00ff00")
                else:
                    self.show_permission_status("GPS: Denied", "#ff0000")
                    
            except subprocess.TimeoutExpired:
                self.show_permission_status("GPS: Timeout", "#ffaa00")
            except Exception as e:
                self.show_permission_status(f"GPS: Error", "#ff0000")
        
    def show_permission_status(self, message, color):
        """Show permission status"""
        if hasattr(self, 'status_label'):
            self.status_label.config(text=message, fg=color)
    
    def setup_ui(self):
        """Setup mobile-optimized UI"""
        # Main container
        main_frame = tk.Frame(self.root, bg='#000000')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Status bar
        status_frame = tk.Frame(main_frame, bg='#1a1a1a', height=40)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(
            status_frame,
            text="GPS: Checking...",
            font=('Arial', 12),
            fg='#ffaa00',
            bg='#1a1a1a'
        )
        self.status_label.pack(side=tk.LEFT, padx=10, pady=10)
        
        # Exit button
        exit_btn = tk.Button(
            status_frame,
            text="✕",
            command=self.exit_app,
            bg='#ff4444',
            fg='white',
            font=('Arial', 14, 'bold'),
            width=3
        )
        exit_btn.pack(side=tk.RIGHT, padx=10, pady=5)
        
        # Large speed display
        speed_frame = tk.Frame(main_frame, bg='#000000')
        speed_frame.pack(fill=tk.X, pady=20)
        
        self.speed_label = tk.Label(
            speed_frame,
            text="0.0",
            font=('Arial', 60, 'bold'),
            fg='#00ff00',
            bg='#000000'
        )
        self.speed_label.pack()
        
        tk.Label(
            speed_frame,
            text="km/h",
            font=('Arial', 20),
            fg='#ffffff',
            bg='#000000'
        ).pack()
        
        # Stats
        stats_frame = tk.Frame(main_frame, bg='#1a1a1a')
        stats_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(stats_frame, text="Max Speed:", font=('Arial', 14), 
                fg='#ffffff', bg='#1a1a1a').grid(row=0, column=0, sticky='w', padx=10, pady=5)
        self.max_speed_label = tk.Label(stats_frame, text="0.0 km/h", font=('Arial', 14, 'bold'), 
                                       fg='#ffff00', bg='#1a1a1a')
        self.max_speed_label.grid(row=0, column=1, sticky='e', padx=10, pady=5)
        
        stats_frame.columnconfigure(1, weight=1)
        
        # Auto-record controls
        record_frame = tk.Frame(main_frame, bg='#2a2a2a')
        record_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(record_frame, text="Auto Dashcam Recording", 
                font=('Arial', 16, 'bold'), fg='#ffffff', bg='#2a2a2a').pack(pady=5)
        
        auto_frame = tk.Frame(record_frame, bg='#2a2a2a')
        auto_frame.pack(fill=tk.X, padx=20, pady=5)
        
        tk.Label(auto_frame, text="Enable:", font=('Arial', 14), 
                fg='#ffffff', bg='#2a2a2a').pack(side=tk.LEFT)
        
        tk.Checkbutton(auto_frame, variable=self.auto_record_enabled,
                      command=self.toggle_auto_record,
                      bg='#2a2a2a', fg='#ffffff', selectcolor='#4a4a4a',
                      font=('Arial', 12)).pack(side=tk.RIGHT)
        
        tk.Label(record_frame, text=f"Records when speed > {self.recording_threshold} km/h",
                font=('Arial', 12), fg='#cccccc', bg='#2a2a2a').pack(pady=2)
        
        tk.Label(record_frame, text=f"Stops {self.stop_delay}s after speed < {self.recording_threshold} km/h",
                font=('Arial', 12), fg='#cccccc', bg='#2a2a2a').pack(pady=2)
        
        self.record_status_label = tk.Label(
            record_frame,
            text="Recording: OFF",
            font=('Arial', 14, 'bold'),
            fg='#ff0000',
            bg='#2a2a2a'
        )
        self.record_status_label.pack(pady=5)
        
        # Control buttons
        button_frame = tk.Frame(main_frame, bg='#000000')
        button_frame.pack(fill=tk.X, pady=20)
        
        self.start_button = tk.Button(
            button_frame,
            text="START MONITORING",
            command=self.toggle_monitoring,
            bg='#4CAF50',
            fg='white',
            font=('Arial', 16, 'bold'),
            height=2
        )
        self.start_button.pack(fill=tk.X, pady=(0, 10))
        
        # Reset and manual record buttons
        button_row = tk.Frame(button_frame, bg='#000000')
        button_row.pack(fill=tk.X)
        
        tk.Button(button_row, text="RESET", command=self.reset_data,
                 bg='#f44336', fg='white', font=('Arial', 14, 'bold'),
                 height=2).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        
        tk.Button(button_row, text="MANUAL REC", command=self.manual_record,
                 bg='#ff9800', fg='white', font=('Arial', 14, 'bold'),
                 height=2).pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(5, 0))
    
    def get_gps_speed(self):
        """Get speed from GPS"""
        if not self.is_android or not self.gps_available:
            # Simulate for testing
            return self.simulate_speed()
            
        try:
            result = subprocess.run(['termux-location', '-p', 'gps'], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                location_data = json.loads(result.stdout)
                # Speed is in m/s, convert to km/h
                speed_
