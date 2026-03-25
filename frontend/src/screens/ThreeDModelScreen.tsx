import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { Asset } from 'expo-asset';
import { spacing } from '../theme';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { MODEL_REGISTRY } from '../data/modelRegistry';
import { useResponsive } from '../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThreeDModelScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { model } = route.params as { model?: string } || {};
    const { containerStyle } = useResponsive();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRotate, setAutoRotate] = useState(false);
    const [wireframe, setWireframe] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Gesture state
    const scaleRef = useRef(1);
    const rotationRef = useRef({ x: 0, y: 0 });
    const lastScaleRef = useRef(1);
    const initialScaleRef = useRef(1); // Store initial scale for reset

    // Animation frame reference
    const animationFrameRef = useRef<number>(0);
    const rendererRef = useRef<any>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);

    // Auto-rotate ref to access state inside animation loop without dependency issues
    const autoRotateRef = useRef(false);
    const wireframeRef = useRef(false);

    useEffect(() => {
        autoRotateRef.current = autoRotate;
    }, [autoRotate]);

    useEffect(() => {
        wireframeRef.current = wireframe;
        // Update wireframe mode for all meshes
        if (modelRef.current) {
            modelRef.current.traverse((child: any) => {
                if (child.isMesh) {
                    child.material.wireframe = wireframe;
                }
            });
        }
    }, [wireframe]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Cleanup WebGL context if needed
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, []);

    const onContextCreate = async (gl: any) => {
        try {
            // Setup renderer using dynamic import
            const ExpoTHREE = await import('expo-three');
            const renderer = new ExpoTHREE.Renderer({ gl });
            renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
            renderer.setClearColor(0xffffff, 1); // White background
            rendererRef.current = renderer;

            // Setup scene
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            // Setup camera
            const camera = new THREE.PerspectiveCamera(
                75,
                gl.drawingBufferWidth / gl.drawingBufferHeight,
                0.1,
                1000
            );
            camera.position.set(0, 0, 4); // Moved camera closer
            cameraRef.current = camera;

            // Add lights - Adjusted for white background
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly reduced ambient
            scene.add(ambientLight);

            const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
            hemisphereLight.position.set(0, 20, 0);
            scene.add(hemisphereLight);

            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
            directionalLight1.position.set(5, 10, 7);
            scene.add(directionalLight1);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight2.position.set(-5, -5, -5);
            scene.add(directionalLight2);

            // Load model
            const modelName = model || 'Thorax and Abdomen';

            if (MODEL_REGISTRY[modelName]) {
                const asset = Asset.fromModule(MODEL_REGISTRY[modelName]);
                await asset.downloadAsync();

                const loader = new GLTFLoader();

                // Load the model
                const gltf = await new Promise<any>((resolve, reject) => {
                    loader.load(
                        asset.uri || asset.localUri || '',
                        resolve,
                        undefined,
                        reject
                    );
                });

                const loadedModel = gltf.scene;
                modelRef.current = loadedModel;

                // Center and scale the model
                if (loadedModel) {
                    const box = new THREE.Box3().setFromObject(loadedModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2.5 / maxDim; // Increased scale factor for better visibility

                    loadedModel.scale.set(scale, scale, scale);
                    loadedModel.position.sub(center.multiplyScalar(scale));

                    // Store initial scale for reset
                    initialScaleRef.current = scale;
                    scaleRef.current = scale;
                    lastScaleRef.current = scale;

                    scene.add(loadedModel);
                }
                setLoading(false);
            } else {
                throw new Error(`Model "${modelName}" not found in registry`);
            }

            // Animation loop
            const render = () => {
                animationFrameRef.current = requestAnimationFrame(render);

                if (modelRef.current) {
                    // Auto-rotation logic
                    if (autoRotateRef.current) {
                        rotationRef.current.y += 0.005;
                    }

                    // Apply gesture transformations
                    modelRef.current.rotation.x = rotationRef.current.x;
                    modelRef.current.rotation.y = rotationRef.current.y;

                    // Apply scale directly
                    const currentScale = scaleRef.current;
                    modelRef.current.scale.set(currentScale, currentScale, currentScale);
                }

                renderer.render(scene, camera);
                gl.endFrameEXP();
            };

            render();

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Failed to load model');
            setLoading(false);
        }
    };

    const handlePan = (event: any) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            // Reduced sensitivity for smoother control
            const newX = rotationRef.current.x + event.nativeEvent.translationY * 0.003;
            const newY = rotationRef.current.y + event.nativeEvent.translationX * 0.003;

            // Limit rotation to prevent model from flipping too much
            rotationRef.current = {
                x: Math.max(-Math.PI, Math.min(newX, Math.PI)),
                y: newY % (Math.PI * 2), // Allow full rotation on Y axis
            };
        }
    };

    const handlePinch = (event: any) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            // Calculate new scale based on pinch
            const newScale = lastScaleRef.current * event.nativeEvent.scale;
            // Limit scale with better bounds
            scaleRef.current = Math.max(0.3, Math.min(newScale, 8.0));
        } else if (event.nativeEvent.state === State.END) {
            lastScaleRef.current = scaleRef.current;
        }
    };

    // Manual controls with better increments
    const handleZoomIn = () => {
        const newScale = scaleRef.current * 1.15;
        scaleRef.current = Math.min(newScale, 8.0);
        lastScaleRef.current = scaleRef.current;
    };

    const handleZoomOut = () => {
        const newScale = scaleRef.current / 1.15;
        scaleRef.current = Math.max(newScale, 0.3);
        lastScaleRef.current = scaleRef.current;
    };

    const handleReset = () => {
        scaleRef.current = initialScaleRef.current;
        lastScaleRef.current = initialScaleRef.current;
        rotationRef.current = { x: 0, y: 0 };
        setAutoRotate(false);
        setWireframe(false);
    };

    const toggleAutoRotate = () => {
        setAutoRotate(!autoRotate);
    };

    const toggleWireframe = () => {
        setWireframe(!wireframe);
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const handleRotateLeft = () => {
        rotationRef.current.y -= 0.15; // Slightly larger increment for better control
    };

    const handleRotateRight = () => {
        rotationRef.current.y += 0.15;
    };

    const handleRotateUp = () => {
        const newX = rotationRef.current.x - 0.15;
        rotationRef.current.x = Math.max(-Math.PI, Math.min(newX, Math.PI));
    };

    const handleRotateDown = () => {
        const newX = rotationRef.current.x + 0.15;
        rotationRef.current.x = Math.max(-Math.PI, Math.min(newX, Math.PI));
    };

    // Camera preset views
    const setFrontView = () => {
        rotationRef.current = { x: 0, y: 0 };
    };

    const setTopView = () => {
        rotationRef.current = { x: -Math.PI / 2, y: 0 };
    };

    const setSideView = () => {
        rotationRef.current = { x: 0, y: Math.PI / 2 };
    };

    // Web-specific: Load Model URI
    const [webModelUri, setWebModelUri] = useState<string | null>(null);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const loadWebModel = async () => {
                try {
                    const modelName = model || 'Thorax and Abdomen';
                    if (MODEL_REGISTRY[modelName]) {
                        const asset = Asset.fromModule(MODEL_REGISTRY[modelName]);
                        await asset.downloadAsync();
                        setWebModelUri(asset.uri);
                    }
                } catch (e) {
                    console.error("Failed to load web model", e);
                }
            };
            loadWebModel();
        }
    }, [model]);

    if (Platform.OS === 'web') {
        const srcDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; background-color: #f5f5f5; font-family: sans-serif; }
                    model-viewer { width: 100vw; height: 100vh; }
                    .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; }
                </style>
                <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
            </head>
            <body>
                ${webModelUri ? `
                <model-viewer
                    src="${webModelUri}"
                    camera-controls
                    touch-action="pan-y"
                    auto-rotate
                    shadow-intensity="1"
                    shadow-softness="0.5"
                    exposure="1"
                    camera-orbit="0deg 75deg 105%"
                    min-camera-orbit="auto auto auto"
                    max-camera-orbit="auto auto auto"
                    style="background-color: transparent;"
                >
                    <div class="loading" slot="poster">Loading 3D Model...</div>
                </model-viewer>
                ` : '<div class="loading">Initializing Viewer...</div>'}
            </body>
            </html>
        `;

        return (
            <View style={styles.container}>
                {/* Modern Gradient Header (Matches Native) */}
                <LinearGradient
                    colors={['#667EEA', '#764BA2', '#5B4B8A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header]}
                >
                    <View style={[styles.decorativeCircle, { top: -40, right: -30, width: 120, height: 120 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} />

                    <View style={[containerStyle, styles.headerContent, { paddingTop: 20 }]}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text variant="headlineSmall" style={styles.title}>3D Model Viewer</Text>
                            <Text style={styles.subtitle}>{model || 'Thorax and Abdomen'}</Text>
                        </View>
                        <View style={{ width: 48 }} />
                    </View>
                </LinearGradient>

                <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                    <iframe
                        srcDoc={srcDoc}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="3D Model Viewer"
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Modern Gradient Header */}
            <LinearGradient
                colors={['#667EEA', '#764BA2', '#5B4B8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                {/* Decorative circles */}
                <View style={[styles.decorativeCircle, { top: -40, right: -30, width: 120, height: 120 }]} />
                <View style={[styles.decorativeCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} />

                <View style={[containerStyle, styles.headerContent]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text variant="headlineSmall" style={styles.title}>
                            3D Model Viewer
                        </Text>
                        <Text style={styles.subtitle}>
                            {model || 'Thorax and Abdomen'}
                        </Text>
                    </View>
                    <View style={{ width: 48 }} />
                </View>
            </LinearGradient>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.errorSubText}>Please check the model file and try again.</Text>
                </View>
            ) : (
                <View style={styles.contentContainer}>
                    <PinchGestureHandler onGestureEvent={handlePinch}>
                        <PanGestureHandler onGestureEvent={handlePan}>
                            <View style={styles.glContainer}>
                                <GLView
                                    style={styles.glView}
                                    onContextCreate={onContextCreate}
                                />
                                {loading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color="#000" />
                                        <Text style={styles.loadingText}>Loading 3D Model...</Text>
                                    </View>
                                )}
                            </View>
                        </PanGestureHandler>
                    </PinchGestureHandler>

                    {/* Controls Overlay - Redesigned for better UX */}
                    {showControls && (
                        <View style={styles.controlsContainer}>
                            {/* Top Row: Camera Presets + Wireframe */}
                            <View style={styles.topControlsRow}>
                                <View style={styles.presetsGroup}>
                                    <Text style={styles.controlLabel}>Quick Views</Text>
                                    <View style={styles.presetViewsRow}>
                                        <TouchableOpacity
                                            onPress={setFrontView}
                                            style={styles.presetButtonCompact}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                                            <Text style={styles.presetTextCompact}>Front</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={setTopView}
                                            style={styles.presetButtonCompact}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="arrow-up-bold" size={18} color="#fff" />
                                            <Text style={styles.presetTextCompact}>Top</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={setSideView}
                                            style={styles.presetButtonCompact}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="arrow-right-bold" size={18} color="#fff" />
                                            <Text style={styles.presetTextCompact}>Side</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={toggleWireframe}
                                    style={[styles.wireframeButton, wireframe && styles.wireframeButtonActive]}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name="cube-outline"
                                        size={20}
                                        color={wireframe ? "#fff" : "#667EEA"}
                                    />
                                    <Text style={[styles.wireframeText, wireframe && styles.wireframeTextActive]}>
                                        Wireframe
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Middle Row: Rotation Controls */}
                            <View style={styles.rotationSection}>
                                <Text style={styles.controlLabel}>Rotate</Text>
                                <View style={styles.dpadContainer}>
                                    <TouchableOpacity onPress={handleRotateUp} style={styles.dpadButton} activeOpacity={0.7}>
                                        <MaterialCommunityIcons name="chevron-up" size={28} color="#667EEA" />
                                    </TouchableOpacity>
                                    <View style={styles.dpadRow}>
                                        <TouchableOpacity onPress={handleRotateLeft} style={styles.dpadButton} activeOpacity={0.7}>
                                            <MaterialCommunityIcons name="chevron-left" size={28} color="#667EEA" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={toggleAutoRotate}
                                            style={[styles.dpadButtonCenter, autoRotate && styles.dpadButtonCenterActive]}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons
                                                name={autoRotate ? "pause" : "play"}
                                                size={24}
                                                color={autoRotate ? "#fff" : "#667EEA"}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleRotateRight} style={styles.dpadButton} activeOpacity={0.7}>
                                            <MaterialCommunityIcons name="chevron-right" size={28} color="#667EEA" />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity onPress={handleRotateDown} style={styles.dpadButton} activeOpacity={0.7}>
                                        <MaterialCommunityIcons name="chevron-down" size={28} color="#667EEA" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Bottom Row: Zoom + Reset */}
                            <View style={styles.bottomControlsRow}>
                                <View style={styles.zoomGroup}>
                                    <Text style={styles.controlLabel}>Zoom</Text>
                                    <View style={styles.zoomControls}>
                                        <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton} activeOpacity={0.7}>
                                            <MaterialCommunityIcons name="minus" size={24} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton} activeOpacity={0.7}>
                                            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={handleReset} style={styles.resetButtonNew} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="restore" size={20} color="#fff" />
                                    <Text style={styles.resetButtonText}>Reset View</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.instructionText}>
                                💡 Pinch to zoom • Drag to rotate
                            </Text>
                        </View>
                    )}

                    {/* Toggle Controls Button */}
                    <TouchableOpacity
                        onPress={toggleControls}
                        style={styles.toggleControlsButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={showControls ? "eye-off" : "eye"}
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingBottom: spacing.xxl, // Increased padding for better proportion
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 32, // Matches Home/ModelList
        borderBottomRightRadius: 32, // Matches Home/ModelList
        shadowColor: '#5B4B8A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden', // Ensures gradient respects border radius
    },
    decorativeCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1000,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 22,
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 2,
        fontWeight: '500',
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    glContainer: {
        flex: 1,
    },
    glView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    loadingText: {
        color: '#000',
        marginTop: spacing.md,
        fontSize: 16,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 600,
        alignItems: 'stretch',
        paddingHorizontal: 20,
        pointerEvents: 'box-none',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    topControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    presetsGroup: {
        flex: 1,
    },
    controlLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.5)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    presetViewsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    presetButtonCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667EEA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        elevation: 3,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    presetTextCompact: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    wireframeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        gap: 6,
        borderWidth: 2,
        borderColor: '#667EEA',
        elevation: 2,
    },
    wireframeButtonActive: {
        backgroundColor: '#673AB7',
        borderColor: '#673AB7',
    },
    wireframeText: {
        color: '#667EEA',
        fontSize: 12,
        fontWeight: '700',
    },
    wireframeTextActive: {
        color: '#fff',
    },
    rotationSection: {
        marginBottom: 16,
    },
    dpadContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        borderRadius: 20,
        padding: spacing.sm,
    },
    dpadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dpadButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dpadButtonCenter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        borderWidth: 2,
        borderColor: '#667EEA',
    },
    dpadButtonCenterActive: {
        backgroundColor: '#667EEA',
        borderColor: '#667EEA',
    },
    bottomControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
        gap: 12,
    },
    zoomGroup: {
        flex: 1,
    },
    zoomControls: {
        flexDirection: 'row',
        gap: 8,
    },
    zoomButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#667EEA',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    resetButtonNew: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#764BA2',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 24,
        gap: 8,
        elevation: 4,
        shadowColor: '#764BA2',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    toggleControlsButton: {
        position: 'absolute',
        top: 80,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    instructionText: {
        color: 'rgba(0,0,0,0.5)',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    errorSubText: {
        color: 'rgba(0,0,0,0.6)',
        textAlign: 'center',
    },
});

export default ThreeDModelScreen;
