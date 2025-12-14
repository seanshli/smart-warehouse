package com.smartwarehouse.app.plugins;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.google.common.util.concurrent.ListenableFuture;

@CapacitorPlugin(name = "NativeBarcodeScanner")
public class NativeBarcodeScannerPlugin extends Plugin {
    private static final String TAG = "NativeBarcodeScanner";
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private PreviewView previewView;
    private FrameLayout scannerContainer;
    private BarcodeScanner barcodeScanner;
    private PluginCall currentCall;
    private boolean isScanning = false;
    private ExecutorService executorService;

    @Override
    public void load() {
        super.load();
        executorService = Executors.newSingleThreadExecutor();
        
        // Initialize ML Kit Barcode Scanner
            BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_CODE_39,
                Barcode.FORMAT_CODE_93,
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_PDF417,
                Barcode.FORMAT_AZTEC,
                Barcode.FORMAT_DATA_MATRIX,
                Barcode.FORMAT_CODABAR,
                Barcode.FORMAT_ITF
            )
            .build();
        barcodeScanner = BarcodeScanning.getClient(options);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("Context not available");
            return;
        }

        int permissionStatus = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA);
        boolean granted = permissionStatus == PackageManager.PERMISSION_GRANTED;
        boolean denied = permissionStatus == PackageManager.PERMISSION_DENIED;
        
        // Check if permission has been asked before
        boolean asked = ActivityCompat.shouldShowRequestPermissionRationale(
            getActivity(), 
            Manifest.permission.CAMERA
        ) || denied;

        JSObject result = new JSObject();
        result.put("granted", granted);
        result.put("denied", denied);
        result.put("asked", asked);
        
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            call.reject("Context not available");
            return;
        }

        int permissionStatus = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA);
        if (permissionStatus == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("denied", false);
            result.put("asked", true);
            call.resolve(result);
            return;
        }

        // Request permission
        ActivityCompat.requestPermissions(
            getActivity(),
            new String[]{Manifest.permission.CAMERA},
            CAMERA_PERMISSION_REQUEST_CODE
        );

        // Note: Actual permission result will be handled by onRequestPermissionsResult
        // For now, return current status
        JSObject result = new JSObject();
        result.put("granted", false);
        result.put("denied", permissionStatus == PackageManager.PERMISSION_DENIED);
        result.put("asked", true);
        call.resolve(result);
    }

    @PluginMethod
    public void startScan(PluginCall call) {
        currentCall = call;
        
        Context context = getContext();
        if (context == null) {
            call.reject("Context not available");
            return;
        }

        // Check permission
        int permissionStatus = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA);
        if (permissionStatus != PackageManager.PERMISSION_GRANTED) {
            // Request permission instead of rejecting
            FragmentActivity activity = getActivity();
            if (activity != null) {
                ActivityCompat.requestPermissions(
                    activity,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE
                );
                // Store call to resolve after permission granted
                // Note: Actual permission result will be handled by onRequestPermissionsResult
                // For now, we'll resolve with a message indicating permission was requested
                JSObject result = new JSObject();
                result.put("permissionRequested", true);
                call.resolve(result);
            } else {
                call.reject("Camera permission not granted and activity not available");
            }
            return;
        }

        if (isScanning) {
            call.reject("Scanner is already running");
            return;
        }

        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        // Run on UI thread
        activity.runOnUiThread(() -> {
            try {
                setupCamera(activity);
            } catch (Exception e) {
                Log.e(TAG, "Error setting up camera", e);
                call.reject("Failed to start camera: " + e.getMessage());
            }
        });
    }
    
    @Override
    public void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted, start scanning
                FragmentActivity activity = getActivity();
                if (activity != null && currentCall != null) {
                    activity.runOnUiThread(() -> {
                        try {
                            setupCamera(activity);
                        } catch (Exception e) {
                            Log.e(TAG, "Error setting up camera after permission grant", e);
                            if (currentCall != null) {
                                currentCall.reject("Failed to start camera: " + e.getMessage());
                                currentCall = null;
                            }
                        }
                    });
                }
            } else {
                // Permission denied
                if (currentCall != null) {
                    currentCall.reject("Camera permission denied");
                    currentCall = null;
                }
            }
        }
    }

    private void setupCamera(FragmentActivity activity) {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(activity);
        
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                    
                    // Create preview view
                    previewView = new PreviewView(activity);
                    previewView.setLayoutParams(new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ));

                    // Create scanner container overlay
                    scannerContainer = new FrameLayout(activity);
                    scannerContainer.setLayoutParams(new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    scannerContainer.addView(previewView);

                    // Add close button
                    Button closeButton = new Button(activity);
                    closeButton.setText("Cancel");
                    closeButton.setLayoutParams(new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ));
                    FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) closeButton.getLayoutParams();
                    params.setMargins(0, 50, 50, 0);
                    params.gravity = android.view.Gravity.TOP | android.view.Gravity.END;
                    closeButton.setLayoutParams(params);
                    closeButton.setOnClickListener(v -> {
                        stopScanning();
                        if (currentCall != null) {
                            JSObject result = new JSObject();
                            result.put("cancelled", true);
                            currentCall.resolve(result);
                            currentCall = null;
                        }
                    });
                    scannerContainer.addView(closeButton);

                    // Add scanner container to activity
                    ViewGroup rootView = activity.findViewById(android.R.id.content);
                    if (rootView != null) {
                        rootView.addView(scannerContainer);
                    }

                    // Setup camera preview
                    Preview preview = new Preview.Builder().build();
                    preview.setSurfaceProvider(previewView.getSurfaceProvider());

                    // Setup image analysis for barcode detection
                    ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();

                    imageAnalysis.setAnalyzer(executorService, image -> {
                        if (!isScanning) {
                            image.close();
                            return;
                        }

                        InputImage inputImage = InputImage.fromMediaImage(
                            image.getImage(),
                            image.getImageInfo().getRotationDegrees()
                        );

                        barcodeScanner.process(inputImage)
                            .addOnSuccessListener(barcodes -> {
                                if (!isScanning) {
                                    image.close();
                                    return;
                                }

                                for (Barcode barcode : barcodes) {
                                    String rawValue = barcode.getRawValue();
                                    if (rawValue != null && !rawValue.isEmpty()) {
                                        // Barcode detected
                                        stopScanning();
                                        
                                        if (currentCall != null) {
                                            JSObject result = new JSObject();
                                            result.put("hasContent", true);
                                            result.put("content", rawValue);
                                            result.put("format", getBarcodeFormatString(barcode.getFormat()));
                                            currentCall.resolve(result);
                                            currentCall = null;
                                        }
                                        
                                        // Vibrate
                                        android.os.Vibrator vibrator = (android.os.Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
                                        if (vibrator != null && vibrator.hasVibrator()) {
                                            vibrator.vibrate(200);
                                        }
                                        
                                        image.close();
                                        return;
                                    }
                                }
                                image.close();
                            })
                            .addOnFailureListener(e -> {
                                Log.e(TAG, "Barcode scanning failed", e);
                                image.close();
                            });
                    });

                    // Select back camera
                    CameraSelector cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                        .build();

                    // Bind camera to lifecycle
                    camera = cameraProvider.bindToLifecycle(
                        activity,
                        cameraSelector,
                        preview,
                        imageAnalysis
                    );

                    isScanning = true;
                    Log.d(TAG, "Camera started successfully");

            } catch (ExecutionException | InterruptedException e) {
                Log.e(TAG, "Error setting up camera", e);
                if (currentCall != null) {
                    currentCall.reject("Failed to start camera: " + e.getMessage());
                    currentCall = null;
                }
            }
        }, ContextCompat.getMainExecutor(activity));
    }

    private void stopScanning() {
        isScanning = false;
        
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            cameraProvider = null;
        }
        
        if (camera != null) {
            camera = null;
        }

        FragmentActivity activity = getActivity();
        if (activity != null && scannerContainer != null) {
            activity.runOnUiThread(() -> {
                ViewGroup rootView = activity.findViewById(android.R.id.content);
                if (rootView != null && scannerContainer != null) {
                    rootView.removeView(scannerContainer);
                }
                scannerContainer = null;
                previewView = null;
            });
        }
    }

    @PluginMethod
    public void stopScan(PluginCall call) {
        stopScanning();
        call.resolve();
    }

    @PluginMethod
    public void hideBackground(PluginCall call) {
        // Background is already hidden when scanner is shown
        call.resolve();
    }

    @PluginMethod
    public void showBackground(PluginCall call) {
        // Background is restored when scanner is closed
        call.resolve();
    }

    private String getBarcodeFormatString(int format) {
        switch (format) {
            case Barcode.FORMAT_QR_CODE:
                return "QR_CODE";
            case Barcode.FORMAT_EAN_13:
                return "EAN_13";
            case Barcode.FORMAT_EAN_8:
                return "EAN_8";
            case Barcode.FORMAT_UPC_A:
                return "UPC_A";
            case Barcode.FORMAT_UPC_E:
                return "UPC_E";
            case Barcode.FORMAT_CODE_39:
                return "CODE_39";
            case Barcode.FORMAT_CODE_93:
                return "CODE_93";
            case Barcode.FORMAT_CODE_128:
                return "CODE_128";
            case Barcode.FORMAT_PDF417:
                return "PDF417";
            case Barcode.FORMAT_AZTEC:
                return "AZTEC";
            case Barcode.FORMAT_DATA_MATRIX:
                return "DATA_MATRIX";
            case Barcode.FORMAT_CODABAR:
                return "CODABAR";
            case Barcode.FORMAT_ITF:
                return "ITF";
            default:
                return "UNKNOWN";
        }
    }

    @Override
    public void handleOnDestroy() {
        super.handleOnDestroy();
        stopScanning();
        if (barcodeScanner != null) {
            barcodeScanner.close();
        }
        if (executorService != null) {
            executorService.shutdown();
        }
    }
}

